import { useEffect, useState } from "react";

import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/TicketCountByMonth.module.scss';

interface TicketCountByMonthYearProps {
    month: number;
    year: number;
}

export default function TicketCountByMonthYear({ month, year }: TicketCountByMonthYearProps) {
    
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
                    `http://localhost:3001/tickets/count-created-by-month-year?month=${month}&year=${year}`
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
                    `http://localhost:3001/tickets/count-resolved-by-month-year?month=${month}&year=${year}`
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
    }, [month, year]);

    return (
        <div className={styles.container}>
            <h2 className={styles.ticket}>{t("Global.Details")} :</h2> 
            {loading ? (
                <p className={styles.chargement}>{t("Global.Chargement")}</p>
            ) : error ? (
                <p className={styles.error}>{error}</p>
            ) : (
                <p className={styles.ticket}>{t("NbTicketMois.NbTicketsCreesMois")} : 
                <span className={styles.result}> {countTicketCreated}</span> </p>
            )}
            {loading ? (
                <p className={styles.chargement}>{t("Global.Chargement")}</p>
            ) : error ? (
                <p className={styles.error}>{error}</p>
            ) : (
                <p className={styles.ticket}>{t("NbTicketMois.NbTicketsResolusMois")} : 
                <span className={styles.result}> {countTicketResolved}</span> </p>
            )}
        </div>
    );
}
