import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import fr from './locales/fr.json';

const resources = {
  fr: { translation: fr },
} as const;

const i18n = createInstance();

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'fr';
const supportedLanguage = deviceLocale in resources ? deviceLocale : 'fr';

i18n.use(initReactI18next).init({
  resources,
  lng: supportedLanguage,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export default i18n;
