import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/MonthYearPickerStats.module.scss';

interface MonthPickerProps {
    initialMonth?: number;
    initialYear?: number;
}

// Add an export handle to expose the data
export interface MonthPickerStatsHandle {
    getTicketData: () => {
        countTicketCreated: number | null;
        resolutionRate: string | null;
    };
}

const MonthPickerStats = forwardRef<MonthPickerStatsHandle, MonthPickerProps>(
    ({ initialMonth, initialYear }, ref) => {
    
    const { t } = useTranslation();
    const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth || new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(initialYear || new Date().getFullYear());
    const [countTicketCreated, setCountTicketCreated] = useState<number | null>(null);
    const [countTicketResolved, setCountTicketResolved] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Calculate resolution rate
    const resolutionRate = countTicketCreated && countTicketCreated > 0
        ? ((countTicketResolved ?? 0) / countTicketCreated * 100).toFixed(2)
        : null;

    // Expose methods via ref
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
                    `http://localhost:3001/tickets/count-created-by-month-year?month=${selectedMonth}&year=${selectedYear}`
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
                    `http://localhost:3001/tickets/count-resolved-by-month-year?month=${selectedMonth}&year=${selectedYear}`
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
    }, [selectedMonth, selectedYear]);

    const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const month = parseInt(event.target.value, 10);
        setSelectedMonth(month);
        navigate(`/statistiques_mensuelles?month=${month}&year=${selectedYear}`);
    };

    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const year = parseInt(event.target.value, 10);
        setSelectedYear(year);
        navigate(`/statistiques_mensuelles?month=${selectedMonth}&year=${year}`);
    };

    const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - 7 + i);

    return (
        <div className={styles.container}>
            <p>Veuillez choisir le mois et l'année pour la récupération des données <span>Clarilog</span> :</p>
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
                            <span className={styles.result}> {countTicketCreated}</span>
                        </p>
                        {resolutionRate !== null && (
                        <p className={styles.ticket}>Taux de résolution des tickets incidents :
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