import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import axios from 'axios';

interface BarChartProps {
    date: string;
    colors?: string;
    title: string;
}

interface OperatorData {
    operator: string;
    ticketCount: number;
}

const BarChart: React.FC<BarChartProps> = ({ date, colors, title }) => {
    const [chartData, setChartData] = useState<OperatorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const apiUrl = "http://localhost:3001/tickets/tickets-by-operator"; 

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(apiUrl + `?date=${date}`);
                setChartData(response.data);
            } catch (error) {
                console.error("Erreur lors de la récupération des données du graphique :", error);
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData(); // Appel initial

        const intervalId = setInterval(fetchData, 10000); // Actualisation toutes les 5 secondes

        return () => clearInterval(intervalId); // Nettoyage de l'intervalle
    }, [date, apiUrl]);

    const chartOptions = {
        chart: {
            height: 350,
            type: "bar" as const,
            events: {
                click: function (chart: any, w: any, e: any) {
                    console.log("Chart clicked", chart, w, e);
                },
            },
        },
        colors: colors || [
            "#FF4560", // Rouge
            "#008FFB", // Bleu
            "#00E396", // Vert
            "#FEB019", // Jaune
            "#8E44AD", // Violet
            "#2C3E50", // Gris foncé
            "#1ABC9C", // Turquoise
            "#F39C12", // Orange
            "#E74C3C", // Rouge plus clair
            "#3498DB", // Bleu plus clair
            "#2ECC71", // Vert plus clair
            "#F1C40F", // Jaune plus clair
            "#9B59B6", // Violet plus clair
            "#34495E", // Gris bleuâtre
            "#16A085", // Vert émeraude
            "#D35400"  // Orange foncé
        ],
        plotOptions: {
            bar: {
                columnWidth: "45%",
                distributed: true,
            },
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            show: false,
        },
        xaxis: {
            categories: chartData.map(item => item.operator),
            labels: {
                style: {
                    colors: colors || [
                        "#FF4560", // Rouge
                        "#008FFB", // Bleu
                        "#00E396", // Vert
                        "#FEB019", // Jaune
                        "#8E44AD", // Violet
                        "#2C3E50", // Gris foncé
                        "#1ABC9C", // Turquoise
                        "#F39C12", // Orange
                        "#E74C3C", // Rouge plus clair
                        "#3498DB", // Bleu plus clair
                        "#2ECC71", // Vert plus clair
                        "#F1C40F", // Jaune plus clair
                        "#9B59B6", // Violet plus clair
                        "#34495E", // Gris bleuâtre
                        "#16A085", // Vert émeraude
                        "#D35400"  // Orange foncé
                    ],
                    fontSize: "12px",
                },
            },
        },
    };

    if (loading) {
        return <p>Chargement du graphique...</p>;
    }

    if (error) {
        return <p>Erreur lors du chargement du graphique : {error.message}</p>;
    }

    return (
        <div>
            <ReactApexChart options={chartOptions} series={[{ data: chartData.map(item => item.ticketCount) }]} type="bar" height={350}/>
            <h2>{title}</h2>
        </div>
    );
};

export default BarChart;