import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations, type Language, type TranslationKey } from '../i18n/translations';

type TranslationParams = Record<string, string | number>;

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

const STORAGE_KEY = 'biomed-language';
const FALLBACK_LANGUAGE: Language = 'en';

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const isLanguage = (value: string | null): value is Language => value === 'en' || value === 'pl';

const interpolate = (template: string, params?: TranslationParams) => {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return FALLBACK_LANGUAGE;
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(savedLanguage) ? savedLanguage : FALLBACK_LANGUAGE;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => interpolate(translations[language][key], params),
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
