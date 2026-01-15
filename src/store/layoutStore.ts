import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';

type ThemeType = 'light' | 'dark' | 'system';

interface LayoutStore {
  // State
  theme: ThemeType;
  isDarkTheme: boolean;
  title: string;
  showStartPage: boolean;

  // Actions
  setTheme: (theme: ThemeType) => void;
  setTitle: (title: string) => void;
  setShowStartPage: (show: boolean) => void;
  updateSystemTheme: (colorScheme: ColorSchemeName) => void;
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

  setTheme: (theme) => {
    const systemColorScheme = Appearance.getColorScheme();
    set({
      theme,
      isDarkTheme: getIsDarkTheme(theme, systemColorScheme),
    });
  },

  setTitle: (title) => set({ title }),

  setShowStartPage: (show) => set({ showStartPage: show }),

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
