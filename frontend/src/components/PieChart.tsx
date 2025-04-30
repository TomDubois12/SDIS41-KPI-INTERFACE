import axios from 'axios';
import ReactApexChart from "react-apexcharts";

import React, { useState, useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/PieChart.module.scss';

/**
 * Définit les propriétés acceptées par le composant PieChart.
 * @property date? Date spécifique pour filtrer les données (format YYYY-MM-DD).
 * @property month? Mois spécifique pour filtrer les données (1-12). Nécessite `year`.
 * @property year? Année spécifique pour filtrer les données. Requis si `month` est fourni ou seul.
 * @property colors? Chaîne de couleurs personnalisées séparées par des virgules.
 * @property title Titre à afficher au-dessus du graphique.
 */
interface PieChartProps {
    date?: string;
    month?: number;
    year?: number;
    colors?: string;
    title: string;
}

/**
 * Structure interne des données après transformation, utilisée pour le graphique.
 * @property TicketClassLabel Libellé de la catégorie/type de ticket.
 * @property count Nombre de tickets dans cette catégorie.
 * @property percentage? Pourcentage calculé que représente cette catégorie. Optionnel.
 */
interface DataItem {
    TicketClassLabel: string;
    count: number;
    percentage?: number;
}

/**
 * Structure des données attendue de l'API pour chaque type de ticket.
 * @property TicketClassLabel Libellé de la catégorie (peut être null).
 * @property NombreTickets Nombre de tickets pour cette catégorie.
 */
interface ApiDataItem {
    TicketClassLabel: string | null;
    NombreTickets: number;
}

/**
 * Composant React affichant un graphique en secteurs (Pie Chart) représentant
 * la distribution des tickets par type/catégorie pour une période donnée (jour, mois, année).
 * Récupère les données depuis l'API, calcule les pourcentages, trie les données,
 * rafraîchit périodiquement, et gère les états de chargement/erreur.
 * Utilise ReactApexCharts pour le rendu.
 *
 * @param props Les propriétés du composant, voir `PieChartProps`.
 * @returns Le composant JSX affichant le graphique ou un état alternatif.
 */
const PieChart: React.FC<PieChartProps> = ({ date, month, year, colors, title }) => {
    const [chartData, setChartData] = useState<DataItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { t } = useTranslation();

    const apiUrl = date
        ? `http://localhost:3001/tickets/tickets-types?date=${date}`
        : month
            ? `http://localhost:3001/tickets/tickets-types-by-month-year?month=${month}&year=${year}`
            : `http://localhost:3001/tickets/tickets-types-by-year?year=${year}`;

    useEffect(() => {
        /**
         * Fonction asynchrone pour récupérer et traiter les données pour le graphique.
         * Gère les libellés null, calcule les pourcentages et trie les segments.
         */
        const fetchData = async () => {
            setError(null);
            try {
                const response = await axios.get<ApiDataItem[]>(apiUrl);
                let transformedData = response.data.map(item => ({
                    TicketClassLabel: item.TicketClassLabel || "Pas de catégorie attribuée",
                    count: item.NombreTickets
                }));
                const totalTickets = transformedData.reduce((sum, item) => sum + item.count, 0);
                transformedData = transformedData
                    .map(item => ({
                        ...item,
                        percentage: totalTickets > 0 ? (item.count / totalTickets) * 100 : 0
                    }))
                    .sort((a, b) => b.percentage! - a.percentage!);

                setChartData(transformedData);
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
    }, [date, month, year, apiUrl]);

    const state = {
        series: chartData.map(item => item.count),
        options: {
            chart: { width: 900, type: 'pie' as const },
            labels: chartData.map(item => `${item.TicketClassLabel}: ${item.percentage!.toFixed(1)}%`),
            responsive: [{
                breakpoint: 960,
                options: {
                    chart: {
                        width: '100%',
                        height: 'auto'
                    },
                    legend: {
                        position: 'bottom',
                    }
                }
            }],
            colors: colors ? colors.split(',') : undefined
        },
    };

    if (loading) return <p className={styles.title}>{t("Charts.Chargement")}</p>;
    if (error) return <p className={styles.title}>{t("Charts.Erreur")} : {error.message}</p>;
    if (state.series.length === 0 || state.series.every(s => s === 0)) return <p className={styles.title}>{t("Charts.PasDeDonneesPieChart")}.</p>;

    return (
        <div id="chart">
            <h2 className={styles.title}>{title}</h2>
            <ReactApexChart options={state.options} series={state.series} type="pie" width="100%" height="auto" />
        </div>
    );
};
export default PieChart;