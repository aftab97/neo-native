import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchJson } from './fetch';
import { queryKeys } from './queryClient';
import { ENDPOINTS } from '../config/api';
import { ChatHistory, ChatMessage } from '../types/chat';
import { usePopupStore } from '../store';

interface HistoryTitlesResponse {
  titles: ChatHistory[];
}

/**
 * Fetch chat history titles (recent conversations)
 */
export const useGetChatTitles = () => {
  return useQuery({
    queryKey: queryKeys.chatTitles,
    queryFn: async () => {
      const response = await apiFetchJson<HistoryTitlesResponse>(
        ENDPOINTS.HISTORY_TITLES,
        { method: 'POST' }
      );
      return response.titles || [];
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

      return response.json() as Promise<{ messages: ChatMessage[] }>;
    },
    onSuccess: (data, variables) => {
      // Store the loaded history in the query cache
      const chatKey = queryKeys.chatById(variables.sessionId);
      queryClient.setQueryData(chatKey, data.messages || []);
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
