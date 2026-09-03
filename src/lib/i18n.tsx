import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { LANGUAGES, TRANSLATIONS, type Language } from "@/lib/types";

interface I18nContextValue {
  lang: string;
  setLang: (code: string) => void;
  t: (key: string) => string;
  languages: Language[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<string>(() => {
    return localStorage.getItem("tikkil-lang") || "en";
  });

  const setLang = useCallback((code: string) => {
    setLangState(code);
    localStorage.setItem("tikkil-lang", code);
  }, []);

  const t = useCallback(
    (key: string) => {
      return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
