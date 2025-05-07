import axios from 'axios';
import ReactApexChart from "react-apexcharts";

import React, { useState, useEffect } from "react";
import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/BarChart.module.scss';

/**
 * Définit les propriétés acceptées par le composant BarChart.
 * @property date? Date spécifique pour filtrer les données (format YYYY-MM-DD).
 * @property month? Mois spécifique pour filtrer les données (1-12). Nécessite `year`.
 * @property year? Année spécifique pour filtrer les données. Requis si `month` est fourni.
 * @property colors? Couleurs personnalisées pour le graphique (chaîne ou tableau de chaînes).
 * @property title Titre à afficher au-dessus du graphique.
 */
interface BarChartProps {
    date?: string;
    month?: number;
    year?: number;
    colors?: string | string[];
    title: string;
}

/**
 * Définit la structure attendue pour chaque élément de données d'opérateur
 * retourné par l'API et utilisé par le graphique.
 * @property operator Nom de l'opérateur.
 * @property ticketCount Nombre de tickets associés à cet opérateur.
 */
interface OperatorData {
    operator: string;
    ticketCount: number;
}

/**
 * Composant React affichant un graphique en barres (Bar Chart) représentant
 * le nombre de tickets par opérateur pour une période donnée (jour, mois, année).
 * Récupère les données depuis une API, les rafraîchit périodiquement,
 * gère les états de chargement et d'erreur, et formate les noms d'opérateurs.
 * Utilise la librairie ReactApexCharts pour le rendu du graphique.
 *
 * @param props Les propriétés du composant, voir `BarChartProps`.
 * @returns Le composant JSX affichant le graphique ou un état (chargement, erreur, pas de données).
 */
const BarChart: React.FC<BarChartProps> = ({ date, month, year, colors, title }) => {

    const [chartData, setChartData] = useState<OperatorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { t } = useTranslation();
    colors = [
        "#FF4560", "#008FFB", "#00E396", "#FEB019", "#8E44AD", "#2C3E50",
        "#1ABC9C", "#F39C12", "#E74C3C", "#3498DB", "#2ECC71", "#F1C40F",
        "#9B59B6", "#34495E", "#16A085", "#D35400"
    ];

    const apiUrl = date
        ? `/tickets/tickets-by-operator?date=${date}`
        : month
            ? `/tickets/tickets-by-operator-by-month-year?month=${month}&year=${year}`
            : `/tickets/tickets-by-operator-by-year?year=${year}`;

    /**
     * Formate un nom d'opérateur potentiellement brut (ex: "DOMAINE\prenom.nom")
     * en un format plus lisible (ex: "Prenom Nom").
     * Extrait la partie nom, remplace les points/tirets par des espaces et met en majuscule.
     * @param operatorName Le nom d'opérateur brut à formater.
     * @returns Le nom formaté, ou une chaîne vide si l'entrée est invalide.
     */
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
        /**
         * Fonction asynchrone pour récupérer et traiter les données du graphique depuis l'API.
         * Gère les états de chargement et d'erreur.
         */
        const fetchData = async () => {
            setError(null);
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