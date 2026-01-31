import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EventSource from "react-native-sse";
import { queryKeys } from "./queryClient";
import { ENDPOINTS, API_BASE_URL } from "./config";
import { ChatMessage } from "../types/chat";
import {
  useChatStore,
  useAgentStore,
  useRequestStore,
  usePopupStore,
  useFileStore,
} from "../store";
import { parseStreamChunk, createMessageId } from "../tools/parseStream";
import { mergeAllGcsUris } from "../tools/mergeGcsUris";

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
        isPromptFromChatPage = false,
        isPromptFromAgentPage = false,
        isJson = false,
      } = variables;

      // Get files from store and filter out files with errors (matching web app)
      const filesFromStore = useFileStore.getState().files;
      console.log('[Chat] Files from store:', filesFromStore.map(f => ({
        id: f.id,
        name: f.name,
        error: f.error,
        loading: f.loading,
        hasProcessFileResponse: !!f.processFileResponse,
        hasGcsUris: !!f.processFileResponse?.fileResponse?.gcs_uris,
        gcsUris: f.processFileResponse?.fileResponse?.gcs_uris,
      })));
      const validFiles = filesFromStore.filter((file) => !file.error);

      // Hide files from prompt bar immediately when sending
      useFileStore.getState().hideFilesFromPromptBar();
      console.log('[Chat] Valid files after filter:', validFiles.length);

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

      // Add messages to cache optimistically (matching web app)
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
            // Include uploaded files in user message for display
            files: validFiles.length > 0 ? validFiles : undefined,
          });
        }

        // Always add AI message placeholder (matching web app initial status)
        newMessages.push({
          role: "ai",
          message: "",
          message_id: messageIdAi,
          session_id: sessionId || "",
          status: ["Routing Layer activated"],
          order: nextOrder + (isJson ? 0 : 1),
          // Files will be populated from API response (TRANSLATED_FILES event)
        });

        return [...old, ...newMessages];
      });

      // Accumulation variables
      let accumulatedMessage = "";
      let accumulatedStatus: string[] = ["Routing Layer activated"];
      let accumulatedContents: any[] = [];
      let accumulatedMetadata: Record<string, unknown> = {};
      let accumulatedAgent = ""; // Track the backend/agent for final status
      let isCompleted = false; // Guard against double-completion

      return new Promise((resolve, reject) => {
        // Merge all GCS URIs from valid files (matching web app)
        const gcsUris = mergeAllGcsUris(validFiles);
        console.log('[Chat] Sending with gcs_uris:', JSON.stringify(gcsUris));
        console.log('[Chat] Valid files count:', validFiles.length);

        const requestBody = {
          question,
          session_id: sessionId,
          message_id_user: messageIdUser,
          message_id_ai: messageIdAi,
          user_id: userEmail,
          selected_backend: agent || undefined,
          is_prompt_from_agent_page: isPromptFromAgentPage,
          gcs_uris: gcsUris,
          files: validFiles.map((f) => ({
            name: f.name,
            type: f.type,
            // Include processFileResponse for backend reference
            processFileResponse: f.processFileResponse,
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
              // Check for live chat start trigger
              if (parsed.isLiveChatStart && sessionId) {
                console.log("[livechat] ========== LIVE CHAT START DETECTED ==========");
                console.log("[livechat] Session ID:", sessionId);
                console.log("[livechat] Start type:", parsed.isLiveChatStart.startType);

                // Publish live chat trigger to query cache
                const triggerKey = ["liveChatTrigger", sessionId];
                const existingTrigger = queryClient.getQueryData(triggerKey);

                if (!existingTrigger) {
                  const trigger = {
                    liveSessionId: parsed.isLiveChatStart.liveSessionId || sessionId,
                    message: parsed.isLiveChatStart.message,
                    startType: parsed.isLiveChatStart.startType,
                    ts: Date.now(),
                  };
                  console.log("[livechat] Publishing trigger to cache");
                  queryClient.setQueryData(triggerKey, trigger);
                  queryClient.invalidateQueries({ queryKey: triggerKey });
                }
                console.log("[livechat] ================================================");
              }

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

              // Accumulate metadata (sources, suggested_search, etc.)
              if (parsed.metadata && Object.keys(parsed.metadata).length > 0) {
                accumulatedMetadata = { ...accumulatedMetadata, ...parsed.metadata };
              }

              // Track agent/backend for final status
              if (parsed.agent) {
                accumulatedAgent = parsed.agent;
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
                    isLiveChatStart: parsed.isLiveChatStart || updated[lastIndex].isLiveChatStart,
                    metadata: Object.keys(accumulatedMetadata).length > 0 ? accumulatedMetadata : updated[lastIndex].metadata,
                  };
                }

                return updated;
              });
            }
          } catch (e) {
            console.error("Error parsing SSE event:", e);
          }
        };

        // Helper to get human-readable backend name (matching web app)
        const getBackendStatusName = (agentId: string, prefix: string): string => {
          const agentNames: Record<string, string> = {
            '__fallback__': prefix.replace(/\s*from\s*$/i, ''),
            'knowledge': `${prefix} Knowledge Base`,
            'action': `${prefix} Action Bot`,
            'utility': `${prefix} Utility`,
            'sales_rfp': `${prefix} Proposal Assistant`,
            'audit': `${prefix} Internal Audit Assistant`,
            'hr': `${prefix} Manager Edge Assistant`,
            'finance': `${prefix} Finance Assistant`,
            'legal': `${prefix} Contracts Assistant`,
            'web_search': `${prefix} Web Search`,
            'aionbi': `${prefix} Sales Analyst`,
            'unleash': `${prefix} Unleash Assistant`,
            'financepnlgbi': `${prefix} Finance Analyst - P&L (HFM)`,
            'financeftegbi': `${prefix} Finance Analyst - Client FTE`,
            'financerevenuegbi': `${prefix} Finance Analyst - Client Revenue`,
            'gtddemandgbi': `${prefix} GTD Demand Analyst`,
            'gtdsupplygbi': `${prefix} GTD Supply Analyst`,
            'gtdskillsgbi': `${prefix} GTD Skills Analyst`,
          };
          return agentNames[agentId] || prefix.replace(/\s*from\s*$/i, '');
        };

        // Helper to complete the stream and reset state
        const completeStream = () => {
          if (isCompleted) return; // Prevent double-completion
          isCompleted = true;
          es.close();

          // Add final "Answer generated from [backend]" status (matching web app)
          const finalStatus = getBackendStatusName(accumulatedAgent, 'Answer generated from');
          if (finalStatus && !accumulatedStatus.includes(finalStatus)) {
            accumulatedStatus.push(finalStatus);
          }

          // Keep status on completion (matching web app behavior)
          queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
            const updated = [...old];
            const lastIndex = updated.length - 1;

            if (lastIndex >= 0 && updated[lastIndex].role === "ai") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                message: accumulatedMessage || "Response received.",
                status: [...accumulatedStatus], // Keep the accumulated status
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

        // Handle TRANSLATED_FILES event - this contains signed URLs for generated images
        (es as any).addEventListener("TRANSLATED_FILES", (event: any) => {
          console.log("SSE: TRANSLATED_FILES event received", event.data);
          try {
            const data = JSON.parse(event.data || "{}");
            const translatedFiles = data.translatedFiles || [];

            if (translatedFiles.length > 0) {
              // Update the AI message with the translated files (images with signed URLs)
              queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
                const updated = [...old];
                const lastIndex = updated.length - 1;

                if (lastIndex >= 0 && updated[lastIndex].role === "ai") {
                  // Add/update files with signed URLs
                  const existingFiles = updated[lastIndex].files || [];
                  const newFiles = translatedFiles.map((f: { name: string; signedUrl: string }) => ({
                    name: f.name,
                    type: f.name.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/i) ? 'image' : 'file',
                    loading: false,
                    error: false,
                    signedUrl: f.signedUrl,
                  }));

                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    files: [...existingFiles, ...newFiles],
                  };
                }

                return updated;
              });
            }
          } catch (e) {
            console.error("Error parsing TRANSLATED_FILES event:", e);
          }
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
      // Clear files after successful send (matching web app behavior)
      useFileStore.getState().removeAllFiles();
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
