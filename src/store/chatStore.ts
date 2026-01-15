import { create } from 'zustand';

interface ChatStore {
  // State
  inputValue: string;
  focusOnPrompt: boolean;
  isPromptPaused: boolean;
  lastPrompt: string;
  isPromptSuggestionsOpen: boolean;

  // Actions
  setInputValue: (value: string) => void;
  setFocusOnPrompt: (focus: boolean) => void;
  setIsPromptPaused: (paused: boolean) => void;
  setLastPrompt: (prompt: string) => void;
  setIsPromptSuggestionsOpen: (open: boolean) => void;
  reset: () => void;
}

const initialState = {
  inputValue: '',
  focusOnPrompt: false,
  isPromptPaused: false,
  lastPrompt: '',
  isPromptSuggestionsOpen: false,
};

export const useChatStore = create<ChatStore>((set) => ({
  ...initialState,

  setInputValue: (value) => set({ inputValue: value }),
  setFocusOnPrompt: (focus) => set({ focusOnPrompt: focus }),
  setIsPromptPaused: (paused) => set({ isPromptPaused: paused }),
  setLastPrompt: (prompt) => set({ lastPrompt: prompt }),
  setIsPromptSuggestionsOpen: (open) => set({ isPromptSuggestionsOpen: open }),
  reset: () => set(initialState),
}));
