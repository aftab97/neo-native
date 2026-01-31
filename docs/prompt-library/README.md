# Prompt Library

## Overview

Searchable library of pre-built prompt templates organized by agent/category. Accessible via the AttachmentSlideout drawer with native iOS-style slide animations between screens.

## Files

| File | Purpose |
|------|---------|
| `src/api/promptLibrary.ts` | API hook and types |
| `src/ui/components/chat/PromptLibraryTab.tsx` | Main component with categories/prompts screens |
| `src/ui/components/chat/AttachmentSlideout.tsx` | Parent drawer with "Prompts" row |

## Components

### PromptLibraryTab

Multi-screen component with animated transitions:

**Categories Screen:**
- Header with back button and "Prompts" title
- Search input (filters category names)
- List of category rows (icon, name, count, chevron)

**Prompts Screen:**
- Header with back button and category name
- Search input (filters prompts within category)
- Grid of prompt cards (title, preview, subcategory badge)

### AttachmentSlideout Integration

The "Prompts" row in AttachmentSlideout navigates to PromptLibraryTab:

```
Attachments view → tap "Prompts" row → Categories screen
                                          ↓ tap category
                                       Prompts screen
                                          ↓ tap prompt
                                       ChatInput filled, drawer closes
```

## API

**Endpoint:** `POST /api/v1/session/promptLibrary`

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

## Data Flow

```typescript
// 1. Fetch all prompts
const { data } = useGetPrompts();

// 2. Categories from AGENTS config + prompt counts
const categories = AGENTS
  .filter(agent => agent.categoryName && availableServices.includes(agent.id))
  .map(agent => ({
    id: agent.id,
    categoryName: agent.categoryName,
    promptCount: promptCountsByCategory[agent.categoryName] || 0,
  }));

// 3. Filter prompts by category and search
const filteredPrompts = data.prompts.filter(p =>
  p.agent === selectedCategory.categoryName &&
  matchesSearch(p, searchText)
);

// 4. Selection fills ChatInput
setInputValue(prompt.prompt);
onSelectPrompt(); // closes drawer
```

## Animation

| Property | Value |
|----------|-------|
| Duration | 250ms |
| Type | Horizontal slide (translateX) |
| Native driver | Yes |

```typescript
// Forward: new screen slides in from right
slideAnim → 0 to 1
categoriesTranslateX: [0, -SCREEN_WIDTH]
promptsTranslateX: [SCREEN_WIDTH, 0]

// Back: current screen slides out to right
slideAnim → 1 to 0
```

## Styling

**Search Input (matches web app):**

| Property | Light | Dark |
|----------|-------|------|
| Background | #ffffff | #000000 |
| Text | #21232c | #f0f2f6 |
| Placeholder | #929aaf | #4c5366 |
| Border | #cfd4e2 | #2b2f3b |
| Border radius | 12px | 12px |
| Height | 40px | 40px |
| Placeholder | "Search for prompts" |

**Category Row:**
- PromptLibraryIcon on left
- Category name (primary text)
- Prompt count (secondary text)
- ChevronRightIcon on right

**Prompt Card:**
- Title: 16px semibold, 2 lines max
- Preview: 14px, 3 lines max, truncated
- Subcategory badge: 12px, pill style

## Edge Cases

1. **Empty prompts response**
   - Shows empty state with PromptLibraryIcon
   - "No prompts available" message

2. **Search with no results**
   - Shows SearchIcon with "No prompts match your search"
   - Search persists between screen navigations

3. **API error**
   - Shows "Failed to load prompts" with retry button

4. **Loading state**
   - ActivityIndicator with "Loading prompts..."
   - Waits for both prompts and services APIs

5. **RBAC filtering**
   - If services still loading, shows all agents with categoryName
   - Once loaded, filters to user's accessible agents
   - Controlled by `SHOW_ALL_AGENTS` flag for testing

6. **Categories with zero prompts**
   - Still displayed (matches web app)
   - Shows "0 prompts" subtitle
   - Empty state when navigated into

7. **Drawer close resets state**
   - Resets to attachments view
   - Clears search text
   - Resets animation position
   - Clears selected category

8. **Back button behavior**
   - Prompts screen → Categories screen (animated)
   - Categories screen → Attachments view (animated)

9. **Search scope**
   - Categories screen: filters by category name
   - Prompts screen: filters by title, prompt, agent, subcategory

10. **Category ordering**
    - Uses AGENTS array order (matches web app sidebar)
    - General → Contracts → Finance → ... → GTD Skills

11. **Live chat mode**
    - Prompt selection works normally
    - Selected prompt fills ChatInput for editing before send

12. **Long prompt text**
    - Title: 2 lines with ellipsis
    - Preview: 3 lines with ellipsis
    - Full text used when filling ChatInput

## Icons Used

| Icon | Usage |
|------|-------|
| PromptLibraryIcon | Category rows, empty state |
| SearchIcon | Search input, no results state |
| ChevronRightIcon | Category row indicator |
| ChevronLeftIcon | Back button in header |
