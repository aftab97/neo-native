import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';

type ThemeType = 'light' | 'dark' | 'system';

interface LayoutStore {
  // State
  theme: ThemeType;
  isDarkTheme: boolean;
  title: string;
  showStartPage: boolean;
  isFeedbackInputFocused: boolean;
  chatListScrollCallback: ((offset: number) => void) | null;
  chatListScrollToEndCallback: (() => void) | null;
  chatListContentHeight: number;
  chatListScrollY: number;
  chatListHeight: number;

  // Actions
  setTheme: (theme: ThemeType) => void;
  setTitle: (title: string) => void;
  setShowStartPage: (show: boolean) => void;
  updateSystemTheme: (colorScheme: ColorSchemeName) => void;
  setFeedbackInputFocused: (focused: boolean) => void;
  setChatListScrollCallback: (callback: ((offset: number) => void) | null) => void;
  setChatListScrollToEndCallback: (callback: (() => void) | null) => void;
  setChatListMetrics: (contentHeight: number, scrollY: number, listHeight: number) => void;
  scrollChatListBy: (amount: number) => void;
  scrollChatListToEnd: () => void;
}

const getIsDarkTheme = (theme: ThemeType, systemColorScheme: ColorSchemeName): boolean => {
  if (theme === 'system') {
    return systemColorScheme === 'dark';
  }
  return theme === 'dark';
};

const initialColorScheme = Appearance.getColorScheme();

export const useLayoutStore = create<LayoutStore>((set, get) => ({
  theme: 'system',
  isDarkTheme: initialColorScheme === 'dark',
  title: '',
  showStartPage: true,
  isFeedbackInputFocused: false,
  chatListScrollCallback: null,
  chatListScrollToEndCallback: null,
  chatListContentHeight: 0,
  chatListScrollY: 0,
  chatListHeight: 0,

  setTheme: (theme) => {
    const systemColorScheme = Appearance.getColorScheme();
    set({
      theme,
      isDarkTheme: getIsDarkTheme(theme, systemColorScheme),
    });
  },

  setTitle: (title) => set({ title }),

  setShowStartPage: (show) => set({ showStartPage: show }),

  setFeedbackInputFocused: (focused) => set({ isFeedbackInputFocused: focused }),

  setChatListScrollCallback: (callback) => set({ chatListScrollCallback: callback }),

  setChatListScrollToEndCallback: (callback) => set({ chatListScrollToEndCallback: callback }),

  setChatListMetrics: (contentHeight, scrollY, listHeight) =>
    set({ chatListContentHeight: contentHeight, chatListScrollY: scrollY, chatListHeight: listHeight }),

  scrollChatListBy: (amount) => {
    const { chatListScrollCallback, chatListScrollY, chatListContentHeight, chatListHeight } = get();
    if (chatListScrollCallback) {
      const maxScroll = Math.max(0, chatListContentHeight - chatListHeight);
      const newOffset = Math.min(maxScroll, Math.max(0, chatListScrollY + amount));
      chatListScrollCallback(newOffset);
    }
  },

  scrollChatListToEnd: () => {
    const { chatListScrollToEndCallback } = get();
    if (chatListScrollToEndCallback) {
      chatListScrollToEndCallback();
    }
  },

  updateSystemTheme: (colorScheme) => {
    const { theme } = get();
    if (theme === 'system') {
      set({ isDarkTheme: colorScheme === 'dark' });
    }
  },
}));

// Listen for system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  useLayoutStore.getState().updateSystemTheme(colorScheme);
});
