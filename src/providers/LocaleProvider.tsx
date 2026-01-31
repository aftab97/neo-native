import React, { useEffect, useState, PropsWithChildren } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { addLocale, useLocale } from 'ttag';
import { useLocaleStore } from '../store/localeStore';
import { useEffectiveLocale, AvailableLocale } from '../hooks/useEffectiveLocale';
import { getTranslation } from '../i18n';
import { colors } from '../ui/foundation/colors/colors';

export const LocaleProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const initializeLocale = useLocaleStore((s) => s.initializeLocale);
  const isInitialized = useLocaleStore((s) => s.isInitialized);
  const [translationsReady, setTranslationsReady] = useState(false);

  const effectiveLocale = useEffectiveLocale();

  // Initialize locale from storage on mount
  useEffect(() => {
    initializeLocale();
  }, [initializeLocale]);

  // Load translations when effective locale changes
  useEffect(() => {
    if (!isInitialized) return;

    setTranslationsReady(false);

    if (effectiveLocale === 'en') {
      setTranslationsReady(true);
      return;
    }

    const translation = getTranslation(effectiveLocale);
    if (translation) {
      addLocale(effectiveLocale, translation);
      setTranslationsReady(true);
    } else {
      console.warn('Translation file not found for locale:', effectiveLocale);
      if (locale !== 'en') {
        setLocale('en');
      }
      setTranslationsReady(true);
    }
  }, [effectiveLocale, isInitialized, locale, setLocale]);

  // Set the active locale for ttag
  useLocale(translationsReady ? effectiveLocale : 'en');

  // Show loader while initializing
  if (!isInitialized || !translationsReady) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.blue['700']} />
      </View>
    );
  }

  // Re-render children when locale changes
  return <View key={effectiveLocale} style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
