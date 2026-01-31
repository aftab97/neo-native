# State Management (Zustand)

## Overview
Zustand stores for app state management.

## Files
| File | Purpose |
|------|---------|
| `src/store/chatStore.ts` | Chat input state |
| `src/store/agentStore.ts` | Selected agent |
| `src/store/sessionStore.ts` | Current session |
| `src/store/fileStore.ts` | File attachments |
| `src/store/layoutStore.ts` | Theme, scroll, keyboard |
| `src/store/requestStore.ts` | Abort controller |
| `src/store/popupStore.ts` | Toasts, snackbars |
| `src/store/notificationStore.ts` | Dismissed notifications |
| `src/store/localeStore.ts` | i18n |

## Stores

### chatStore
```typescript
{
  inputValue: string;        // Current input text
  focusOnPrompt: boolean;    // Focus state
  isPromptPaused: boolean;   // During streaming
  lastPrompt: string;        // For replay
  isPromptSuggestionsOpen: boolean;
}
```
**Usage:** ChatInput syncs from store for external values (suggestions).

### agentStore
```typescript
{
  selectedAgent: string | null;
}
```
**Usage:** Track currently active agent.

### sessionStore
```typescript
{
  currentSessionId: string | null;
  sessionExpired: boolean;
}
```
**Usage:** Track active session across navigation.

### fileStore
```typescript
{
  files: FileAttachment[];
  // Actions:
  addFiles, removeFile, removeAllFiles,
  updateFile, setFileError, setFileLoading,
  setFileProgress, getFileById,
  replacePreviewFiles, hideFilesFromPromptBar
}
```
**Usage:** File upload state, processed files for chat.

### layoutStore
```typescript
{
  isDarkTheme: boolean;
  theme: 'light' | 'dark' | 'system';
  chatListScrollCallback: ((offset: number) => void) | null;
  chatListScrollToEndCallback: (() => void) | null;
  contentHeight: number;
  scrollY: number;
  visibleHeight: number;
  isFeedbackInputFocused: boolean;
}
```
**Usage:** Theme, scroll position tracking, keyboard state.

### requestStore
```typescript
{
  abortController: AbortController | null;
  messageIdUser: string | null;
}
```
**Usage:** Cancel in-flight SSE requests.

### popupStore
```typescript
{
  toasts: Toast[];
  snackbars: Snackbar[];
  // Actions: addToast, removeToast, addSnackbar, clearSnackbar
}
```
**Usage:** Notification messages.

### notificationStore
```typescript
{
  dismissedIds: Set<string>;
  // Actions: dismiss, isDismissed
}
```
**Usage:** Track dismissed notifications.

## Edge Cases & Behaviors

### Don't Break These:

1. **File store direct access in async**
   ```typescript
   const filesFromStore = useFileStore.getState().files;
   ```
   Must use `getState()` in async code, not hook.

2. **Session ID from store in callbacks**
   ```typescript
   let currentSessionId = useSessionStore.getState().currentSessionId;
   ```
   Avoid stale closures.

3. **Reset functions**
   ```typescript
   useChatStore.reset();
   // Resets to initialState
   ```

4. **File visibility vs removal**
   ```typescript
   hideFilesFromPromptBar();  // Just hides
   removeAllFiles();          // Actually removes
   ```
   Hide on send, remove on success.

5. **Scroll callback registration**
   ```typescript
   useEffect(() => {
     setChatListScrollCallback(scrollToOffset);
     return () => setChatListScrollCallback(null);
   }, []);
   ```
   Cleanup on unmount.

6. **Toast auto-dismiss**
   Managed by ToastContainer with timeout.

## Integration with React Query

State syncs with query cache:
- `currentSessionId` determines which chat cache to use
- `selectedAgent` determines agent-specific cache
- `files` merged into chat request via `mergeAllGcsUris`
