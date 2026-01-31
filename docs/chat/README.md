# Chat System

## Overview
SSE-based streaming chat with real-time AI responses.

## Files
| File | Purpose |
|------|---------|
| `src/api/chat.ts` | Core chat API, SSE streaming, mutations |
| `src/pages/ChatScreen.tsx` | Chat page component, orchestrates chat logic |
| `src/ui/components/chat/Chat.tsx` | FlatList message renderer |
| `src/ui/components/chat/ChatInput.tsx` | Input with file attachment |
| `src/ui/components/chat/AIBlock.tsx` | AI message renderer (markdown, cards, charts) |
| `src/ui/components/chat/UserBlock.tsx` | User message bubble |

## Features

### SSE Streaming (`useMutateChatPrompt`)
- Creates SSE connection via `react-native-sse`
- Accumulates message content, status, contents, metadata
- Event types: `START`, `DETECT_INTENT`, `CLARIFY_INTENT`, `CALL_BACKEND`, `TRANSLATED_FILES`, `END`, `ERROR`
- Supports message cancellation via `AbortController`

### Cache Key Selection (CRITICAL)
Three cache key contexts based on navigation:
```typescript
// Homepage chat (no route params)
queryKeys.chat()  // ['chat']

// Agent page (routeAgent set)
queryKeys.chat(agentId)  // ['chat', agentId]

// History chat (routeSessionId set)
queryKeys.chatById(sessionId)  // ['chat', { id: sessionId }]
```

**Edge Cases:**
- `isPromptFromChatPage`: true when viewing history chat
- `isPromptFromAgentPage`: true on agent page, NOT homepage
- Homepage flow: `useGeneralChat = !hasRouteContext` ensures `['chat']` is used regardless of `selectedAgent`

### Message Order Calculation
```typescript
const maxOrder = old.reduce(
  (max, msg) => (msg.order !== undefined ? Math.max(max, msg.order) : max),
  -1
);
const nextOrder = maxOrder + 1;
```
- Uses max `order` field, not array length
- Handles non-contiguous orders from filtered messages

### Adaptive Card Submissions
- `isJson: true` skips user message display
- Routes to `'action'` agent backend
- `cacheAgent` ensures response goes to viewed cache (not 'action' cache)

### Final Status
- Generates "Answer generated from [Agent Name]" on completion
- Maps backend agent IDs to human-readable names

## Edge Cases & Behaviors

### Don't Break These:

1. **Files cleared only on success**
   ```typescript
   onSuccess: () => {
     useFileStore.getState().removeAllFiles();
   }
   ```
   Files stay in store until mutation succeeds.

2. **isCompleted guard**
   ```typescript
   let isCompleted = false;
   const completeStream = () => {
     if (isCompleted) return; // Prevent double-completion
     isCompleted = true;
     // ...
   };
   ```

3. **Live chat trigger detection**
   When `CALL_BACKEND` contains live chat marker, publishes to `['liveChatTrigger', sessionId]`.

4. **Status accumulation**
   - Statuses are deduplicated: `if (!accumulatedStatus.includes(status))`
   - All statuses preserved on completion

5. **Cache key consistency**
   - Must use same cache key for optimistic add AND streaming updates
   - `cacheAgent ?? agent` pattern for card submissions

### Chat.tsx Behaviors

1. **Auto-scroll**
   ```typescript
   useEffect(() => {
     if (messages.length > 0) {
       setTimeout(() => {
         flatListRef.current?.scrollToEnd({ animated: true });
       }, 100);
     }
   }, [messages.length, messages[messages.length - 1]?.message]);
   ```
   Triggers on message count change AND last message content change.

2. **Message sorting**
   ```typescript
   const sortedMessages = [...messages].sort((a, b) => {
     if (a.order !== undefined && b.order !== undefined) {
       return a.order - b.order;
     }
     return 0;
   });
   ```

3. **Live chat agent rendering**
   Both `'ai'` and `'live_chat_agent'` roles rendered by `AIBlock`.

### ChatInput Behaviors

1. **Send routing**
   ```typescript
   if (isLiveChatActive && onLiveChatSend) {
     onLiveChatSend(message);
   } else {
     onSend(message);
   }
   ```

2. **Files not cleared on send**
   Files cleared by `chat.ts` `onSuccess`, not by ChatInput.

3. **Can send with files only**
   ```typescript
   const canSend = (hasText || hasFiles) && !isLoading && !filesLoading;
   ```

4. **Hidden during feedback input focus**
   ```typescript
   if (isFeedbackInputFocused) {
     return null;
   }
   ```

### AIBlock Behaviors

1. **JSON response parsing**
   Parses concatenated JSON objects for adaptive cards.

2. **Images from multiple sources**
   - `message.files` - file attachments
   - `message.contents` - generated images
   - Markdown images

3. **Feedback only for AI**
   ```typescript
   {message.message && !isLoading && !isLiveChatAgent && (
     <ChatAIFeedback ... />
   )}
   ```
   No feedback for live chat agent messages.

## API Contract

### Request Body
```typescript
{
  question: string,
  session_id: string | null,
  message_id_user: string,
  message_id_ai: string,
  user_id: string,
  selected_backend?: string,
  is_prompt_from_agent_page: boolean,
  gcs_uris: Record<string, string[]>,
  files: Array<{ name, type, processFileResponse }>
}
```

### SSE Events
| Event | Data |
|-------|------|
| `START` | Initial connection |
| `DETECT_INTENT` | Intent detection status |
| `CLARIFY_INTENT` | Clarification needed |
| `CALL_BACKEND` | Routing to backend, may contain live chat trigger |
| `TRANSLATED_FILES` | `{ translatedFiles: [{ name, signedUrl }] }` |
| `END` | Stream completion |
| `ERROR` | Error details |
