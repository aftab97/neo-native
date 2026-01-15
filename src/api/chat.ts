import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './fetch';
import { queryKeys } from './queryClient';
import { ENDPOINTS } from '../config/api';
import { ChatMessage } from '../types/chat';
import {
  useChatStore,
  useAgentStore,
  useRequestStore,
  usePopupStore,
} from '../store';
import { parseStreamChunk, createMessageId } from '../utils/parseStream';

interface ChatPromptVariables {
  question: string;
  sessionId: string | null;
  agent?: string;
  userEmail: string;
  files?: any[];
  isPromptFromAgentPage?: boolean;
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
    staleTime: Infinity, // Never refetch, rely on cache updates
  });
};

/**
 * Get chat by session ID
 */
export const useChatBySessionId = (sessionId?: string | null) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: sessionId ? queryKeys.chatById(sessionId) : ['chat', 'none'],
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
 * Send a chat prompt with streaming response
 */
export const useMutateChatPrompt = () => {
  const queryClient = useQueryClient();
  const { setIsPromptPaused, setInputValue, setLastPrompt } = useChatStore();
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
      } = variables;

      // Generate unique message IDs
      const messageIdUser = createMessageId('user');
      const messageIdAi = createMessageId('ai');

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
      setInputValue('');

      // Determine cache key based on context
      const chatKey = agent ? queryKeys.chat(agent) : queryKeys.chat();

      // Add user message to cache optimistically
      queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => [
        ...old,
        {
          role: 'user',
          message: question,
          message_id: messageIdUser,
          session_id: sessionId || '',
          order: old.length,
        },
        {
          role: 'ai',
          message: '',
          message_id: messageIdAi,
          session_id: sessionId || '',
          status: ['Processing...'],
          order: old.length + 1,
        },
      ]);

      try {
        const requestBody = {
          question,
          session_id: sessionId,
          message_id_user: messageIdUser,
          message_id_ai: messageIdAi,
          user_id: userEmail,
          selected_backend: agent || undefined,
          is_prompt_from_agent_page: isPromptFromAgentPage,
          gcs_uris: {
            'is_unstructured=True': [],
            'is_unstructured=False': [],
          },
          files: files.map((f) => ({
            name: f.name,
            type: f.type,
          })),
        };

        const response = await apiFetch(ENDPOINTS.CHAT, {
          method: 'POST',
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Chat error response:', errorText);
          throw new Error(errorText || 'Chat request failed');
        }

        // Initialize variables for message accumulation
        let accumulatedMessage = '';
        let accumulatedStatus: string[] = [];
        let accumulatedContents: any[] = [];

        // Stream the response
        // Note: React Native fetch may not support streaming in all cases
        const reader = response.body?.getReader();

        if (!reader) {
          // Fallback: read as text if streaming not supported
          const text = await response.text();

          // Try to parse as SSE events
          const events = text.split(/\r?\n\r?\n/);
          for (const event of events) {
            if (!event.trim()) continue;
            const parsed = parseStreamChunk(event);
            if (parsed?.message) {
              accumulatedMessage = parsed.message;
            }
            if (parsed?.status) {
              for (const status of parsed.status) {
                if (!accumulatedStatus.includes(status)) {
                  accumulatedStatus.push(status);
                }
              }
            }
          }

          // Update cache with final result
          queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
            const updated = [...old];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === 'ai') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                message: accumulatedMessage || 'Response received but no message content found.',
                status: undefined,
              };
            }
            return updated;
          });

          return { success: true, messageIdAi };
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const decodedChunk = decoder.decode(value, { stream: true });
          buffer += decodedChunk;
          const chunks = buffer.split(/\r?\n\r?\n/);
          buffer = chunks.pop() || '';

          for (const chunk of chunks) {
            if (!chunk.trim()) continue;

            const parsed = parseStreamChunk(chunk);
            if (parsed) {
              // Accumulate message content (CALL_BACKEND returns full message)
              if (parsed.message) {
                accumulatedMessage = parsed.message;
              }

              // Accumulate status messages (each event adds to status)
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

              // Update the AI message in cache
              queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
                const updated = [...old];
                const lastIndex = updated.length - 1;

                if (lastIndex >= 0 && updated[lastIndex].role === 'ai') {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    message: accumulatedMessage,
                    status: [...accumulatedStatus],
                    contents: accumulatedContents.length > 0 ? accumulatedContents : undefined,
                    suggestedAgents: parsed.suggestedAgents || updated[lastIndex].suggestedAgents,
                  };
                }

                return updated;
              });
            }
          }
        }

        // Clear status on completion
        queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
          const updated = [...old];
          const lastIndex = updated.length - 1;

          if (lastIndex >= 0 && updated[lastIndex].role === 'ai') {
            updated[lastIndex] = {
              ...updated[lastIndex],
              status: undefined,
            };
          }

          return updated;
        });

        return { success: true, messageIdAi };
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // User cancelled - update status
          queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
            const updated = [...old];
            const lastIndex = updated.length - 1;

            if (lastIndex >= 0 && updated[lastIndex].role === 'ai') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                message:
                  updated[lastIndex].message || 'Response generation cancelled.',
                status: ['Cancelled'],
              };
            }

            return updated;
          });
        } else {
          // Real error
          console.error('Chat error:', error);

          // Update AI message with error
          queryClient.setQueryData<ChatMessage[]>(chatKey, (old = []) => {
            const updated = [...old];
            const lastIndex = updated.length - 1;

            if (lastIndex >= 0 && updated[lastIndex].role === 'ai') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                message: 'Sorry, something went wrong. Please try again.',
                status: ['Error'],
              };
            }

            return updated;
          });

          addSnackbar({
            label: 'Failed to send message. Tap to retry.',
            variant: 'danger',
            hasAction: true,
            actionLabel: 'Retry',
            action: () => {
              // Retry with same variables
              useMutateChatPrompt().mutate(variables);
            },
          });
        }

        throw error;
      } finally {
        setIsPromptPaused(false);
        setAbortController(null);
      }
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
      // Abort the fetch request
      abortController?.abort();

      // Call cancel endpoint
      if (sessionId && messageIdUser) {
        await apiFetch(ENDPOINTS.CHAT_CANCEL, {
          method: 'POST',
          body: JSON.stringify({
            session_id: sessionId,
            message_id_user: messageIdUser,
          }),
        });
      }

      // Update cache with cancelled status
      queryClient.setQueryData<ChatMessage[]>(
        chatKey as string[],
        (old = []) => {
          const updated = [...old];
          const lastIndex = updated.length - 1;

          if (lastIndex >= 0 && updated[lastIndex].role === 'ai') {
            updated[lastIndex] = {
              ...updated[lastIndex],
              status: ['Generating Response Cancelled'],
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
        variant: 'default',
        label: 'Response generation cancelled.',
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
