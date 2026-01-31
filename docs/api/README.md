# API Integration

## Overview
REST APIs with TanStack React Query for caching.

## Files
| File | Purpose |
|------|---------|
| `src/api/config.ts` | Base URL, endpoints |
| `src/api/fetch.ts` | Fetch wrapper with auth |
| `src/api/queryClient.ts` | Query client, keys |
| `src/api/sessionToken.ts` | IAP JWT auth |
| `src/api/user.ts` | User info |
| `src/api/feedback.ts` | Message feedback |
| `src/api/support.ts` | Support content |
| `src/api/stockPrice.ts` | Stock price data |
| `src/api/notifications.ts` | Notifications |

## Endpoints

```typescript
ENDPOINTS = {
  CHAT: '/api/v1/session/chat',
  CHAT_CANCEL: '/api/v1/session/chat/cancel',
  HISTORY: '/api/v1/session/history',
  HISTORY_TITLES: '/api/v1/session/history/titles',
  HISTORY_RENAME: '/api/v1/session/history/rename',
  DELETE_SESSION: '/api/v1/session/session',
  DELETE_ALL_SESSIONS: '/api/v1/session/session', // Different body
  USER_INFO: '/api/v1/session/userinfo',
  USER_PROFILE_PICTURE: '/api/v1/session/userProfilePicture',
  PROCESS_FILE: '/api/v1/session/file/processFile',
  FRONTEND_PROCESS_FILE: '/api/v1/session/file/frontendProcessFile',
  UPLOAD_QUEUE: '/api/v1/session/upload/queue',
  UPLOAD_LISTEN: '/api/v1/session/upload/listen',
  FEEDBACK: '/api/v1/session/feedback',
  NOTIFICATIONS: '/api/v1/session/getNotify',
  GTD_NOTIFICATIONS: '/api/v1/session/getGtdNotifications',
}
```

## Query Keys

```typescript
queryKeys = {
  chat: (agentId?) => agentId ? ['chat', agentId] : ['chat'],
  chatById: (sessionId) => ['chat', { id: sessionId }],
  chatTitles: ['chatTitles'],
  user: ['user'],
  feedback: (sessionId, messageId) => ['feedback', sessionId, messageId],
}
```

## Authentication

### IAP JWT Token
```typescript
// Cached for 12 hours
const TOKEN_CACHE_DURATION = 12 * 60 * 60 * 1000;

export const getOrFetchJwt = async (): Promise<string | null> => {
  // Check cache first
  if (cachedToken && Date.now() - tokenTimestamp < TOKEN_CACHE_DURATION) {
    return cachedToken;
  }
  // Fetch new token
  const response = await apiFetch(ENDPOINTS.SESSION_TOKEN);
  // ...
};
```

### Fetch Wrapper
```typescript
export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options?.headers,
    },
  });
};
```

## Edge Cases & Behaviors

### Don't Break These:

1. **Cache key consistency**
   Must use same key pattern everywhere:
   - `['chat']` - general
   - `['chat', agentId]` - agent
   - `['chat', { id: sessionId }]` - session

2. **User cache for history**
   ```typescript
   useInfiniteQuery({
     queryKey: [...queryKeys.chatTitles, userEmail],
     enabled: !!userEmail,
   });
   ```
   User email in key for per-user caching.

3. **Token pre-fetch**
   Called on app startup to warm cache.

4. **ngrok header**
   Required for development:
   ```typescript
   'ngrok-skip-browser-warning': 'true'
   ```

5. **FormData for ZIP uploads**
   Don't set Content-Type manually:
   ```typescript
   // Let fetch set it automatically with boundary
   headers: {
     'ngrok-skip-browser-warning': 'true',
     // NO Content-Type here
   },
   ```

6. **Query invalidation patterns**
   ```typescript
   // After mutation:
   queryClient.invalidateQueries({ queryKey: queryKeys.chatTitles });
   ```

7. **Optimistic updates**
   ```typescript
   queryClient.setQueryData(chatKey, (old = []) => [...old, newMessage]);
   ```
   Add before request, update on stream.

## React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      retry: 1,
    },
  },
});
```

## WebSocket (Live Chat)
See `docs/live-chat/README.md` for socket.io integration.

## SSE (Chat Streaming)
See `docs/chat/README.md` for Server-Sent Events handling.
