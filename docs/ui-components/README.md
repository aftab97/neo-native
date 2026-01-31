# UI Components

## Overview
React Native UI components organized by feature.

## Directory Structure
```
src/ui/
├── components/
│   ├── agents/         # Agent UI
│   ├── button/         # Button primitive
│   ├── card/           # Card primitive
│   ├── chat/           # Chat components
│   ├── common/         # Shared components
│   ├── home-cards/     # Homepage sections
│   ├── loader/         # Loading spinner
│   ├── notifications/  # Notification card
│   ├── settings/       # Settings drawer
│   └── toast/          # Toast notifications
├── foundation/
│   ├── colors/         # Color tokens
│   └── icons/          # Icon components
└── layout/
    ├── DrawerContent.tsx
    ├── Header.tsx
    └── StockButton.tsx
```

## Chat Components

### Chat.tsx
- FlatList with `maintainVisibleContentPosition`
- Auto-scroll on new messages
- Sorts by `order` field
- Keyboard-aware footer height

### ChatInput.tsx
- Multiline TextInput
- Plus button for attachments
- Send/Cancel button toggle
- Live chat mode support
- Hidden during feedback input focus

### AIBlock.tsx
- Markdown rendering (`react-native-markdown-display`)
- Adaptive card viewer
- Chart viewer
- Image gallery with modal
- Feedback component (AI only)
- Sources pills
- Routing status

### UserBlock.tsx
- User message bubble
- File attachment display

### AttachmentSlideout.tsx
- Slideout drawer for file picker
- Camera, gallery, documents options

### AttachmentPreview.tsx
- Preview attached files
- Remove individual files

### ChatAIFeedback.tsx
- Thumbs up/down
- Feedback text input
- Scrolls to show input when focused

## Home Components

### WelcomeSection.tsx
- Gradient "Neo" text
- Personalized greeting

### AgentCards.tsx
- 2-column grid
- RBAC filtered
- Navigate to agent on press

### PromptSuggestions.tsx
- Suggested prompts
- Sets input value on press

## Layout Components

### DrawerContent.tsx
- Chat history (infinite scroll)
- Agent list
- Notifications
- Settings slideout
- Theme toggle

### Header.tsx
- Menu button
- Title
- Stock button (optional)

## Edge Cases & Behaviors

### Don't Break These:

1. **AIBlock: Multiple image sources**
   - `message.files` (attachments)
   - `message.contents` (generated)
   - Markdown embedded

2. **AIBlock: JSON response parsing**
   ```typescript
   const rawMessages = message.trim().split(/}(?=\s*{)/g);
   ```
   Handles concatenated JSON objects.

3. **AIBlock: Feedback only for AI**
   ```typescript
   {!isLiveChatAgent && <ChatAIFeedback ... />}
   ```

4. **Chat: Scroll triggers**
   ```typescript
   [messages.length, messages[messages.length - 1]?.message]
   ```
   Both count AND content change.

5. **ChatInput: Local state for input**
   ```typescript
   const [localValue, setLocalValue] = useState('');
   ```
   More reliable than global store.

6. **ChatInput: Sync from store**
   ```typescript
   useEffect(() => {
     if (storeInputValue && storeInputValue !== localValue) {
       setLocalValue(storeInputValue);
       setStoreInputValue('');  // Clear after sync
     }
   }, [storeInputValue]);
   ```

7. **AttachmentPreview: Files loading state**
   ```typescript
   const filesLoading = files.some(file => file.loading);
   const canSend = (hasText || hasFiles) && !filesLoading;
   ```

8. **SlideoutDrawer: Animated height**
   Shared reusable drawer component.

9. **DrawerContent: RBAC for agents**
   Same filtering as homepage.

10. **Notifications: Dismissed tracking**
    ```typescript
    const isDismissed = useNotificationStore((s) => s.isDismissed(id));
    ```
