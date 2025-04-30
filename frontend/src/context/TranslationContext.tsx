import { createContext, useState, ReactNode } from "react";

import fr from "../locales/fr.json";
import en from "../locales/en.json";

type NestedKeys<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends Record<string, any>
    ? `${Prefix}${K & string}` | NestedKeys<T[K], `${Prefix}${K & string}.`>
    : `${Prefix}${K & string}`;
}[keyof T];

type TranslationKeys = NestedKeys<typeof fr>;

const translations: Record<string, any> = { fr, en };

interface TranslationContextType {
  t: (key: TranslationKeys) => string;
  setLang: (lang: "fr" | "en") => void;
  lang: "fr" | "en";
}

export const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<"fr" | "en">("fr");

  const getTranslation = (key: string, obj: any): string => {
    return key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : key), obj);
  };

  const t = (key: TranslationKeys) => getTranslation(key, translations[lang]);

  return (
    <TranslationContext.Provider value={{ t, setLang, lang }}>
      {children}
    </TranslationContext.Provider>
  );
}
