import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

import TicketCountByYear from "../components/TicketCountByYear";
import Header from "../components/Header";
import BarChart from "../components/BarChart";
import PieChart from "../components/PieChart";
import YearPicker from "../components/YearPicker";
import Button from "../components/Button";

import styles from '../styles/pages/ClarilogAnnuel.module.scss';

/**
 * Composant React représentant la page d'affichage des performances et statistiques
 * Clarilog pour une année spécifique.
 * Récupère l'année à afficher depuis les paramètres de l'URL (`?year=Y`).
 * Orchestre l'affichage de plusieurs sous-composants :
 * - `Header` : L'en-tête de la page.
 * - `YearPicker` : Permet de changer l'année affichée (et met à jour l'URL).
 * - `TicketCountByYear` : Affiche les compteurs de tickets créés/résolus pour l'année.
 * - `BarChart` : Graphique en barres des tickets par opérateur pour l'année.
 * - `PieChart` : Graphique en secteurs des tickets par type pour l'année.
 * Fournit un bouton pour revenir à la vue mensuelle courante.
 *
 * @returns Le composant JSX de la page des statistiques annuelles Clarilog.
 */
const ClarilogAnnuel: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const [year, setYear] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    /**
     * Effet pour lire l'année depuis les paramètres de l'URL au montage
     * ou lors d'un changement de query string.
     */
    useEffect(() => {
        const yearStr = searchParams.get("year");
        const yearNumber = yearStr ? parseInt(yearStr, 10) : undefined;
        if (yearNumber && !isNaN(yearNumber)) {
            setYear(yearNumber);
        } else {
            setYear(undefined);
            console.warn("Année manquante ou invalide dans l'URL.");
        }
        setLoading(false);
    }, [location.search]);

    /**
     * Gère le clic sur le bouton pour rediriger vers la vue mensuelle
     * du mois et de l'année courants.
     */
    const handleMonthRedirect = () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        navigate(`/clarilog_mensuel?year=${currentYear}&month=${currentMonth}`);
    };

    if (loading) {
        return <p>{t("Global.Chargement")}</p>;
    }

    if (year === undefined) {
        return <p>Erreur : Année non spécifiée ou invalide dans l'URL.</p>;
    }

    return (
        <>
            <Header
                text={t("Titles.PerfClarilog")}
            />
            <div className={styles.container}>
                <div className={styles.divCalendar}>
                    <YearPicker
                        initialYear={year}
                    />
                    <TicketCountByYear
                        year={year}
                    />
                    <Button
                        backgroundColor={"#2B3244"}
                        text={t("Calendar.GoToMonth")}
                        textColor={"white"}
                        onClick={handleMonthRedirect}
                    />
                </div>
                <div className={styles.divStats}>
                    <BarChart
                        year={year}
                        title={t("Charts.TicketsAttributionYear")}
                    />
                    <PieChart
                        year={year}
                        title={t("Charts.TiketsTypesYear")}
                    />
                </div>
            </div>
        </>
    );
};
export default ClarilogAnnuel;