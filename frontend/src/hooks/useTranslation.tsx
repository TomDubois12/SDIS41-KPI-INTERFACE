import { useContext } from "react";
import { TranslationContext } from "../context/TranslationContext";

/**
 * Hook personnalisé React pour accéder facilement au contexte de traduction.
 * Fournit un accès direct à la fonction de traduction `t`, à la fonction pour
 * changer la langue `setLang`, et à l'état de la langue actuelle `lang`.
 *
 * Important: Ce hook doit impérativement être utilisé à l'intérieur d'un composant
 * enfant du `TranslationProvider` pour fonctionner correctement.
 *
 * @returns La valeur du contexte de traduction, contenant `{ t, setLang, lang }`.
 * @throws {Error} Si le hook est utilisé en dehors d'un `TranslationProvider`.
 */
export function useTranslation() {
    const context = useContext(TranslationContext);

    if (!context) {
        throw new Error("useTranslation must be used within a TranslationProvider");
    }

    return context;
}