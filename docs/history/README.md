# Chat History & Sessions

## Overview
Infinite scroll history with session management.

## Files
| File | Purpose |
|------|---------|
| `src/api/history.ts` | History API, pagination, CRUD operations |
| `src/ui/layout/DrawerContent.tsx` | Sidebar with history list |
| `src/tools/filterActionCards.ts` | Title normalization, filtering |

## Features

### Infinite Scroll Pagination
```typescript
useInfiniteQuery({
  queryKey: [...queryKeys.chatTitles, userEmail],
  initialPageParam: null,
  getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.nextCursor : undefined,
});
```
- Default page limit: 20 items
- Cursor-based pagination

### Title Normalization
```typescript
const normalisedTitle = normaliseActionCardTitle(session.session_title);
// Filters out action card JSON titles
```

### Operations
- `useGetChatTitles()` - Paginated list
- `useMutateChatHistory()` - Load session messages
- `useRenameChat()` - Rename session
- `useDeleteChat()` - Delete single session
- `useDeleteAllChats()` - Delete all sessions

## Edge Cases & Behaviors

### Don't Break These:

1. **Filter action card user messages**
   ```typescript
   const filteredMessages = filterActionCardUserMessages(messages);
   ```
   JSON payload messages (adaptive card clicks) hidden from UI.

2. **Hide JSON titles**
   ```typescript
   .filter((session) => !shouldHideTitle(session.title));
   ```
   Titles that are JSON are hidden.

3. **Session-specific cache**
   ```typescript
   const chatKey = queryKeys.chatById(variables.sessionId);
   queryClient.setQueryData(chatKey, data.messages);
   ```
   History loaded into session-specific cache.

4. **Delete all clears cache family**
   ```typescript
   queryClient.removeQueries({ queryKey: ['chat'] });
   ```
   All chat-related caches cleared.

5. **Invalidate titles after mutation**
   ```typescript
   queryClient.invalidateQueries({ queryKey: queryKeys.chatTitles });
   ```
   After rename/delete.

6. **Handle multiple response formats**
   ```typescript
   if (Array.isArray(data)) messages = data;
   else if (data?.messages) messages = data.messages;
   else if (data?.history) messages = data.history;
   ```

7. **User email dependency**
   ```typescript
   enabled: !!userEmail,
   ```
   History only fetches after user loaded.

## API Contract

### Get Titles
```typescript
POST /api/v1/session/history/titles
{
  user_id: string,
  limit: number,
  cursor: string | null
}
// Response: { sessions: [...], nextCursor, hasNext }
```

### Load History
```typescript
POST /api/v1/session/history
{
  session_id: string,
  user_id: string
}
// Response: ChatMessage[] | { messages: [...] } | { history: [...] }
```

### Rename
```typescript
POST /api/v1/session/history/rename
{
  session_id: string,
  title: string
}
```

### Delete Session
```typescript
POST /api/v1/session/session
{
  session_id: string
}
```

### Delete All
```typescript
POST /api/v1/session/session (all)
{
  user_id: string
}
```
