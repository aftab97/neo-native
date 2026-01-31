# Neo Native - Feature Documentation

## Detailed Documentation

For in-depth documentation with edge cases and behaviors, see subdirectories:

| Feature | Documentation |
|---------|---------------|
| Chat System | [docs/chat/](./chat/) |
| Live Chat (WebSocket) | [docs/live-chat/](./live-chat/) |
| File Upload | [docs/file-upload/](./file-upload/) |
| History & Sessions | [docs/history/](./history/) |
| Multi-Agent System | [docs/agents/](./agents/) |
| Prompt Library | [docs/prompt-library/](./prompt-library/) |
| Voice Dictation | [docs/dictation/](./dictation/) |
| Authentication | [docs/auth/](./auth/) |
| Navigation | [docs/navigation/](./navigation/) |
| State Management | [docs/state/](./state/) |
| UI Components | [docs/ui-components/](./ui-components/) |
| API Integration | [docs/api/](./api/) |

---

## 1. Chat System (SSE Streaming)
**Files:** `src/api/chat.ts`, `src/pages/ChatScreen.tsx`, `src/ui/components/chat/*`

- Real-time AI responses via Server-Sent Events (SSE)
- Message streaming with status updates (DETECT_INTENT, CLARIFY_INTENT, CALL_BACKEND)
- Three cache key contexts:
  - Homepage chat: `['chat']`
  - Agent chat: `['chat', agentId]`
  - History chat: `['chat', {id: sessionId}]`
- Message cancellation via AbortController
- Optimistic UI updates with order-based message sorting

**Edge Cases:**
- Files with errors are filtered out before sending
- `isJson: true` messages (adaptive card submissions) skip user message display
- `nextOrder = max(existingOrder) + 1` handles non-contiguous orders
- Final status: "Answer generated from [Agent Name]"
- `isCompleted` guard prevents double-completion

---

## 2. Live Chat (WebSocket)
**Files:** `src/api/liveChat.ts`, `src/hooks/useLiveChatListener.ts`

- WebSocket via socket.io-client
- Auto-connects when SSE response contains live chat trigger
- Agent join/leave notifications
- Interactive card support
- Automatic reconnection with exponential backoff

**Edge Cases:**
- Strict connect mode - only connects on explicit trigger
- 10-second rate-limiting on connection attempts
- Stores direct socket reference for access after sessionId changes
- Sends 'cancel' message when switching sessions
- Disconnects old session before connecting new one

---

## 3. File Upload & Processing
**Files:** `src/api/fileUpload.ts`, `src/hooks/useFileUpload.ts`, `src/store/fileStore.ts`

- Supported: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, ZIP, images
- Direct upload to GCS via signed URLs
- ZIP extraction with preview → real file replacement
- Job status polling (10 retries, 2-second intervals)
- Per-file progress and error tracking

**Edge Cases:**
- Files cleared from store ONLY after successful chat mutation
- Partial errors: some sheets succeed, some fail
- `hideFilesFromPromptBar` toggle when message sent
- Terminal statuses: 'done', 'complete', 'failed', 'error'

---

## 4. Chat History & Sessions
**Files:** `src/api/history.ts`, `src/ui/layout/DrawerContent.tsx`

- Infinite scroll with cursor-based pagination
- Rename/delete single or all chats
- Session-based message loading
- Chat title normalization (filters JSON titles)

**Edge Cases:**
- User messages that are JSON payloads (card button clicks) are hidden
- Delete all clears entire `['chat']` cache family
- Invalidates chat titles after rename/delete

---

## 5. Multi-Agent System
**Files:** `src/ui/components/agents/agents.ts`, `src/ui/components/agents/rbac.ts`, `src/pages/AgentScreen.tsx`

- 16+ agent types with metadata (title, icon, description, prompts)
- RBAC-based filtering via `useAvailableServices` hook
- Agent start screens with prompt suggestions
- Agent-specific cache tracking

**Agent Categories:**
- Knowledge agents (HR, Legal, Finance, Audit, RFP, etc.)
- Analyst agents (Sales, Finance P&L, GTD Demand/Supply/Skills)
- Utility agents (Web Search, General)

**Edge Cases:**
- If no services available yet, show all agents (loading state)
- Adaptive card submissions route to 'action' agent but cache to current agent

---

## 6. Authentication & Session
**Files:** `src/api/sessionToken.ts`, `src/store/sessionStore.ts`

- IAP JWT token authentication
- 12-hour session token caching
- Token pre-fetch on app startup
- Bearer token in Authorization header

---

## 7. Navigation
**Files:** `src/routes/RootNavigator.tsx`, `src/routes/types.ts`

- Drawer + Stack navigation
- Screens: Home, Chat, Agent, Support, Terms
- Navigation params:
  - `Chat`: `{sessionId?, agent?}`
  - `Agent`: `{agentId}`

---

## 8. State Management (Zustand)
**Files:** `src/store/*`

| Store | Key State |
|-------|-----------|
| chatStore | inputValue, isPromptPaused, lastPrompt |
| sessionStore | currentSessionId, sessionExpired |
| agentStore | selectedAgent |
| fileStore | files[], uploadProgress, errors |
| layoutStore | isDarkTheme, theme, scrollPosition |
| notificationStore | dismissedIds |
| requestStore | abortController, messageIdUser |

---

## 9. UI Components

