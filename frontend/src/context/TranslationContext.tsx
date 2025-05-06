import { createContext, useState, ReactNode } from "react"; // Import 'React' supprimé

import fr from "../locales/fr.json"; // Assurez-vous que le chemin est correct
import en from "../locales/en.json"; // Assurez-vous que le chemin est correct

/**
 * Type utilitaire récursif pour générer une union de toutes les clés possibles
 * (y compris imbriquées avec notation par points) à partir d'un objet T.
 * Utilisé pour créer un typage fort pour les clés de traduction.
 * @template T Le type de l'objet source (ex: typeof fr).
 * @template Prefix Le préfixe actuel pour la notation par points (utilisé en interne par la récursion).
 * @returns Une union de toutes les clés possibles sous forme de chaînes de caractères.
 */
type NestedKeys<T, Prefix extends string = ""> = {
    [K in keyof T]: T[K] extends Record<string, any>
        ? `${Prefix}${K & string}` | NestedKeys<T[K], `${Prefix}${K & string}.`>
        : `${Prefix}${K & string}`;
}[keyof T];

/**
 * Type représentant l'union de toutes les clés de traduction valides,
 * généré à partir de la structure du fichier de traduction français (`fr.json`).
 * Permet l'autocomplétion et la vérification des clés utilisées avec la fonction `t`.
 */
type TranslationKeys = NestedKeys<typeof fr>;

const translations: Record<string, any> = { fr, en };

/**
 * Définit la structure de la valeur fournie par le TranslationContext.
 * @property t Fonction pour obtenir une traduction basée sur une clé.
 * @property setLang Fonction pour changer la langue active.
 * @property lang La langue actuellement active ('fr' ou 'en').
 */
export interface TranslationContextType { // <- EXPORT ajouté ici
    t: (key: TranslationKeys) => string;
    setLang: (lang: "fr" | "en") => void;
    lang: "fr" | "en";
}

/**
 * Contexte React pour le système de traduction.
 * Fournit la fonction de traduction `t`, la fonction pour changer de langue `setLang`,
 * et la langue actuelle `lang` aux composants descendants.
 */
export const TranslationContext = createContext<TranslationContextType | null>(null);

/**
 * Fournisseur de contexte (Provider) pour le système de traduction.
 * Gère l'état de la langue sélectionnée, charge les fichiers de traduction,
 * et met à disposition la fonction `t`, `setLang` et `lang` via le contexte.
 * Doit englober les parties de l'application nécessitant la traduction.
 *
 * @param props Les propriétés du composant, attend `children`.
 * @param props.children Les composants enfants qui auront accès au contexte de traduction.
 * @returns Le composant Provider enveloppant les enfants.
 */
export function TranslationProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<"fr" | "en">("fr");

    /**
     * Fonction utilitaire interne pour récupérer une valeur dans un objet potentiellement imbriqué
     * en utilisant une clé avec notation par points (ex: "Parametre.Title").
     * Retourne la clé elle-même si la traduction n'est pas trouvée.
     * @param key La clé de traduction (ex: "Section.Titre").
     * @param obj L'objet de traduction pour la langue actuelle.
     * @returns La chaîne de traduction correspondante ou la clé si non trouvée.
     */
    const getTranslation = (key: string, obj: any): string => {
        return key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : key), obj);
    };

    /**
     * Fonction de traduction principale fournie par le contexte.
     * Prend une clé de traduction typée et retourne la chaîne correspondante
     * dans la langue actuellement sélectionnée.
     * @param key La clé de traduction (type `TranslationKeys` pour la sécurité).
     * @returns La chaîne traduite ou la clé si non trouvée.
     */
    const t = (key: TranslationKeys): string => getTranslation(key, translations[lang]);

    return (
        <TranslationContext.Provider value={{ t, setLang, lang }}>
            {children}
        </TranslationContext.Provider>
    );
}