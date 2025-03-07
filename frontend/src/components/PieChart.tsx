import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import axios from 'axios';

interface PieChartProps {
    date: string;
    colors?: string;
    title: string;
}

interface DataItem {
    label: string;
    value: number;
}

interface ApiDataItem {
    TicketClassLabel: string | null;
    NombreTickets: number;
}

const PieChart: React.FC<PieChartProps> = ({ date, colors, title }) => {
    const [chartData, setChartData] = useState<DataItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const apiUrl = "http://localhost:3001/tickets/tickets-types";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get<ApiDataItem[]>(apiUrl + `?date=${date}`);
                // Transformation des données de l'API vers le format attendu
                const transformedData = response.data.map(item => ({
                    label: item.TicketClassLabel || "Inconnu",
                    value: item.NombreTickets
                }));
                setChartData(transformedData);
            } catch (error) {
                console.error("Erreur lors de la récupération des données du graphique :", error);
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 5000);
        return () => clearInterval(intervalId);
    }, [date, apiUrl]);

    const state = {
        series: chartData.map(item => item.value),
        options: {
            chart: {
                width: 380,
                type: 'pie',
            },
            labels: chartData.map(item => item.label),
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }],
            colors: colors
        },
    };

    if (loading) {
        return <p>Chargement du graphique...</p>;
    }

    if (error) {
        return <p>Erreur lors du chargement du graphique : {error.message}</p>;
    }

    return (
        <div id="chart">
            <ReactApexChart options={state.options} series={state.series} type="pie" width={380} />
            <h2>{title}</h2>
        </div>
    );
};

export default PieChart;