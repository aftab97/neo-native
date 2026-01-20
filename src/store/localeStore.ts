import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCALE_STORAGE_KEY = 'neo-locale';

export interface LocaleStore {
  locale: string;
  isInitialized: boolean;
  setLocale: (locale: string) => void;
  initializeLocale: () => Promise<void>;
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: 'auto',
  isInitialized: false,

  setLocale: async (locale: string) => {
    set({ locale });
    try {
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch (error) {
      console.warn('Failed to save locale to storage:', error);
    }
  },

  initializeLocale: async () => {
    try {
      const storedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      if (storedLocale) {
        set({ locale: storedLocale, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch (error) {
      console.warn('Failed to load locale from storage:', error);
      set({ isInitialized: true });
    }
  },
}));
