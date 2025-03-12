import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import axios from 'axios';

interface PieChartProps {
    date?: string;
    month?: number;
    year?: number;
    colors?: string;
    title: string;
}

interface DataItem {
    TicketClassLabel: string;
    count: number;
    percentage?: number;
}

interface ApiDataItem {
    TicketClassLabel: string | null;
    NombreTickets: number;
}

const PieChart: React.FC<PieChartProps> = ({ date, month, year, colors, title }) => {
    const [chartData, setChartData] = useState<DataItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Construire l'URL dynamiquement
    const apiUrl = date
        ? `http://localhost:3001/tickets/tickets-types?date=${date}`
        : month
            ? `http://localhost:3001/tickets/tickets-types-by-month-year?month=${month}&year=${year}`
            : `http://localhost:3001/tickets/tickets-types-by-year?year=${year}`;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get<ApiDataItem[]>(apiUrl);
                
                // Transformer les données
                let transformedData = response.data.map(item => ({
                    TicketClassLabel: item.TicketClassLabel || "Inconnu",
                    count: item.NombreTickets
                }));
                
                // Calcul du total des tickets
                const totalTickets = transformedData.reduce((sum, item) => sum + item.count, 0);
                
                // Ajout du pourcentage et tri par ordre décroissant
                transformedData = transformedData
                    .map(item => ({
                        ...item,
                        percentage: (item.count / totalTickets) * 100
                    }))
                    .sort((a, b) => b.percentage! - a.percentage!); // Tri du plus grand au plus petit

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
    }, [date, month, year]);

    const state = {
        series: chartData.map(item => item.count),
        options: {
            chart: { width: 900, type: 'pie' },
            labels: chartData.map(item => `${item.TicketClassLabel}: ${item.percentage!.toFixed(1)}%`),
            responsive: [{
                breakpoint: 960,
                options: {
                    legend: {
                        position: 'bottom',
                        width: 500
                    }
                }
            }],
            colors: colors ? colors.split(',') : undefined
        },
    };

    if (loading) return <p>Chargement du graphique...</p>;
    if (error) return <p>Erreur lors du chargement du graphique : {error.message}</p>;
    if (state.series.length === 0) return <p>Aucune donnée disponible.</p>;

    return (
        <div id="chart">
            <ReactApexChart options={state.options} series={state.series} type="pie" width={650} />
            <h2>{title}</h2>
        </div>
    );
};

export default PieChart;
