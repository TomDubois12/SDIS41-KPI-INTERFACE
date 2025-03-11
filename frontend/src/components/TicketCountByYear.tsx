import { useEffect, useState } from "react";
import { useTranslation } from "../hooks/useTranslation";

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
        <div>
            {loading ? (
                <p>Loading</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <p>{}Nombre total de ticket créés cette année : {countTicketCreated}</p>
            )}
            {loading ? (
                <p>Loading</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <p>{}Nombre total de ticket résolus cette année : {countTicketResolved}</p>
            )}
        </div>
    );
}
