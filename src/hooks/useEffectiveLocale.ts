import { NativeModules, Platform } from 'react-native';
import { useLocaleStore } from '../store/localeStore';

export const availableLocales = ['de', 'en', 'es', 'fr', 'pl'] as const;
export type AvailableLocale = (typeof availableLocales)[number];

/**
 * Get the device's current locale
 */
export const getDeviceLocale = (): AvailableLocale => {
  let deviceLocale = 'en';

  try {
    if (Platform.OS === 'ios') {
      deviceLocale =
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        'en';
    } else if (Platform.OS === 'android') {
      deviceLocale = NativeModules.I18nManager?.localeIdentifier || 'en';
    }
  } catch {
    deviceLocale = 'en';
  }

  // Extract language code (e.g., 'en_US' -> 'en')
  const langCode = deviceLocale.split(/[_-]/)[0].toLowerCase();

  return (availableLocales as readonly string[]).includes(langCode)
    ? (langCode as AvailableLocale)
    : 'en';
};

/**
 * Get the effective locale based on the stored preference
 */
export const getEffectiveLocale = (
  locale: 'auto' | AvailableLocale,
): AvailableLocale => (locale === 'auto' ? getDeviceLocale() : locale);

/**
 * Hook to get the effective locale
 */
export const useEffectiveLocale = (): AvailableLocale => {
  const locale = useLocaleStore((s) => s.locale);

  const isAvailableLocale = (l: string): l is AvailableLocale =>
    (availableLocales as readonly string[]).includes(l);
  const effectiveLocale: 'auto' | AvailableLocale =
    locale === 'auto' || isAvailableLocale(locale) ? locale : 'en';

  return getEffectiveLocale(effectiveLocale);
};
