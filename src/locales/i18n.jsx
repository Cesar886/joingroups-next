'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationES from '../locales/es/translation.json';
import translationEN from '../locales/en/translation.json';

const resources = {
  es: { translation: translationES },
  en: { translation: translationEN },
};

function detectLangFromHostname() {
  if (typeof window === 'undefined') return 'es';
  const subdomain = window.location.hostname.split('.')[0]; // us.joingroups.pro → "us"
  if (subdomain === 'us') return 'en';
  if (subdomain === 'mx' || subdomain === 'es') return 'es';
  return 'es'; // fallback
}

if (!i18n.isInitialized) {
  const detectedLang = detectLangFromHostname();

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: detectedLang,
      fallbackLng: 'es',
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
