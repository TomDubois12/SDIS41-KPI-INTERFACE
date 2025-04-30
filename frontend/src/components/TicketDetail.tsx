import axios from 'axios';

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";

import Button from "../components/Button";

import styles from '../styles/components/TicketDetail.module.scss';

interface TicketDetail {
    TicketId: number;
    CallerName: string;
    SentOn: string;
    Title: string;
    TicketStatus: string;
    Category: string;
    AssignedToId: number;
    AssignedToName: string | null;
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
    const { t } = useTranslation();

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
                    let formattedAssignedToName = response.data.AssignedToName;
                    if (formattedAssignedToName) {
                        formattedAssignedToName = formatOperatorName(formattedAssignedToName);
                    }
                    setTicket({
                        ...response.data,
                        CallerName: formatOperatorName(response.data.CallerName),
                        AssignedToName: formattedAssignedToName,
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

    const handleGoBack = () => {
        window.history.back();
    };

    if (loading) return <p>{t("TicketDetail.ChargementDetail")}</p>;
    if (error) return <p>{error}</p>;
    if (!ticket) return <p>{t("TicketDetail.TicketNonTrouve")}</p>;

    return (
        <div className={styles.container}>
            <h2>{t("TicketDetail.DetailTitle")} n° <span className={styles.important}>{ticket.TicketId}</span> : </h2>
            <p>{t("TicketDetail.Titre")} : <span className={styles.important}>{ticket.Title || t("TicketCount.Erreur.Titre")}</span></p>
            <p>{t("TicketDetail.Demandeur")} : <span className={styles.important}>{ticket.CallerName || t("TicketCount.Erreur.Demandeur")}</span></p>
            <p>{t("TicketDetail.DateCreation")} : <span className={styles.important}>{new Date(ticket.SentOn).toLocaleDateString('fr-FR')}</span></p>
            <p>
                {t("TicketDetail.Statut")} : <span className={ticket.TicketStatus === "En cours"
                    ? styles.inProgress
                    : ["Résolu", "Clôturé"].includes(ticket.TicketStatus)
                        ? styles.resolved
                        : styles.defaultStatus}> {ticket.TicketStatus}</span>
            </p>
            <p>{t("TicketDetail.Categorie")} : <span className={styles.important}>{ticket.Category || t("TicketDetail.CategoriePasAttrib")}</span></p>
            <p>{t("TicketDetail.AssigneA")} : <span
                className={
                    ticket.AssignedToName
                        ? styles.resolved
                        : ticket.AssignedToId
                            ? styles.defaultStatus
                            : styles.important
                }
            >
                {ticket.AssignedToName
                    ? ticket.AssignedToName
                    : ticket.AssignedToId || t("TicketDetail.NonAssigne")
                }
            </span>
            </p>
            <p>
                {t("TicketDetail.DateReso")} : <span className={ticket.ResolutionDate ? styles.resolved : styles.important}>
                    {ticket.ResolutionDate
                        ? new Date(ticket.ResolutionDate).toLocaleDateString('fr-FR')
                        : t("TicketDetail.NonReso")
                    }
                </span>
            </p>
            <p className={styles.description}>{t("TicketDetail.Description")} : <span>{ticket.DescriptionText || t("TicketDetail.PasDeDescription")}</span></p>
            {ticket.ResolutionDate && (
                <p>{t("TicketDetail.TempsReso")} : <span className={styles.resolved}>{ticket.resolutionTime.Minutes} {t("TicketDetail.TempsReso2")} {ticket.resolutionTime.Secondes} {t("TicketDetail.TempsReso3")}</span></p>
            )}
            <Button
                backgroundColor={"#2B3244"}
                text={t("TicketDetail.Retour")}
                textColor={"white"}
                onClick={handleGoBack}
            />
        </div>
    );
};
export default ClarilogTicketDetail;