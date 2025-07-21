'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationES from '../locales/es/translation.json';
import translationEN from '../locales/en/translation.json';

const resources = {
  es: { translation: translationES },
  en: { translation: translationEN },
};

// Solo inicializar si aún no se ha hecho (evita re-inicialización)
if (!i18n.isInitialized) {
  const savedLang = typeof window !== 'undefined' ? sessionStorage.getItem('lang') : null;

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLang || 'es',
      fallbackLng: 'es',
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
