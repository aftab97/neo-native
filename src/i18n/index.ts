// Import translation files statically for React Native
// Dynamic imports don't work well in React Native
import type { LocaleData } from 'ttag';
import de from './de.po.json';
import es from './es.po.json';
import fr from './fr.po.json';
import pl from './pl.po.json';

export const translations: Record<string, LocaleData> = {
  de: de as LocaleData,
  es: es as LocaleData,
  fr: fr as LocaleData,
  pl: pl as LocaleData,
};

export const getTranslation = (locale: string): LocaleData | undefined => {
  return translations[locale];
};
