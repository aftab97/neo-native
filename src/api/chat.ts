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
  /** Agent to route the request to (backend) */
  agent?: string;
  /** Agent for cache key (when different from routing agent, e.g., card submits) */
  cacheAgent?: string;
  userEmail: string;
  files?: any[];
  /** When true, use session-based cache key ['chat', { id: session_id }] */
  isPromptFromChatPage?: boolean;
  /** When true, use agent-based cache key ['chat', agent] */
  isPromptFromAgentPage?: boolean;
  /** When true, skip adding user message to cache (used for adaptive card submissions) */
  isJson?: boolean;
}

/**
 * Get chat history from cache (for display)
 * Data is populated via setQueryData from mutations
 */
export const useChatHistory = (agentId?: string) => {
  const queryKey = queryKeys.chat(agentId);

  return useQuery<ChatMessage[]>({
    queryKey,
    // Return empty array - data is set via setQueryData in mutations
    queryFn: () => [],
    staleTime: Infinity,
    // Ensure we always return an array even if cache is empty
    placeholderData: [],
  });
};

/**
 * Get chat by session ID
 * Data is populated via setQueryData from useMutateChatHistory and mutations
 */
export const useChatBySessionId = (sessionId?: string | null) => {
  return useQuery<ChatMessage[]>({
    queryKey: sessionId ? queryKeys.chatById(sessionId) : ["chat", "none"],
    // Return empty array - data is set via setQueryData
    queryFn: () => [],
    enabled: !!sessionId,
    staleTime: Infinity,
    // Ensure we always return an array even if cache is empty
    placeholderData: [],
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
        cacheAgent,
        userEmail,
        files = [],
        isPromptFromChatPage = false,
        isPromptFromAgentPage = false,
        isJson = false,
      } = variables;

      // Use cacheAgent for cache key if provided, otherwise fall back to agent
      const agentForCache = cacheAgent ?? agent;

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

      // Determine cache key based on context (matches web app logic)
      // - isPromptFromChatPage: use session-based key ['chat', { id: session_id }]
      // - isPromptFromAgentPage: use agent-based key ['chat', agentForCache]
      // - Neither: use general chat key ['chat']
      // Note: agentForCache may differ from agent (e.g., card submits route to 'action' but cache to current agent)
      const chatKey = isPromptFromChatPage
        ? queryKeys.chatById(sessionId || "")
        : isPromptFromAgentPage
        ? queryKeys.chat(agentForCache)
        : queryKeys.chat();

      // Add messages to cache optimistically
      // When isJson is true (adaptive card submissions), skip adding user message
      queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
        const newMessages: ChatMessage[] = [];

        // Calculate order based on max existing order, not array length
        // This handles cases where messages were filtered (non-contiguous orders)
        const maxOrder = old.reduce(
          (max, msg) => (msg.order !== undefined ? Math.max(max, msg.order) : max),
          -1
        );
        const nextOrder = maxOrder + 1;

        // Only add user message if not a JSON submission (adaptive card)
        if (!isJson) {
          newMessages.push({
            role: "user",
            message: question,
            message_id: messageIdUser,
            session_id: sessionId || "",
            order: nextOrder,
          });
        }

        // Always add AI message placeholder
        newMessages.push({
          role: "ai",
          message: "",
          message_id: messageIdAi,
          session_id: sessionId || "",
          status: ["Processing..."],
          order: nextOrder + (isJson ? 0 : 1),
        });

        return [...old, ...newMessages];
      });

      // Accumulation variables
      let accumulatedMessage = "";
      let accumulatedStatus: string[] = [];
      let accumulatedContents: any[] = [];
      let isCompleted = false; // Guard against double-completion

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

        // Helper to complete the stream and reset state
        const completeStream = () => {
          if (isCompleted) return; // Prevent double-completion
          isCompleted = true;
          es.close();

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
        };

        // Listen for specific SSE event types
        const eventTypes = ["START", "DETECT_INTENT", "CLARIFY_INTENT", "CALL_BACKEND"];
        eventTypes.forEach((eventType) => {
          (es as any).addEventListener(eventType, (event: any) => {
            processSSEEvent(eventType, event.data || "{}");
          });
        });

        // Handle END event specially - this signals stream completion
        (es as any).addEventListener("END", (event: any) => {
          console.log("SSE: END event received, completing stream");
          processSSEEvent("END", event.data || "{}");
          completeStream();
        });

        // Handle ERROR event specially
        (es as any).addEventListener("ERROR", (event: any) => {
          console.error("SSE: ERROR event from server:", event.data);
          processSSEEvent("ERROR", event.data || "{}");
          completeStream();
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

        // Handle SSE close (stream complete) - fallback if END event doesn't fire
        es.addEventListener("close", () => {
          console.log("SSE: close event received");
          completeStream();
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
