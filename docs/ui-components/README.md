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
Slideout drawer with animated navigation between attachments and prompts views.

**Features:**
- Native iOS-style slide animations between views (250ms, `useNativeDriver: true`)
- Photos section with camera button and recent photos grid
- Action rows: Web Search, Add Files, Prompts
- Expandable drawer with 2-row photo grid when expanded

**Views:**
- **Attachments view**: Photos + action rows (Web Search, Add Files, Prompts)
- **Prompts view**: Full PromptLibraryTab component

**Icons Used:**
- `CameraIcon` - Camera button in photos section
- `PlusIcon` - "More" button in photos section
- `SearchWebIcon` - Web Search row (globe with meridians, matches web app)
- `FileIcon` - Add Files row
- `PromptLibraryIcon` - Prompts row (document with pencil, matches web app)

**Props:**
```typescript
interface AttachmentSlideoutProps {
  visible: boolean;
  onClose: () => void;
  isLiveChatActive?: boolean;  // Affects file type display text
}
```

### AttachmentPreview.tsx
- Preview attached files
- Remove individual files

### PromptLibraryTab.tsx
Multi-screen prompt template library with native slide animations.

**Features:**
- Categories from AGENTS config (matches web app prompt library order)
- RBAC-filtered (uses `useAvailableServices` hook)
- Native iOS-style slide animations (250ms, `useNativeDriver: true`)
- Search input always visible (filters categories or prompts depending on screen)
- Shows all categories including those with 0 prompts (matches web app)

**Screens:**
- **Categories screen**: Header + search + list of category rows (icon, name, count, chevron)
- **Prompts screen**: Header with category name + search + prompt cards (title, preview, subcategory badge)

**Props:**
```typescript
interface PromptLibraryTabProps {
  onSelectPrompt: () => void;  // Called when prompt selected (closes drawer)
  onBack: () => void;          // Called when back pressed on categories screen
}
```

**Icons Used:**
- `PromptLibraryIcon` - Category row icons and empty state
- `SearchIcon` - Search input and no results state
- `ChevronRightIcon` - Category row indicator
- `ChevronLeftIcon` - Back button in header

**Styling (matches web app input.css):**
- Search input: white/black background, gray-300/gray-800 border, 12px radius, 40px height
- Placeholder: "Search for prompts"

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

11. **AttachmentSlideout: View state reset on close**
    ```typescript
    useEffect(() => {
      if (!visible) {
        setRecentPhotos([]);
        setCurrentView('attachments');  // Reset to main view
      }
    }, [visible]);
    ```

12. **PromptLibraryTab: Multi-screen navigation with animation**
    ```typescript
    const handleBackPress = () => {
      if (currentScreen === 'prompts') {
        handleBackToCategories();  // Animated slide back to categories
      } else {
        onBack();  // Go back to attachments view
      }
    };

    const handleCategorySelect = (category: CategoryInfo) => {
      setSelectedCategory(category);
      setCurrentScreen('prompts');
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    };
    ```

13. **PromptLibraryTab: Categories from AGENTS with RBAC (shows all)**
    ```typescript
    const categories = useMemo((): CategoryInfo[] => {
      // Get available agents based on RBAC, only those with categoryName
      const availableAgents = availableServices.length === 0
        ? AGENTS.filter((agent) => agent.categoryName)
        : AGENTS.filter((agent) => agent.categoryName && availableServices.includes(agent.id));

      // Map to CategoryInfo - show ALL agents (even with 0 prompts) to match web app
      return availableAgents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        categoryName: agent.categoryName!,
        promptCount: promptCountsByCategory[agent.categoryName!] || 0,
      }));
    }, [data?.prompts, availableServices, promptCountsByCategory]);
    ```

14. **PromptLibraryTab: Set input value on selection**
    ```typescript
    const handleSelectPrompt = (prompt: PromptLibraryPrompt) => {
      setInputValue(prompt.prompt);  // Fill ChatInput via chatStore
      onSelectPrompt();              // Close drawer
    };
    ```

15. **AttachmentSlideout: Animated view transitions**
    ```typescript
    // Both views rendered simultaneously, positioned with transforms
    const attachmentsTranslateX = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -SCREEN_WIDTH],
    });
    const promptsTranslateX = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [SCREEN_WIDTH, 0],
    });
    // pointerEvents toggled to prevent interaction with off-screen view
    ```

16. **PromptLibraryTab: Search scope changes by screen**
    - Categories screen: Filters by `categoryName` and `name`
    - Prompts screen: Filters by `title`, `prompt`, `agent`, and `subCategory`

17. **PromptLibraryTab: Loading waits for both APIs**
    ```typescript
    const isLoading = isPromptsLoading || isServicesLoading;
    ```

18. **AttachmentSlideout: Animation reset on close**
    ```typescript
    useEffect(() => {
      if (!visible) {
        setRecentPhotos([]);
        setCurrentView('attachments');
        slideAnim.setValue(0);  // Reset animation position
      }
    }, [visible]);
    ```
