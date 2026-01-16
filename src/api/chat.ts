import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EventSource from "react-native-sse";
import { queryKeys } from "./queryClient";
import { ENDPOINTS, API_BASE_URL } from "../config/api";
import { ChatMessage } from "../types/chat";
import {
  useChatStore,
  useAgentStore,
  useRequestStore,
  usePopupStore,
} from "../store";
import { parseStreamChunk, createMessageId } from "../utils/parseStream";

interface ChatPromptVariables {
  question: string;
  sessionId: string | null;
  agent?: string;
  userEmail: string;
  files?: any[];
  isPromptFromAgentPage?: boolean;
  /** Use session-based cache key (for continuing history chats) */
  isHistoryChat?: boolean;
}

/**
 * Get chat history from cache (for display)
 */
export const useChatHistory = (agentId?: string) => {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.chat(agentId);

  return useQuery({
    queryKey,
    queryFn: () => queryClient.getQueryData<ChatMessage[]>(queryKey) ?? [],
    staleTime: Infinity,
  });
};

/**
 * Get chat by session ID
 */
export const useChatBySessionId = (sessionId?: string | null) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: sessionId ? queryKeys.chatById(sessionId) : ["chat", "none"],
    queryFn: () =>
      sessionId
        ? queryClient.getQueryData<ChatMessage[]>(
            queryKeys.chatById(sessionId)
          ) ?? []
        : [],
    enabled: !!sessionId,
    staleTime: Infinity,
  });
};

/**
 * Send a chat prompt with streaming response using SSE
 */
export const useMutateChatPrompt = () => {
  const queryClient = useQueryClient();
  const { setIsPromptPaused, setLastPrompt } = useChatStore();
  const { setSelectedAgent } = useAgentStore();
  const { setAbortController, setMessageIdUser } = useRequestStore();
  const { addSnackbar } = usePopupStore();

  return useMutation({
    mutationFn: async (variables: ChatPromptVariables) => {
      const {
        question,
        sessionId,
        agent,
        userEmail,
        files = [],
        isPromptFromAgentPage = false,
        isHistoryChat = false,
      } = variables;

      // Generate unique message IDs
      const messageIdUser = createMessageId("user");
      const messageIdAi = createMessageId("ai");

      // Create abort controller for cancellation
      const controller = new AbortController();
      setAbortController(controller);
      setMessageIdUser(messageIdUser);

      // Update agent if specified
      if (agent) {
        setSelectedAgent(agent);
      }

      // Update UI state
      setIsPromptPaused(true);
      setLastPrompt(question);

      // Determine cache key based on context
      const chatKey =
        isHistoryChat && sessionId
          ? queryKeys.chatById(sessionId)
          : agent
          ? queryKeys.chat(agent)
          : queryKeys.chat();

      // Add user message to cache optimistically
      queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => [
        ...old,
        {
          role: "user",
          message: question,
          message_id: messageIdUser,
          session_id: sessionId || "",
          order: old.length,
        },
        {
          role: "ai",
          message: "",
          message_id: messageIdAi,
          session_id: sessionId || "",
          status: ["Processing..."],
          order: old.length + 1,
        },
      ]);

      // Accumulation variables
      let accumulatedMessage = "";
      let accumulatedStatus: string[] = [];
      let accumulatedContents: any[] = [];

      return new Promise((resolve, reject) => {
        const requestBody = {
          question,
          session_id: sessionId,
          message_id_user: messageIdUser,
          message_id_ai: messageIdAi,
          user_id: userEmail,
          selected_backend: agent || undefined,
          is_prompt_from_agent_page: isPromptFromAgentPage,
          gcs_uris: {
            "is_unstructured=True": [],
            "is_unstructured=False": [],
          },
          files: files.map((f) => ({
            name: f.name,
            type: f.type,
          })),
        };

        const url = `${API_BASE_URL}${ENDPOINTS.CHAT}`;

        // Create SSE connection using react-native-sse
        const es = new EventSource(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "ngrok-skip-browser-warning": "true", // Bypass ngrok warning page
          },
          body: JSON.stringify(requestBody),
          pollingInterval: 0, // Disable polling, use true streaming
        });

        console.log("SSE: Creating connection to", url);

        // Handle abort
        controller.signal.addEventListener("abort", () => {
          es.close();
          queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
            const updated = [...old];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "ai") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                message: updated[lastIndex].message || "Response generation cancelled.",
                status: ["Cancelled"],
              };
            }
            return updated;
          });
          reject(new DOMException("Aborted", "AbortError"));
        });

        // Helper to process SSE event
        const processSSEEvent = (eventType: string, eventData: string) => {
          if (!eventData) return;

          try {
            // Reconstruct the full SSE format for parseStreamChunk
            const fullChunk = `event: ${eventType}\ndata: ${eventData}`;
            console.log("SSE Event:", eventType, eventData.substring(0, 100));

            const parsed = parseStreamChunk(fullChunk);

            if (parsed) {
              // Accumulate message content
              if (parsed.message) {
                accumulatedMessage += parsed.message;
              }

              // Accumulate status messages
              if (parsed.status && parsed.status.length > 0) {
                for (const status of parsed.status) {
                  if (!accumulatedStatus.includes(status)) {
                    accumulatedStatus.push(status);
                  }
                }
              }

              // Accumulate contents
              if (parsed.contents && parsed.contents.length > 0) {
                accumulatedContents = [...accumulatedContents, ...parsed.contents];
              }

              // Update the AI message in cache - this triggers React re-render
              queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
                const updated = [...old];
                const lastIndex = updated.length - 1;

                if (lastIndex >= 0 && updated[lastIndex].role === "ai") {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    message: accumulatedMessage,
                    status: accumulatedStatus.length > 0 ? [...accumulatedStatus] : ["Processing..."],
                    contents: accumulatedContents.length > 0 ? accumulatedContents : undefined,
                    suggestedAgents: parsed.suggestedAgents || updated[lastIndex].suggestedAgents,
                  };
                }

                return updated;
              });
            }
          } catch (e) {
            console.error("Error parsing SSE event:", e);
          }
        };

        // Listen for specific SSE event types
        const eventTypes = ["START", "DETECT_INTENT", "CLARIFY_INTENT", "CALL_BACKEND", "END", "ERROR"];
        eventTypes.forEach((eventType) => {
          (es as any).addEventListener(eventType, (event: any) => {
            processSSEEvent(eventType, event.data || "{}");
          });
        });

        // Also listen for generic message events (fallback)
        es.addEventListener("message", (event: any) => {
          if (!event.data) return;
          console.log("SSE generic message:", event.data?.substring?.(0, 100) || event.data);
          processSSEEvent("message", event.data);
        });

        // Handle SSE errors
        es.addEventListener("error", (event: any) => {
          console.error("SSE error:", event);
          es.close();

          // Only treat as error if we haven't received any message
          if (!accumulatedMessage) {
            queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
              const updated = [...old];
              const lastIndex = updated.length - 1;
              if (lastIndex >= 0 && updated[lastIndex].role === "ai") {
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  message: "Sorry, something went wrong. Please try again.",
                  status: ["Error"],
                };
              }
              return updated;
            });

            addSnackbar({
              label: "Failed to send message. Please try again.",
              variant: "danger",
              hasAction: false,
            });

            setIsPromptPaused(false);
            setAbortController(null);
            reject(new Error("SSE connection error"));
          }
        });

        // Handle SSE close (stream complete)
        es.addEventListener("close", () => {
          // Clear status on completion
          queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
            const updated = [...old];
            const lastIndex = updated.length - 1;

            if (lastIndex >= 0 && updated[lastIndex].role === "ai") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                message: accumulatedMessage || "Response received.",
                status: undefined,
              };
            }

            return updated;
          });

          setIsPromptPaused(false);
          setAbortController(null);
          resolve({ success: true, messageIdAi });
        });

        // Handle 'open' event
        es.addEventListener("open", () => {
          console.log("SSE: Connection opened successfully");
        });

        // Debug: Log all raw events
        (es as any).onmessage = (event: any) => {
          console.log("SSE RAW onmessage:", JSON.stringify(event).substring(0, 200));
        };
      });
    },
    onSuccess: () => {
      // Invalidate chat titles to refresh sidebar
      queryClient.invalidateQueries({ queryKey: queryKeys.chatTitles });
    },
  });
};

