import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import EmailIMPT from "../components/EmailINPT";

/**
 * Composant React représentant la page d'affichage des alertes spécifiques aux Onduleurs.
 * Affiche l'en-tête standard (`Header`) et le composant `EmailIMPT` (nom d'importation potentiellement incorrect)
 * qui contient la logique et l'affichage des données d'alerte Onduleur.
 *
 * @returns Le composant JSX de la page des alertes Onduleurs.
 */
export default function AlertesOnduleurs() {
    const { t } = useTranslation();

    return (
        <>
            <Header text={t("Titles.Alertes")} />
            <EmailIMPT />
        </>
    );
}