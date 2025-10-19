// src/i18n/language.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { translations, DEFAULT_LANG } from "./index"; 
import type { Language } from "./index";               

const STORAGE_KEY = "app_lang";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/{([^}]+)}/g, (_, name) => String(vars[name.trim()] ?? `{${name}}`));
}

function getByKeyPath(obj: any, keyPath: string) {
  const keys = keyPath.split(".");
  let cur = obj;
  for (const k of keys) {
    cur = cur?.[k];
    if (cur === undefined) return undefined;
  }
  return cur;
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return ((localStorage.getItem(STORAGE_KEY) as Language) || DEFAULT_LANG);
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (keyPath: string, vars?: Record<string, string | number>) => {
    const value = getByKeyPath(translations[language], keyPath);
    return value ? interpolate(value, vars) : keyPath;
  };

  const value = useMemo(() => ({ language, setLanguage, t }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