/**
 * Cancel an in-progress chat request
 */
export const useCancelChatPrompt = () => {
  const queryClient = useQueryClient();
  const { abortController, messageIdUser } = useRequestStore();
  const { setIsPromptPaused } = useChatStore();
  const { addToast } = usePopupStore();

  return useMutation({
    mutationFn: async ({
      sessionId,
      chatKey,
    }: {
      sessionId: string;
      chatKey: readonly string[] | readonly (string | { id: string })[];
    }) => {
      // Abort the SSE connection
      abortController?.abort();

      // Call cancel endpoint
      if (sessionId && messageIdUser) {
        try {
          const response = await fetch(`${API_BASE_URL}${ENDPOINTS.CHAT_CANCEL}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId,
              message_id_user: messageIdUser,
            }),
          });
          if (!response.ok) {
            console.error("Cancel request failed");
          }
        } catch (e) {
          console.error("Cancel request error:", e);
        }
      }

      // Update cache with cancelled status
      queryClient.setQueryData<ChatMessage[]>(
        chatKey as string[],
        (old = []) => {
          const updated = [...old];
          const lastIndex = updated.length - 1;

          if (lastIndex >= 0 && updated[lastIndex].role === "ai") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              status: ["Generating Response Cancelled"],
            };
          }

          return updated;
        }
      );

      return { cancelled: true };
    },
    onSuccess: () => {
      setIsPromptPaused(false);
      addToast({
        variant: "default",
        label: "Response generation cancelled.",
      });
    },
  });
};

/**
 * Clear chat for a specific agent or general chat
 */
export const useClearChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId }: { agentId?: string }) => {
      const chatKey = agentId ? queryKeys.chat(agentId) : queryKeys.chat();
      queryClient.setQueryData(chatKey, []);
      return { cleared: true };
    },
  });
};
