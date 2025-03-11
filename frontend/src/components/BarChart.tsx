import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import axios from 'axios';

interface BarChartProps {
    date?: string;
    month?: number;
    year?: number;
    colors?: string;
    title: string;
}

interface OperatorData {
    operator: string;
    ticketCount: number;
}

const BarChart: React.FC<BarChartProps> = ({ date, month, year, colors, title }) => {
    const [chartData, setChartData] = useState<OperatorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Construire l'URL dynamiquement
    const apiUrl = date
        ? `http://localhost:3001/tickets/tickets-by-operator?date=${date}`
        : month
            ? `http://localhost:3001/tickets/tickets-by-operator-by-month-year?month=${month}&year=${year}`
            : `http://localhost:3001/tickets/tickets-by-operator-by-year?year=${year}`; // Ajout pour les données annuelles

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(apiUrl);
                setChartData(response.data);
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
        colors: colors || [
            "#FF4560", "#008FFB", "#00E396", "#FEB019", "#8E44AD", "#2C3E50",
            "#1ABC9C", "#F39C12", "#E74C3C", "#3498DB", "#2ECC71", "#F1C40F",
            "#9B59B6", "#34495E", "#16A085", "#D35400"
        ],
        plotOptions: { bar: { columnWidth: "45%", distributed: true } },
        dataLabels: { enabled: false },
        legend: { show: false },
        xaxis: {
            categories: chartData.map(item => item.operator),
            labels: { style: { fontSize: "12px" } }
        },
    };

    if (loading) return <p>Chargement du graphique...</p>;
    if (error) return <p>Erreur lors du chargement du graphique : {error.message}</p>;
    if (chartData.length === 0) return <p>Aucune donnée disponible.</p>;

    return (
        <div>
            <ReactApexChart options={chartOptions} series={[{ data: chartData.map(item => item.ticketCount) }]} type="bar" height={350} />
            <h2>{title}</h2>
        </div>
    );
};

export default BarChart;