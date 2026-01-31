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
**Files:** `src/api/promptLibrary.ts`, `src/ui/components/chat/PromptLibraryTab.tsx`, `src/ui/components/chat/AttachmentSlideout.tsx`

A searchable library of pre-built prompt templates organized by agent/category, accessible via the AttachmentSlideout drawer. Matches the web app's prompt library modal functionality.

### Features

- **Multi-screen navigation** within the drawer with native iOS-style slide animations
- **RBAC-filtered categories** - only shows agents the user has access to
- **Search functionality** - filters prompts by title, prompt text, agent, and subcategory
- **Category ordering** - matches web app's prompt library modal sidebar order
- **One-tap selection** - fills ChatInput with prompt text and closes drawer

### Components

| Component | Purpose |
|-----------|---------|
| `PromptLibraryTab.tsx` | Main component with categories/prompts screens |
| `AttachmentSlideout.tsx` | Parent drawer with "Prompts" row button |
| `promptLibrary.ts` | API hook (`useGetPrompts`) and types |

### Navigation Flow

```
AttachmentSlideout (main)
    ↓ tap "Prompts" row
Categories Screen (animated slide-in)
    ↓ tap category row
Prompts Screen (animated slide-in)
    ↓ tap prompt card
ChatInput filled → Drawer closes
```

### Screen Details

**1. Attachments Screen (AttachmentSlideout)**
- Photos section with camera button and recent photos
- Web Search row (SearchWebIcon)
- Add Files row (FileIcon)
- Prompts row (PromptLibraryIcon) → navigates to Categories

**2. Categories Screen (PromptLibraryTab)**
- Header with back button and title "Prompts"
- Search input (always visible)
- List of category rows showing:
  - PromptLibraryIcon
  - Category name (from AGENTS config `categoryName`)
  - Prompt count for that category
  - Chevron right indicator

**3. Prompts Screen (PromptLibraryTab)**
- Header with back button and category name as title
- Search input (always visible, filters within category)
- Grid of prompt cards showing:
  - Title (2 lines max)
  - Prompt preview (3 lines max, truncated)
  - Subcategory badge

### Data Flow

```typescript
// 1. API fetches all prompts
const { data, isLoading, isError } = useGetPrompts();

// 2. Categories derived from AGENTS config + prompt counts
const categories = AGENTS
  .filter(agent => agent.categoryName && availableServices.includes(agent.id))
  .map(agent => ({
    id: agent.id,
    categoryName: agent.categoryName,
    promptCount: promptCountsByCategory[agent.categoryName] || 0,
  }));

// 3. Prompts filtered by selected category and search
const filteredPrompts = data.prompts.filter(prompt =>
  prompt.agent === selectedCategory.categoryName &&
  (prompt.title.includes(search) || prompt.prompt.includes(search))
);

// 4. Selection fills ChatInput
const handleSelectPrompt = (prompt) => {
  setInputValue(prompt.prompt);  // via chatStore
  onSelectPrompt();              // closes drawer
};
```

### Animation Details

- **Duration**: 250ms
- **Type**: Horizontal slide (translateX)
- **Native driver**: Yes (`useNativeDriver: true`)
- **Forward navigation**: New screen slides in from right
- **Back navigation**: Current screen slides out to right

```typescript
// Animated transforms
const categoriesTranslateX = slideAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [0, -SCREEN_WIDTH],  // slides left when going forward
});
const promptsTranslateX = slideAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [SCREEN_WIDTH, 0],   // slides in from right
});
```

### Styling (Matches Web App)

**Search Input:**
| Property | Light | Dark |
|----------|-------|------|
| Background | `#ffffff` (gray-000) | `#000000` (gray-1000) |
| Text | `#21232c` (gray-900) | `#f0f2f6` (gray-100) |
| Placeholder | `#929aaf` (gray-400) | `#4c5366` (gray-600) |
| Border | `#cfd4e2` (gray-300) | `#2b2f3b` (gray-800) |
| Border radius | 12px |
| Height | 40px |
| Placeholder text | "Search for prompts" |

### Edge Cases

1. **Empty prompts response**
   - Shows empty state with PromptLibraryIcon and "No prompts available" message
   - Categories screen still accessible but all counts show 0

2. **Search with no results**
   - Shows SearchIcon with "No prompts match your search" / "No categories match your search"
   - Search persists when navigating between categories and prompts screens

3. **API error**
   - Shows error state with "Failed to load prompts" message
   - Retry button triggers `refetch()`

4. **Loading state**
   - Shows ActivityIndicator with "Loading prompts..." text
   - Waits for both `useGetPrompts()` and `useAvailableServices()` to complete

5. **RBAC filtering**
   - If `availableServices` is empty (still loading), shows all agents with `categoryName`
   - Once loaded, filters to only show agents user has access to
   - Controlled by `SHOW_ALL_AGENTS` flag in `src/api/env.ts` for testing

6. **Categories with zero prompts**
   - Still displayed (matches web app behavior)
   - Shows "0 prompts" subtitle
   - User can still navigate into category (will show empty state)

7. **Drawer close resets state**
   - When drawer closes, resets to attachments view
   - Clears search text
   - Resets animation position
   - Clears selected category

8. **Back button behavior**
   - On prompts screen: goes back to categories (animated)
   - On categories screen: goes back to attachments view (animated)

9. **Search scope**
   - On categories screen: filters category names
   - On prompts screen: filters prompts within selected category by title, prompt text, agent, and subcategory

10. **Category ordering**
    - Uses AGENTS array order as single source of truth
    - Matches web app's prompt library modal sidebar order:
      General → Contracts Assistant → Finance Assistant → Finance M-Review → Internal Audit Assistant → Manager Edge Assistant → Procurement Concord → Proposal Assistant → Unleash Assistant → Sales Analyst → Finance Analyst P&L → Finance Analyst FTE → Finance Analyst Revenue → GTD Demand → GTD Supply → GTD Skills

11. **Prompt selection during live chat**
    - Prompt selection works normally during live chat sessions
    - Selected prompt fills ChatInput, user can edit before sending

12. **Long prompt text**
    - Title truncated to 2 lines with ellipsis
    - Prompt preview truncated to 3 lines with ellipsis
    - Full prompt text used when filling ChatInput

### API

**Endpoint:** `POST /api/v1/session/promptLibrary`

**Response Type:**
```typescript
type PromptLibraryPrompt = {
  agent: string;        // Category name (e.g., "Proposal Assistant")
  subCategory: string;  // Subcategory (e.g., "Risk Analysis")
  title: string;        // Display title
  prompt: string;       // Full prompt text
};

type PromptLibraryResponse = {
  message: string;
  prompts: PromptLibraryPrompt[];
  total: number;
};
```

**Caching:** React Query with default stale time (prompts rarely change)

---

## 14. Known Incomplete Features

- Support screen card clicks (logs only, no navigation)
- Terms screen (placeholder)
- Notification actions (displayed but incomplete)
- Stock price button (UI exists, limited function)
