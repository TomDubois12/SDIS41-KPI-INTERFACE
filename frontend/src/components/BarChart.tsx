import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import axios from 'axios';

import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/BarChart.module.scss';

interface BarChartProps {
    date?: string;
    month?: number;
    year?: number;
    colors?: string | string[];
    title: string;
}

interface OperatorData {
    operator: string;
    ticketCount: number;
}

const BarChart: React.FC<BarChartProps> = ({ date, month, year, colors, title }) => {
    
    const [chartData, setChartData] = useState<OperatorData[]>([]); // Initialize as empty array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { t } = useTranslation();
    colors = [
        "#FF4560", "#008FFB", "#00E396", "#FEB019", "#8E44AD", "#2C3E50",
        "#1ABC9C", "#F39C12", "#E74C3C", "#3498DB", "#2ECC71", "#F1C40F",
        "#9B59B6", "#34495E", "#16A085", "#D35400"
    ]
    
    // Construire l'URL dynamiquement
    const apiUrl = date
        ? `http://localhost:3001/tickets/tickets-by-operator?date=${date}`
        : month
            ? `http://localhost:3001/tickets/tickets-by-operator-by-month-year?month=${month}&year=${year}`
            : `http://localhost:3001/tickets/tickets-by-operator-by-year?year=${year}`; // Ajout pour les données annuelles

    const formatOperatorName = (operatorName: string): string => {
        if (!operatorName) {
            return '';
        }

        const parts = operatorName.split('\\');

        if (parts.length === 2) {
            let namePart = parts[1];
            if (namePart.includes('.') || namePart.includes('-')) {
                namePart = namePart.replace(/\./g, ' ').replace(/-/g, ' ');
            }

            const capitalize = (str: string): string => {
                return str.replace(/\b\w/g, (char) => char.toUpperCase());
            };

            return capitalize(namePart);
        }

        return operatorName;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get<OperatorData[]>(apiUrl);
                const formattedData = response.data.map((item: OperatorData) => ({
                    ...item,
                    operator: formatOperatorName(item.operator),
                }));
                setChartData(formattedData);
            } catch (error) {
                console.error("Erreur lors de la récupération des données du graphique :", error);
                setError(error as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 5000);
        return () => clearInterval(intervalId);
    }, [date, month, year]);

    const chartOptions = {
        chart: { height: 350, type: "bar" as const },
        colors: Array.isArray(colors) ? colors : [colors],
        plotOptions: { bar: { columnWidth: "45%", distributed: true } },
        dataLabels: { enabled: false },
        legend: { show: false },
        xaxis: {
            categories: chartData.map(item => item.operator),
            labels: { style: { fontSize: "12px" } }
        },
        tooltip: {
            enabled: true,
            fixed: { enabled: true, position: "topRight" },
        }
    };
    
    

    if (loading) return <p className={styles.title}>{t("Charts.Chargement")}</p>;
    if (error) return <p className={styles.title}>{t("Charts.Erreur")} : {error.message}</p>;
    if (chartData.length === 0) return <p className={styles.title}>{t("Charts.PasDeDonneesBarChart")}.</p>;

    return (
        <div>
            <h2 className={styles.title}>{title}</h2>
            <ReactApexChart options={chartOptions} series={[{ data: chartData.map(item => item.ticketCount) }]} type="bar" width="90%" height="auto" />
        </div>
    );
};

export default BarChart;
