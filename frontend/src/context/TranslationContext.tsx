import { createContext, useState, ReactNode } from "react";
import fr from "../locales/fr.json";
import en from "../locales/en.json";

// Définition des clés de traduction basées sur un des fichiers JSON
type TranslationKeys = keyof typeof fr;

// Type des traductions
type Translations = Record<TranslationKeys, string>;

// Dictionnaire des traductions importé des fichiers JSON
const translations: Record<string, Translations> = { fr, en };

// Contexte de traduction
interface TranslationContextType {
  t: (key: TranslationKeys) => string;
  setLang: (lang: "fr" | "en") => void;
  lang: "fr" | "en";
}

export const TranslationContext = createContext<TranslationContextType | null>(
  null
);

// Provider
export function TranslationProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<"fr" | "en">("fr");

  const t = (key: TranslationKeys) => translations[lang][key];

  return (
    <TranslationContext.Provider value={{ t, setLang, lang }}>
      {children}
    </TranslationContext.Provider>
  );
}
