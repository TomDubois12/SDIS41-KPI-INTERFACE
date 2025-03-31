import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/MonthYearPickerStats.module.scss';

interface YearPickerProps {
    initialYear?: number;
}

export interface YearPickerStatsHandle {
    getTicketData: () => {
        countTicketCreated: number | null;
        resolutionRate: string | null;
    };
}

const MonthPickerStats = forwardRef<YearPickerStatsHandle, YearPickerProps>(
    ({ initialYear }, ref) => {

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

        useImperativeHandle(ref, () => ({
            getTicketData: () => ({
                countTicketCreated,
                resolutionRate
            })
        }));

        useEffect(() => {
            async function fetchData() {
                setLoading(true);
                setError(null);
                try {
                    const response = await fetch(
                        `http://localhost:3001/tickets/count-created-by-year?year=${selectedYear}`
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
                        `http://localhost:3001/tickets/count-resolved-by-year?}&year=${selectedYear}`
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
        }, [selectedYear]);

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
                        <p className={styles.error}>{error}</p>
                    ) : (
                        <>
                            <p className={styles.ticket}>{t("NbTicketAnnee.NbTicketsCreesAnnee")} :
                                <span className={styles.result}> {countTicketCreated}</span>
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
