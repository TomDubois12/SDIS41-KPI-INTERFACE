import { useLocation } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import CalendarComponent from "../components/Calendar";
import TicketCountByMonthYear from "../components/TicketCountByMonthYear";
import BarChart from "../components/BarChart";
import PieChart from "../components/PieChart";

import styles from '../styles/pages/ClarilogMensuel.module.scss';

/**
 * Composant React représentant la page d'affichage des performances et statistiques
 * Clarilog pour un mois spécifique.
 * Récupère le mois et l'année à afficher depuis les paramètres de l'URL (`?month=M&year=Y`).
 * Orchestre l'affichage de plusieurs sous-composants :
 * - `Header` : L'en-tête de la page.
 * - `CalendarComponent` : Un calendrier interactif pour la navigation.
 * - `TicketCountByMonthYear` : Affiche les compteurs de tickets créés/résolus pour le mois/année.
 * - `BarChart` : Graphique en barres des tickets par opérateur pour le mois/année.
 * - `PieChart` : Graphique en secteurs des tickets par type pour le mois/année.
 *
 * @returns Le composant JSX de la page des statistiques mensuelles Clarilog.
 */
export default function ClarilogMensuel() {
    const { t } = useTranslation();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const currentMonth = new Date().getMonth() + 1;
    const currentFullYear = new Date().getFullYear();
    const month = monthParam && !isNaN(parseInt(monthParam, 10)) ? parseInt(monthParam, 10) : currentMonth;
    const year = yearParam && !isNaN(parseInt(yearParam, 10)) ? parseInt(yearParam, 10) : currentFullYear;

    return (
        <>
            <Header text={t("Titles.PerfClarilog")} />
            <div className={styles.container}>
                <div className={styles.divCalendar}>
                    <CalendarComponent />
                </div>
                <div className={styles.divStats}>
                    <TicketCountByMonthYear
                        month={month}
                        year={year}
                    />
                    <BarChart
                        month={month}
                        year={year}
                        title={t("Charts.TicketsAttributionMonth")}
                    />
                    <PieChart
                        month={month}
                        year={year}
                        title={t("Charts.TiketsTypesMonth")}
                    />
                </div>
            </div>
        </>
    );
}