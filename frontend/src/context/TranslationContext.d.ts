import { ReactNode } from "react";
import fr from "../locales/fr.json";
/**
 * Type utilitaire récursif pour générer une union de toutes les clés possibles
 * (y compris imbriquées avec notation par points) à partir d'un objet T.
 * Utilisé pour créer un typage fort pour les clés de traduction.
 * @template T Le type de l'objet source (ex: typeof fr).
 * @template Prefix Le préfixe actuel pour la notation par points (utilisé en interne par la récursion).
 * @returns Une union de toutes les clés possibles sous forme de chaînes de caractères.
 */
type NestedKeys<T, Prefix extends string = ""> = {
    [K in keyof T]: T[K] extends Record<string, any> ? `${Prefix}${K & string}` | NestedKeys<T[K], `${Prefix}${K & string}.`> : `${Prefix}${K & string}`;
}[keyof T];
/**
 * Type représentant l'union de toutes les clés de traduction valides,
 * généré à partir de la structure du fichier de traduction français (`fr.json`).
 * Permet l'autocomplétion et la vérification des clés utilisées avec la fonction `t`.
 */
type TranslationKeys = NestedKeys<typeof fr>;
/**
 * Définit la structure de la valeur fournie par le TranslationContext.
 * @property t Fonction pour obtenir une traduction basée sur une clé.
 * @property setLang Fonction pour changer la langue active.
 * @property lang La langue actuellement active ('fr' ou 'en').
 */
export interface TranslationContextType {
    t: (key: TranslationKeys) => string;
    setLang: (lang: "fr" | "en") => void;
    lang: "fr" | "en";
}
/**
 * Contexte React pour le système de traduction.
 * Fournit la fonction de traduction `t`, la fonction pour changer de langue `setLang`,
 * et la langue actuelle `lang` aux composants descendants.
 */
export declare const TranslationContext: import("react").Context<TranslationContextType | null>;
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
export declare function TranslationProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export {};
