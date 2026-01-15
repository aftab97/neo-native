import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false, // Not applicable to mobile, but explicit
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys for type safety and consistency
export const queryKeys = {
  // User
  user: ['user'] as const,

  // Chat
  chat: (agentId?: string) =>
    agentId ? (['chat', agentId] as const) : (['chat'] as const),
  chatById: (sessionId: string) => ['chat', { id: sessionId }] as const,

  // History
  chatHistory: ['chatHistory'] as const,
  chatTitles: ['chatTitles'] as const,

  // Files
  filesMetaData: ['filesMetaData'] as const,

  // App
  appLibrary: ['appLibrary'] as const,
  dailyNews: ['dailyNews'] as const,
} as const;
