import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

interface Ticket {
    TicketId: number;
    Title: string;
    CallerName: string;
    HeureDeCréation: string;
    ResolutionDate: string | null;
}

const TicketCount: React.FC = () => {
    const [NbTicketCreated, setNbTicketCreated] = useState<number | null>(null);
    const [NbTicketResolved, setNbTicketResolved] = useState<number | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]); // Correction ici
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const selectedDate = searchParams.get('date');
    const navigate = useNavigate();

    const formattedDate = selectedDate
        ? new Date(selectedDate).toLocaleDateString('fr-FR')
        : 'Aucune';

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

    const fetchInitialData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [NbTicketCreated, NbTicketResolved, ticketsResponse] = await Promise.allSettled([
                axios.get<{ count: number }>(`http://localhost:3001/tickets/count-created?date=${selectedDate}`),
                axios.get<{ count: number }>(`http://localhost:3001/tickets/count-resolved?date=${selectedDate}`),
                axios.get<Ticket[]>(`http://localhost:3001/tickets/tickets?date=${selectedDate}`), // Correction ici
            ]);

            if (NbTicketCreated.status === 'fulfilled') setNbTicketCreated(NbTicketCreated.value.data.count || 0);
            if (NbTicketResolved.status === 'fulfilled') setNbTicketResolved(NbTicketResolved.value.data.count || 0);
            if (ticketsResponse.status === 'fulfilled') {
                const fetchedTickets = ticketsResponse.value.data || [];
                const formattedTickets = fetchedTickets.map(ticket => ({
                    ...ticket,
                    CallerName: formatOperatorName(ticket.CallerName),
                }));
                setTickets(formattedTickets);
            }

            setLoading(false);
        } catch (err) {
            setError('Erreur lors de la récupération des données');
            console.error('Erreur complète : ', err);
            setLoading(false);
        }
    }, [selectedDate]);

    const fetchLiveUpdates = useCallback(async () => {
        try {
            const [NbTicketCreated, NbTicketResolved, ticketsResponse] = await Promise.allSettled([
                axios.get<{ count: number }>(`http://localhost:3001/tickets/count-created?date=${selectedDate}`),
                axios.get<{ count: number }>(`http://localhost:3001/tickets/count-resolved?date=${selectedDate}`),
                axios.get<Ticket[]>(`http://localhost:3001/tickets/tickets?date=${selectedDate}`), // Correction ici
            ]);

            if (NbTicketCreated.status === 'fulfilled') setNbTicketCreated(NbTicketCreated.value.data.count || 0);
            if (NbTicketResolved.status === 'fulfilled') setNbTicketResolved(NbTicketResolved.value.data.count || 0);
            if (ticketsResponse.status === 'fulfilled') {
                const fetchedTickets = ticketsResponse.value.data || [];
                const formattedTickets = fetchedTickets.map(ticket => ({
                    ...ticket,
                    CallerName: formatOperatorName(ticket.CallerName),
                }));
                setTickets(formattedTickets);
            }
        } catch (err) {
            console.error('Erreur lors du rafraîchissement des données :', err);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchInitialData();
        const intervalId = setInterval(fetchLiveUpdates, 10000);

        return () => clearInterval(intervalId);
    }, [fetchInitialData, fetchLiveUpdates]);

    if (loading) return <p>Chargement...</p>;
    if (error) return <p>{error}</p>;

    const handleTicketClick = (ticketId: number) => {
        navigate(`/clarilog_detail?id=${ticketId}`);
    };

    const getRowStyle = (resolutionDate: string | null): React.CSSProperties => {
        return {
            cursor: 'pointer',
            backgroundColor: resolutionDate ? 'lightblue' : 'lightcoral',
        };
    };

    return (
        <div>
            <h2>Date : {formattedDate}</h2>
            <h2>Nombre de nouveaux tickets créés dans la journée : {NbTicketCreated}</h2>
            <h2>Nombre de tickets résolus dans la journée : {NbTicketResolved}</h2>
            <h2>Tableau des tickets créés dans la journée</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID du ticket</th>
                        <th>Titre de la demande</th>
                        <th>Demandeur</th>
                        <th>Heure</th>
                    </tr>
                </thead>
                <tbody>
                    {tickets.map(({ TicketId, Title, CallerName, HeureDeCréation, ResolutionDate }) => (
                        <tr
                            key={TicketId}
                            onClick={() => handleTicketClick(TicketId)}
                            style={getRowStyle(ResolutionDate)}
                        >
                            <td>{TicketId}</td>
                            <td>{Title}</td>
                            <td>{CallerName}</td>
                            <td>{HeureDeCréation}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TicketCount;