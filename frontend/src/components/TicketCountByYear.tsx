import { useEffect, useState } from "react";
import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/TicketCountByYear.module.scss';

/**
 * Définit les propriétés acceptées par le composant TicketCountByYear.
 * @property year L'année (numérique) pour laquelle récupérer les statistiques.
 */
interface TicketCountByYearProps {
    year: number;
}

/**
 * Composant React affichant le nombre de tickets créés et résolus
 * pour une année spécifiques, fournie via les props.
 * Récupère les données depuis l'API et gère les états de chargement et d'erreur.
 *
 * @param props Les propriétés du composant, voir `TicketCountByYearProps`.
 * @returns Le composant JSX affichant les compteurs ou les états alternatifs.
 */
export default function TicketCountByYear({ year }: TicketCountByYearProps) {
    const { t } = useTranslation();
    const [countTicketCreated, setCountTicketCreated] = useState<number | null>(null);
    const [countTicketResolved, setCountTicketResolved] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Effet pour récupérer les compteurs de tickets créés et résolus
     * lorsque la prop `year` change.
     */
    useEffect(() => {
        /**
         * Fonction asynchrone pour récupérer les données des compteurs via deux appels API distincts pour l'année donnée.
         */
        async function fetchData() {
            setLoading(true);
            setError(null);
            setCountTicketCreated(null);
            setCountTicketResolved(null);
            try {
                const createdResponse = await fetch(
                    `http://localhost:3001/tickets/count-created-by-year?year=${year}`
                );
                if (!createdResponse.ok) {
                    throw new Error("Erreur lors de la récupération des tickets créés");
                }
                const createdData = await createdResponse.json();
                setCountTicketCreated(createdData.count ?? 0);

                const resolvedResponse = await fetch(
                    `http://localhost:3001/tickets/count-resolved-by-year?year=${year}`
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
        if (year > 1900) {
            fetchData();
        } else {
            setError("Année invalide.");
            setLoading(false);
        }
    }, [year]);

    return (
        <div className={styles.container}>
            {loading ? (
                <p className={styles.chargement}>{t("Global.Chargement")}</p>
            ) : error ? (
                countTicketCreated === null && countTicketResolved === null ? <p className={styles.error}>{error}</p> : null
            ) : (
                <p className={styles.ticket}>{t("NbTicketAnnee.NbTicketsCreesAnnee")} :
                    <span className={styles.result}> {countTicketCreated ?? '-'}</span> </p>
            )}
            {loading ? (
                null
            ) : error ? (
                null
            ) : (
                <p className={styles.ticket}>{t("NbTicketAnnee.NbTicketsResolusAnnee")} :
                    <span className={styles.result}> {countTicketResolved ?? '-'}</span> </p>
            )}
            {!loading && error && (countTicketCreated !== null || countTicketResolved !== null) && (
                <p className={styles.error}>{error}</p>
            )}
        </div>
    );
}