import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import TicketDetail from "../components/TicketDetail";

/**
 * Composant React représentant la page d'affichage des détails d'un ticket Clarilog.
 * Sert principalement de conteneur pour afficher l'en-tête standard (`Header`)
 * et le composant `TicketDetail` qui contient la logique et l'affichage
 * spécifiques aux détails d'un ticket (récupérés via l'ID dans l'URL).
 *
 * @returns Le composant JSX de la page de détail de ticket.
 */
export default function ClarilogTicketDetail() {
    const { t } = useTranslation();

    return (
        <>
            <Header
                text={t("Titles.PerfClarilog")}
            />
            <TicketDetail />
        </>
    );
}