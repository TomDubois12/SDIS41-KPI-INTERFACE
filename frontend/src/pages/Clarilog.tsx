import { useLocation } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import TicketCount from "../components/TicketCount";
import Performance from "../components/Performance";
import BarChart from "../components/BarChart";
import PieChart from "../components/PieChart";

import styles from '../styles/pages/Clarilog.module.scss';

/**
 * Composant React représentant la page principale d'affichage des performances
 * et statistiques Clarilog pour une journée spécifique.
 * La date est déterminée par le paramètre 'date' dans l'URL (`?date=YYYY-MM-DD`).
 * Ce composant agence plusieurs sous-composants qui récupèrent et affichent
 * les informations pertinentes pour cette date :
 * - `Header` : En-tête de la page.
 * - `TicketCount` : Tableau des tickets du jour et compteurs créés/résolus (lit l'URL).
 * - `Performance` : Indicateur de performance basé sur les tickets résolus (date requise).
 * - `BarChart` : Graphique des tickets par opérateur (date optionnelle).
 * - `PieChart` : Graphique des tickets par type (date optionnelle).
 *
 * @returns Le composant JSX de la page journalière Clarilog.
 */
export default function Clarilog() {
    const { t } = useTranslation();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const selectedDate = searchParams.get('date');

    return (
        <>
            <Header text={t("Titles.PerfClarilog")} />
            <div className={styles.container}>
                <div className={styles.divTab}>
                    <TicketCount />
                </div>
                <div className={styles.divStats}>
                    <Performance
                        date={selectedDate ?? ""}
                    />
                    <BarChart
                        date={selectedDate ?? undefined}
                        title={t("Charts.TicketsAttributionDay")}
                    />
                    <PieChart
                        date={selectedDate ?? undefined}
                        title={t("Charts.TiketsTypesDay")}
                    />
                </div>
            </div>
        </>
    );
}