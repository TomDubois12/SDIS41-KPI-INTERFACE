import { useEffect, useState } from "react";

import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/TicketCountByYear.module.scss';

interface TicketCountByYearProps {
    year: number;
}

export default function TicketCountByYear({ year }: TicketCountByYearProps) {
    
    const { t } = useTranslation();
    const [countTicketCreated, setCountTicketCreated] = useState<number | null>(null);
    const [countTicketResolved, setCountTicketResolved] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `http://localhost:3001/tickets/count-created-by-year?year=${year}`
                );
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des données");
                }
                const data = await response.json();
                setCountTicketCreated(data.count);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Une erreur est survenue");
            } finally {
                setLoading(false);
            }

            try {
                const response = await fetch(
                    `http://localhost:3001/tickets/count-resolved-by-year?year=${year}`
                );
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des données");
                }
                const data = await response.json();
                setCountTicketResolved(data.count);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Une erreur est survenue");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [year]);

    return (
        <div className={styles.container}>
            {loading ? (
                <p className={styles.chargement}>{t("Global.Chargement")}</p>
            ) : error ? (
                <p className={styles.error}>{error}</p>
            ) : (
                <p className={styles.ticket}>{t("NbTicketAnnee.NbTicketsCreesAnnee")} : 
                <span className={styles.result}> {countTicketCreated}</span> </p>
            )}
            {loading ? (
                <p className={styles.chargement}>{t("Global.Chargement")}</p>
            ) : error ? (
                <p className={styles.error}>{error}</p>
            ) : (
                <p className={styles.ticket}>{t("NbTicketAnnee.NbTicketsResolusAnnee")} : 
                <span className={styles.result}> {countTicketResolved}</span> </p>
            )}
        </div>
    );
}
