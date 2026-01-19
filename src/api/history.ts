import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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
import { useGetUser } from './user';
import { useMemo } from 'react';

// Pagination constants
const DEFAULT_PAGE_LIMIT = 20;

interface HistoryTitlesResponse {
  sessions: Array<{
    session_id: string;
    session_title: string | null;
    last_updated: string | null;
  }>;
  nextCursor?: string | null;
  hasNext?: boolean;
}

interface ChatTitleItem {
  session_id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

interface TitlesPage {
  sessions: ChatTitleItem[];
  nextCursor: string | null;
  hasNext: boolean;
}

/**
 * Fetch chat history titles with infinite scrolling support
 */
export const useGetChatTitles = () => {
  // Get user data from the user query (this ensures we wait for user to load)
  const { data: user } = useGetUser();
  const userEmail = user?.email;

  const infiniteQuery = useInfiniteQuery<TitlesPage, Error>({
    queryKey: [...queryKeys.chatTitles, userEmail],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam = null }) => {
      if (!userEmail) {
        return { sessions: [], nextCursor: null, hasNext: false };
      }

      const response = await apiFetch(ENDPOINTS.HISTORY_TITLES, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userEmail,
          limit: DEFAULT_PAGE_LIMIT,
          cursor: pageParam,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat titles');
      }

      const data: HistoryTitlesResponse = await response.json();

      // Map to ChatHistory format and filter/normalize titles
      const sessions = (data.sessions || [])
        .map((session) => {
          const normalisedTitle = normaliseActionCardTitle(session.session_title);
          return {
            session_id: session.session_id,
            title: normalisedTitle || 'Untitled Chat',
            updated_at: session.last_updated || '',
            created_at: session.last_updated || '',
          };
        })
        .filter((session) => !shouldHideTitle(session.title));

      return {
        sessions,
        nextCursor: data.nextCursor ?? null,
        hasNext: data.hasNext ?? false,
      };
    },
    enabled: !!userEmail,
    staleTime: 1000 * 60 * 2, // 2 minutes
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.nextCursor : undefined,
  });

  // Flatten all pages into a single array
  const flattenedData = useMemo(() => {
    if (!infiniteQuery.data?.pages) return [];
    return infiniteQuery.data.pages.flatMap((page) => page.sessions);
  }, [infiniteQuery.data?.pages]);

  return {
    data: flattenedData,
    isLoading: infiniteQuery.isLoading,
    isRefetching: infiniteQuery.isRefetching,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    refetch: infiniteQuery.refetch,
  };
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
