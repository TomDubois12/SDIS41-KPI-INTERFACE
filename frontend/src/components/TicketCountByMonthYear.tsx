import { useEffect, useState } from "react";
import { useTranslation } from "../hooks/useTranslation";

interface TicketCountByMonthYearProps {
    month: number;
    year: number;
}

export default function TicketCountByMonthYear({ month, year }: TicketCountByMonthYearProps) {
    const { t } = useTranslation();
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `http://localhost:3001/tickets/count-by-month-year?month=${month}&year=${year}`
                );
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des données");
                }
                const data = await response.json();
                setCount(data.count);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Une erreur est survenue");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [month, year]);

    return (
        <div>
            {/* <h2>{t("Charts.TicketsCreatedByMonth")}</h2>
            {loading ? (
                <p>{t("Loading")}</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <p>{t("Tickets.Created")}: {count}</p>
            )} */}
            {loading ? (
                <p>Loading</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <p>{}Nombre total de ticket créés ce mois-ci : {count}</p>
            )}
        </div>
    );
}
