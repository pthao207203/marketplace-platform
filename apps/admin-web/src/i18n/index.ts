// src/i18n/index.ts
import { en as dashboardEn, vi as dashboardVi } from "./Translations/dashboard";

export const translations = {
  en: {
    dashboard: dashboardEn,
  },
  vi: {
    dashboard: dashboardVi,
  },
} as const;

export type Language = keyof typeof translations; // "en" | "vi"
export const DEFAULT_LANG: Language = "en";
