import { useEffect, useState } from "react";
import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/TicketCountByMonth.module.scss';

/**
 * Définit les propriétés acceptées par le composant TicketCountByMonthYear.
 * @property month Le mois (numérique, 1-12) pour lequel récupérer les statistiques.
 * @property year L'année (numérique) pour laquelle récupérer les statistiques.
 */
interface TicketCountByMonthYearProps {
    month: number;
    year: number;
}

/**
 * Composant React affichant le nombre de tickets créés et résolus
 * pour un mois et une année spécifiques, fournis via les props.
 * Récupère les données depuis l'API et gère les états de chargement et d'erreur.
 *
 * @param props Les propriétés du composant, voir `TicketCountByMonthYearProps`.
 * @returns Le composant JSX affichant les compteurs ou les états alternatifs.
 */
export default function TicketCountByMonthYear({ month, year }: TicketCountByMonthYearProps) {
    const { t } = useTranslation();
    const [countTicketCreated, setCountTicketCreated] = useState<number | null>(null);
    const [countTicketResolved, setCountTicketResolved] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Effet pour récupérer les compteurs de tickets créés et résolus
     * lorsque les props `month` ou `year` changent.
     */
    useEffect(() => {
        /**
         * Fonction asynchrone pour récupérer les données des compteurs via deux appels API distincts.
         */
        async function fetchData() {
            setLoading(true);
            setError(null);
            setCountTicketCreated(null);
            setCountTicketResolved(null);
            try {
                const createdResponse = await fetch(
                    `/tickets/count-created-by-month-year?month=${month}&year=${year}`
                );
                if (!createdResponse.ok) {
                    throw new Error("Erreur lors de la récupération des données créées");
                }
                const createdData = await createdResponse.json();
                setCountTicketCreated(createdData.count ?? 0);

                const resolvedResponse = await fetch(
                    `/tickets/count-resolved-by-month-year?month=${month}&year=${year}`
                );
                if (!resolvedResponse.ok) {
                    throw new Error("Erreur lors de la récupération des données résolues");
                }
                const resolvedData = await resolvedResponse.json();
                setCountTicketResolved(resolvedData.count ?? 0);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Une erreur est survenue");
                setCountTicketCreated(null);
                setCountTicketResolved(null);
                console.error("Erreur fetch ticket counts:", err);
            } finally {
                setLoading(false);
            }
        }
        if (month >= 1 && month <= 12 && year > 1900) {
            fetchData();
        } else {
            setError("Mois ou année invalide.");
            setLoading(false);
        }
    }, [month, year]);

    return (
        <div className={styles.container}>
            <h2 className={styles.ticket}>{t("Global.Details")} :</h2>
            {loading ? (
                <p className={styles.chargement}>{t("Global.Chargement")}</p>
            ) : error ? (
                countTicketCreated === null && countTicketResolved === null ? <p className={styles.error}>{error}</p> : null
            ) : (
                <p className={styles.ticket}>{t("NbTicketMois.NbTicketsCreesMois")} :
                    <span className={styles.result}> {countTicketCreated ?? '-'}</span> </p>
            )}
            {loading ? (
                null
            ) : error ? (
                null
            ) : (
                <p className={styles.ticket}>{t("NbTicketMois.NbTicketsResolusMois")} :
                    <span className={styles.result}> {countTicketResolved ?? '-'}</span> </p>
            )}
            {!loading && error && (countTicketCreated !== null || countTicketResolved !== null) && (
                <p className={styles.error}>{error}</p>
            )}
        </div>
    );
}