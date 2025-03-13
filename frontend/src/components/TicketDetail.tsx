import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate

interface TicketDetail {
    TicketId: number;
    CallerName: string;
    SentOn: string;
    Title: string;
    TicketStatus: string;
    Category: string;
    AssignedToId: number;
    ResolutionDate: string | null;
    DescriptionText: string;
    resolutionTime: {
        Minutes: number;
        Secondes: number;
    };
}

const ClarilogTicketDetail: React.FC = () => {
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const ticketId = searchParams.get('id');
    const navigate = useNavigate(); // Initialize useNavigate

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
        const fetchTicketDetails = async () => {
            if (!ticketId) {
                setError('ID de ticket manquant.');
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await axios.get<TicketDetail>(`http://localhost:3001/tickets/ticket/${ticketId}`);
                if (response.data) {
                    setTicket({
                        ...response.data,
                        CallerName: formatOperatorName(response.data.CallerName),
                    });
                } else {
                    setError('Ticket non trouvé.');
                }
            } catch (err) {
                setError('Erreur lors de la récupération des détails du ticket.');
                console.error('Erreur : ', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTicketDetails();
    }, [ticketId]);

    if (loading) return <p>Chargement des détails du ticket...</p>;
    if (error) return <p>{error}</p>;
    if (!ticket) return <p>Ticket non trouvé.</p>;

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div>
            <h2>Détails du Ticket {ticket.TicketId}</h2>
            <button onClick={handleGoBack}>Retour</button>
            <p><strong>Titre :</strong> {ticket.Title}</p>
            <p><strong>Demandeur :</strong> {ticket.CallerName}</p>
            <p><strong>Date de création :</strong> {new Date(ticket.SentOn).toLocaleDateString('fr-FR')}</p>
            <p><strong>Statut :</strong> {ticket.TicketStatus}</p>
            <p><strong>Catégorie :</strong> {ticket.Category || "Pas de catégorie attribuée"}</p>
            <p><strong>Assigné à (ID) :</strong> {ticket.AssignedToId || "Non attribué"}</p>
            <p><strong>Date de résolution :</strong> {ticket.ResolutionDate ? new Date(ticket.ResolutionDate).toLocaleDateString('fr-FR') : 'Non résolu'}</p>
            <p><strong>Description :</strong> {ticket.DescriptionText || "Pas de description"}</p>
            {ticket.ResolutionDate && (
                <p>
                    <strong>Temps de résolution :</strong> {ticket.resolutionTime.Minutes} minutes et {ticket.resolutionTime.Secondes} secondes
                </p>
            )}
        </div>
    );
};

export default ClarilogTicketDetail;