### Chat Components (`src/ui/components/chat/`)
| Component | Purpose |
|-----------|---------|
| Chat.tsx | FlatList message renderer, auto-scroll |
| ChatInput.tsx | Input with file attachment, live chat support |
| AIBlock.tsx | AI message with markdown, cards, charts, images |
| UserBlock.tsx | User message bubble |
| AdaptiveCardViewer.tsx | JSON adaptive card rendering |
| ChartViewer.tsx | Chart/graph rendering |
| AIMessageImages.tsx | Image gallery with modal |
| AIMessageAttachments.tsx | File attachment list |
| SourcesPills.tsx | Source attribution |
| RoutingStatus.tsx | Agent routing status |
| ChatAIFeedback.tsx | Thumbs up/down |
| AttachmentSlideout.tsx | File picker drawer with tabs (Attachments/Prompts) |
| AttachmentPreview.tsx | Attached file preview |
| PromptLibraryTab.tsx | Searchable prompt templates by category |

### Layout (`src/ui/layout/`)
| Component | Purpose |
|-----------|---------|
| DrawerContent.tsx | Sidebar: history, notifications, settings |
| Header.tsx | Top app bar |
| StockButton.tsx | Stock price indicator |

### Home (`src/ui/components/home-cards/`)
| Component | Purpose |
|-----------|---------|
| WelcomeSection.tsx | Welcome message with gradient |
| AgentCards.tsx | Agent grid (RBAC filtered) |
| PromptSuggestions.tsx | Suggested prompts |

---

## 10. Key Hooks
**Files:** `src/hooks/*`

| Hook | Purpose |
|------|---------|
| useResetChat | Clear caches: `resetForHomepage()`, `resetForAgent(id)`, `resetAll()` |
| useLiveChatListener | Auto-connect WebSocket, manage socket lifecycle |
| useFileUpload | File picker, upload, progress, error handling |
| useAvailableServices | RBAC filtering for agents |
| useTheme | Theme switching (light/dark/system) |

---

## 11. API Endpoints
**Files:** `src/api/config.ts`

```
/api/v1/session/chat - Chat streaming
/api/v1/session/chat/cancel - Cancel request
/api/v1/session/history - Chat history
/api/v1/session/history/titles - Paginated titles
/api/v1/session/history/rename - Rename session
/api/v1/session/session - Delete session
/api/v1/session/userinfo - User info
/api/v1/session/file/processFile - File processing
/api/v1/session/upload/queue - Get signed URLs
/api/v1/session/upload/listen - Job status polling
/api/v1/session/feedback - Message feedback
/api/v1/session/promptLibrary - Prompt templates
```

---

## 12. Critical Integration Points

### Cache Key Selection (chat.ts)
```typescript
if (sessionId exists) → ['chat', {id: sessionId}]  // History
else if (agentId) → ['chat', agentId]               // Agent page
else → ['chat']                                      // Homepage
```

### File Cleanup Flow
1. User attaches files → stored in fileStore
2. User sends message → files sent with request
3. On SUCCESS → files cleared from fileStore
4. On ERROR → files remain for retry

### Live Chat Trigger Detection
1. SSE receives CALL_BACKEND with live chat marker
2. Sets `liveChatTrigger` in query cache
3. `useLiveChatListener` detects trigger → connects socket
4. Socket messages added to chat cache

---

## 13. Prompt Library
**Files:** `src/api/promptLibrary.ts`, `src/ui/components/chat/PromptLibraryTab.tsx`

Searchable prompt template library accessible via AttachmentSlideout. RBAC-filtered categories with animated multi-screen navigation.

**See:** [docs/prompt-library/](./prompt-library/) for full documentation.

**Key Points:**
- Multi-screen navigation with 250ms slide animations
- Categories from AGENTS config, filtered by user's available services
- Search filters by title, prompt text, agent, and subcategory
- Tap prompt → fills ChatInput → drawer closes

---

## 14. Voice Dictation
**Files:** `src/hooks/useDictation.ts`, `src/ui/components/chat/DictateBar.tsx`

Voice-to-text with audio visualization using `@react-native-voice/voice` for speech recognition.

**See:** [docs/dictation/](./dictation/) for full documentation.

**Key Points:**
- Microphone button next to send button (matches web app)
- 48-bar audio waveform visualization
- Cancel (X) and Complete (checkmark) buttons
- Falls back to simulated audio levels if expo-av not installed

---

## 15. AI Reasoning/Thought Display
**Files:** `src/ui/components/chat/AIReasoningBlock.tsx`, `src/ui/components/chat/AIBlock.tsx`

Expandable "thought" blocks showing AI reasoning process. Displays when the AI includes reasoning content in its response.

**Key Points:**
- Collapsible header with title and chevron icon
- Chevron rotates 180° when expanded
- Expanded content has left border indicator
- Markdown rendering for thought content
- Rendered from `contents` array where `type === 'thought'`

**Props:**
```typescript
interface AIReasoningBlockProps {
  thought: string;       // Full reasoning content
  thoughtTitle: string;  // Clickable header text
}
```

**Edge Cases:**
- Returns null if thought or thoughtTitle is missing
- Multiple thoughts render as separate blocks
- Supports markdown in thought content

---

## 16. Known Incomplete Features

- Support screen card clicks (logs only, no navigation)
- Terms screen (placeholder)
- Notification actions (displayed but incomplete)
- Stock price button (UI exists, limited function)
