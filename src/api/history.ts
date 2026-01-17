import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchJson } from './fetch';
import { queryKeys } from './queryClient';
import { ENDPOINTS } from '../config/api';
import { ChatHistory, ChatMessage } from '../types/chat';
import { usePopupStore } from '../store';
import {
  normaliseActionCardTitle,
  filterActionCardUserMessages,
  shouldHideTitle,
} from '../utils/filterActionCards';

interface HistoryTitlesResponse {
  sessions: Array<{
    session_id: string;
    session_title: string | null;
    last_updated: string | null;
  }>;
}

/**
 * Fetch chat history titles (recent conversations)
 */
export const useGetChatTitles = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.chatTitles,
    queryFn: async () => {
      // Get user email from cache
      const user = queryClient.getQueryData<{ email: string }>(queryKeys.user);

      if (!user?.email) {
        return [];
      }

      const response = await apiFetch(ENDPOINTS.HISTORY_TITLES, {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat titles');
      }

      const data: HistoryTitlesResponse = await response.json();

      // Map to ChatHistory format and filter/normalize titles
      return (data.sessions || [])
        .map((session) => {
          // Normalize the title (extract meaningful text from JSON if needed)
          const normalisedTitle = normaliseActionCardTitle(session.session_title);
          return {
            session_id: session.session_id,
            title: normalisedTitle || 'Untitled Chat',
            updated_at: session.last_updated || '',
            created_at: session.last_updated || '',
          };
        })
        // Filter out sessions where title is still just JSON or empty
        .filter((session) => !shouldHideTitle(session.title));
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Load chat history for a specific session
 */
export const useMutateChatHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      userEmail,
    }: {
      sessionId: string;
      userEmail: string;
    }) => {
      const response = await apiFetch(ENDPOINTS.HISTORY, {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load chat history');
      }

      const data = await response.json();
      console.log('History API response:', JSON.stringify(data, null, 2));

      // Handle different response formats
      // Could be: array directly, { messages: [...] }, or other format
      let messages: ChatMessage[] = [];

      if (Array.isArray(data)) {
        messages = data;
      } else if (data?.messages && Array.isArray(data.messages)) {
        messages = data.messages;
      } else if (data?.history && Array.isArray(data.history)) {
        messages = data.history;
      }

      // Filter out user messages that are JSON payloads from action agent
      // These are machine-to-machine messages (adaptive card button clicks)
      const filteredMessages = filterActionCardUserMessages(messages);

      return { messages: filteredMessages, sessionId };
    },
    onSuccess: (data, variables) => {
      // Store the loaded history in the query cache
      const chatKey = queryKeys.chatById(variables.sessionId);
      console.log('Storing messages in cache:', chatKey, data.messages.length, 'messages');
      queryClient.setQueryData(chatKey, data.messages);
    },
    onError: (error) => {
      console.error('Failed to load history:', error);
    },
  });
};

/**
 * Rename a chat session
 */
export const useRenameChat = () => {
  const queryClient = useQueryClient();
  const { addToast } = usePopupStore();

  return useMutation({
    mutationFn: async ({
      sessionId,
      newTitle,
    }: {
      sessionId: string;
      newTitle: string;
    }) => {
      const response = await apiFetch(ENDPOINTS.HISTORY_RENAME, {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          title: newTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename chat');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatTitles });
      addToast({
        variant: 'success',
        label: 'Chat renamed successfully',
      });
    },
    onError: () => {
      addToast({
        variant: 'danger',
        label: 'Failed to rename chat',
      });
    },
  });
};

/**
 * Delete a single chat session
 */
export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  const { addToast } = usePopupStore();

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      const response = await apiFetch(ENDPOINTS.DELETE_SESSION, {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.chatById(variables.sessionId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.chatTitles });
      addToast({
        variant: 'success',
        label: 'Chat deleted successfully',
      });
    },
    onError: () => {
      addToast({
        variant: 'danger',
        label: 'Failed to delete chat',
      });
    },
  });
};

/**
 * Delete all chat sessions
 */
export const useDeleteAllChats = () => {
  const queryClient = useQueryClient();
  const { addToast } = usePopupStore();

  return useMutation({
    mutationFn: async ({ userEmail }: { userEmail: string }) => {
      const response = await apiFetch(ENDPOINTS.DELETE_ALL_SESSIONS, {
        method: 'POST',
        body: JSON.stringify({ user_id: userEmail }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete all chats');
      }

      return response.json();
    },
    onMutate: async () => {
      // Cancel any outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.chatTitles });
    },
    onSuccess: () => {
      // Clear all chat-related caches
      queryClient.removeQueries({ queryKey: ['chat'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.chatTitles });
      addToast({
        variant: 'success',
        label: 'All chats deleted successfully',
      });
    },
    onError: () => {
      addToast({
        variant: 'danger',
        label: 'Failed to delete chats',
      });
    },
  });
};
