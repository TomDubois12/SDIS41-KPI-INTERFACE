import { useEffect, useState } from "react";
import { useTranslation } from "../hooks/useTranslation";

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
        <div>
            {loading ? (
                <p>Loading</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <p>{}Nombre total de ticket créés ce mois-ci : {countTicketCreated}</p>
            )}
            {loading ? (
                <p>Loading</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <p>{}Nombre total de ticket résolus ce mois-ci : {countTicketResolved}</p>
            )}
        </div>
    );
}
