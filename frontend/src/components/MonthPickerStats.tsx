import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/MonthYearPickerStats.module.scss';

/**
 * Définit les propriétés initiales optionnelles pour le composant MonthPickerStats.
 * @property initialMonth? Le mois initial à sélectionner (1-12). Défaut: mois actuel.
 * @property initialYear? L'année initiale à sélectionner. Défaut: année actuelle.
 */
interface MonthPickerProps {
    initialMonth?: number;
    initialYear?: number;
}

/**
 * Définit l'interface de la "poignée" (handle) exposée par le composant via `ref`.
 * Permet aux composants parents d'appeler des méthodes sur ce composant.
 * @property getTicketData Méthode pour récupérer les données de tickets calculées par ce composant.
 */
export interface MonthPickerStatsHandle {
    getTicketData: () => {
        countTicketCreated: number | null;
        resolutionRate: string | null;
    };
}

/**
 * Composant React permettant à l'utilisateur de sélectionner un mois et une année.
 * Récupère les statistiques de tickets (créés, résolus) pour la période sélectionnée
 * depuis une API, calcule le taux de résolution, et affiche ces informations.
 * Navigue vers une URL `/statistiques_mensuelles` lors du changement de mois ou d'année.
 * Expose une méthode `getTicketData` via `ref` pour que les composants parents
 * puissent récupérer les statistiques calculées. Utilise `forwardRef`.
 *
 * @param props Les propriétés initiales optionnelles, voir `MonthPickerProps`.
 * @param ref La ref transférée depuis le composant parent pour l'accès impératif.
 * @returns Le composant JSX avec les sélecteurs de mois/année et les statistiques affichées.
 */
const MonthPickerStats = forwardRef<MonthPickerStatsHandle, MonthPickerProps>(({ initialMonth, initialYear }, ref) => {
    const { t } = useTranslation();
    const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth || new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(initialYear || new Date().getFullYear());
    const [countTicketCreated, setCountTicketCreated] = useState<number | null>(null);
    const [countTicketResolved, setCountTicketResolved] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const resolutionRate = countTicketCreated && countTicketCreated > 0
        ? ((countTicketResolved ?? 0) / countTicketCreated * 100).toFixed(2)
        : null;

    /**
     * Expose la méthode `getTicketData` au composant parent via la ref.
     * Permet au parent de récupérer les dernières statistiques calculées.
     */
    useImperativeHandle(ref, () => ({
        getTicketData: () => ({
            countTicketCreated,
            resolutionRate
        })
    }));

    useEffect(() => {
        /**
         * Fonction asynchrone pour récupérer les données de comptage des tickets
         * créés et résolus pour le mois et l'année sélectionnés via deux appels API distincts.
         * Met à jour les états de chargement, d'erreur et de données.
         */
        async function fetchData() {
            setLoading(true);
            setError(null);
            setCountTicketCreated(null);
            setCountTicketResolved(null);
            try {
                const createdResponse = await fetch(
                    `/tickets/count-created-by-month-year?month=${selectedMonth}&year=${selectedYear}`
                );
                if (!createdResponse.ok) throw new Error("Erreur récupération tickets créés");
                const createdData = await createdResponse.json();
                setCountTicketCreated(createdData.count);

                const resolvedResponse = await fetch(
                    `/tickets/count-resolved-by-month-year?month=${selectedMonth}&year=${selectedYear}`
                );
                if (!resolvedResponse.ok) throw new Error("Erreur récupération tickets résolus");
                const resolvedData = await resolvedResponse.json();
                setCountTicketResolved(resolvedData.count);

            } catch (err) {
                setError(err instanceof Error ? err.message : "Une erreur est survenue");
                setCountTicketCreated(null);
                setCountTicketResolved(null);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [selectedMonth, selectedYear]);

    /**
     * Gère le changement de sélection dans le dropdown du mois.
     * Met à jour l'état `selectedMonth` et navigue vers l'URL correspondante.
     * @param event L'événement de changement du select HTML.
     */
    const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const month = parseInt(event.target.value, 10);
        setSelectedMonth(month);
        navigate(`/statistiques_mensuelles?month=${month}&year=${selectedYear}`);
    };

    /**
     * Gère le changement de sélection dans le dropdown de l'année.
     * Met à jour l'état `selectedYear` et navigue vers l'URL correspondante.
     * @param event L'événement de changement du select HTML.
     */
    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const year = parseInt(event.target.value, 10);
        setSelectedYear(year);
        navigate(`/statistiques_mensuelles?month=${selectedMonth}&year=${year}`);
    };

    const monthNames = [
        t('Mois.JAN'), t('Mois.FEV'), t('Mois.MAR'), t('Mois.AVR'), t('Mois.MAI'), t('Mois.JUIN'),
        t('Mois.JUI'), t('Mois.AOU'), t('Mois.SEP'), t('Mois.OCT'), t('Mois.NOV'), t('Mois.DEC')
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - 14 + i);

    return (
        <div className={styles.container}>
            <p>{t("Rapport.SelectionnerMoisAnnee")} :</p>
            <select value={selectedMonth} onChange={handleMonthChange} className={styles.monthSelect}>
                {monthNames.map((month, index) => (
                    <option key={index + 1} value={index + 1}>
                        {month}
                    </option>
                ))}
            </select>
            <select value={selectedYear} onChange={handleYearChange} className={styles.yearSelect}>
                {years.map((year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                ))}
            </select>
            <div>
                {loading ? (
                    <p className={styles.chargement}>{t("Global.Chargement")}</p>
                ) : error ? (
                    <p className={styles.error}>{error}</p>
                ) : (
                    <>
                        <p className={styles.ticket}>{t("NbTicketMois.NbTicketsCreesMois")} :
                            <span className={styles.result}> {countTicketCreated ?? '-'}</span>
                        </p>
                        {resolutionRate !== null && (
                            <p className={styles.ticket}>{t("Rapport.TauxResolution")} :
                                <span className={styles.result}> {resolutionRate}%</span>
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
});

export default MonthPickerStats;