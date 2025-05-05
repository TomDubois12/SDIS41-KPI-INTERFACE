import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/MonthYearPickerStats.module.scss';

/**
 * Définit les propriétés initiales optionnelles pour le composant sélecteur d'année.
 * @property initialYear? L'année initiale à sélectionner. Défaut: année actuelle.
 */
interface YearPickerProps {
    initialYear?: number;
}

/**
 * Définit l'interface de la "poignée" (handle) exposée par le composant via `ref`.
 * Permet aux composants parents d'appeler des méthodes sur ce composant.
 * @property getTicketData Méthode pour récupérer les données de tickets calculées.
 */
export interface YearPickerStatsHandle {
    getTicketData: () => {
        countTicketCreated: number | null;
        resolutionRate: string | null;
    };
}

/**
 * Composant React (actuellement nommé MonthPickerStats mais fonctionnant comme YearPickerStats)
 * permettant à l'utilisateur de sélectionner une année via un menu déroulant.
 * Récupère les statistiques de tickets (créés, résolus) pour l'année sélectionnée
 * depuis une API, calcule le taux de résolution, et affiche ces informations.
 * Navigue vers une URL `/statistiques_annuelles` lors du changement d'année.
 * Expose une méthode `getTicketData` via `ref` pour que les composants parents
 * puissent récupérer les statistiques calculées. Utilise `forwardRef`.
 *
 * @param props Les propriétés initiales optionnelles, voir `YearPickerProps`.
 * @param ref La ref transférée depuis le composant parent pour l'accès impératif.
 * @returns Le composant JSX avec le sélecteur d'année et les statistiques affichées.
 */
const MonthPickerStats = forwardRef<YearPickerStatsHandle, YearPickerProps>(({ initialYear }, ref) => {
    const { t } = useTranslation();
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
     */
    useImperativeHandle(ref, () => ({
        getTicketData: () => ({
            countTicketCreated,
            resolutionRate
        })
    }));

    /**
     * Effet pour récupérer les compteurs de tickets créés et résolus annuels
     * lorsque la prop `selectedYear` change.
     */
    useEffect(() => {
        /**
         * Fonction asynchrone interne pour récupérer les données annuelles.
         */
        async function fetchData() {
            setLoading(true);
            setError(null);
            setCountTicketCreated(null);
            setCountTicketResolved(null);
            try {
                const createdResponse = await fetch(
                    `http://localhost:3001/tickets/count-created-by-year?year=${selectedYear}`
                );
                if (!createdResponse.ok) {
                    throw new Error("Erreur lors de la récupération des tickets créés");
                }
                const createdData = await createdResponse.json();
                setCountTicketCreated(createdData.count ?? 0);

                const resolvedResponse = await fetch(
                    `http://localhost:3001/tickets/count-resolved-by-year?year=${selectedYear}`
                );
                if (!resolvedResponse.ok) {
                    throw new Error("Erreur lors de la récupération des tickets résolus");
                }
                const resolvedData = await resolvedResponse.json();
                setCountTicketResolved(resolvedData.count ?? 0);

            } catch (err) {
                setError(err instanceof Error ? err.message : "Une erreur est survenue");
                setCountTicketCreated(null);
                setCountTicketResolved(null);
                console.error("Erreur fetch ticket counts by year:", err);
            } finally {
                setLoading(false);
            }
        }
        if (selectedYear > 1900) {
            fetchData();
        } else {
            setError("Année invalide.");
            setLoading(false);
        }
    }, [selectedYear]);

    /**
     * Gère le changement de sélection dans le menu déroulant de l'année.
     * Met à jour l'état `selectedYear` et navigue vers l'URL annuelle correspondante.
     * @param event L'événement de changement du select HTML.
     */
    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const year = parseInt(event.target.value, 10);
        setSelectedYear(year);
        navigate(`/statistiques_annuelles?year=${year}`);
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - 14 + i);

    return (
        <div className={styles.container}>
            <p>{t("Rapport.SelectionnerAnnee")} :</p>
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
                    countTicketCreated === null && countTicketResolved === null ? <p className={styles.error}>{error}</p> : null
                ) : (
                    <>
                        <p className={styles.ticket}>{t("NbTicketAnnee.NbTicketsCreesAnnee")} :
                            <span className={styles.result}> {countTicketCreated ?? '-'}</span>
                        </p>
                        {resolutionRate !== null && (
                            <p className={styles.ticket}>{t("Rapport.TauxResolution")} :
                                <span className={styles.result}> {resolutionRate}%</span>
                            </p>
                        )}
                    </>
                )}
                {!loading && error && (countTicketCreated !== null || countTicketResolved !== null) && (
                    <p className={styles.error}>{error}</p>
                )}
            </div>
        </div>
    );
});

// ATTENTION: L'export utilise le nom probablement incorrect
export default MonthPickerStats;