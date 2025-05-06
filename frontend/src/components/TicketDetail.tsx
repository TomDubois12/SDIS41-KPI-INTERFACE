import axios from 'axios';

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from "../hooks/useTranslation";

import Button from "../components/Button";

import styles from '../styles/components/TicketDetail.module.scss';

/**
 * Définit la structure détaillée des données d'un ticket, telle que retournée par l'API
 * et utilisée par le composant ClarilogTicketDetail.
 * @property TicketId Identifiant numérique unique du ticket.
 * @property CallerName Nom formaté du demandeur.
 * @property SentOn Date et heure de création du ticket (chaîne ISO ou similaire).
 * @property Title Titre ou sujet du ticket.
 * @property TicketStatus Statut actuel du ticket (ex: 'En cours', 'Résolu').
 * @property Category Catégorie ou type du ticket.
 * @property AssignedToId ID de l'opérateur assigné (peut être un nombre ou null/undefined).
 * @property AssignedToName Nom formaté de l'opérateur assigné (peut être null).
 * @property ResolutionDate Date de résolution (chaîne ISO ou null si non résolu).
 * @property DescriptionText Texte de la description du ticket.
 * @property resolutionTime Objet contenant le temps de résolution calculé en minutes et secondes.
 */
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

/**
 * Composant React affichant les détails complets d'un ticket Clarilog spécifique.
 * L'ID du ticket est récupéré depuis le paramètre 'id' de l'URL (`?id=...`).
 * Récupère les informations détaillées via un appel API, formate certains noms,
 * et affiche les données dans une mise en page structurée avec des styles conditionnels.
 * Gère les états de chargement et d'erreur. Le bouton "Retour" a un comportement adaptatif.
 *
 * @returns Le composant JSX affichant les détails du ticket ou un état alternatif.
 */
const ClarilogTicketDetail: React.FC = () => {
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const ticketId = searchParams.get('id');
    const { t } = useTranslation();
    const navigate = useNavigate();

    /**
     * Formate un nom d'opérateur/demandeur potentiellement brut (ex: "DOMAINE\prenom.nom")
     * en un format plus lisible (ex: "Prenom Nom").
     * @param operatorName Le nom brut à formater.
     * @returns Le nom formaté ou une chaîne vide.
     */
    const formatOperatorName = (operatorName: string | null): string => {
        if (!operatorName) {
            if (operatorName === 'Envoyé depuis un mail') return operatorName;
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

    /**
     * Effet pour récupérer les détails du ticket depuis l'API lorsque
     * l'ID du ticket (extrait de l'URL) change.
     */
    useEffect(() => {
        /**
         * Fonction asynchrone interne pour effectuer l'appel API et mettre à jour l'état.
         */
        const fetchTicketDetails = async () => {
            if (!ticketId) {
                setError('ID de ticket manquant dans l\'URL.');
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            setTicket(null);
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
                    setError('Ticket non trouvé (réponse vide).');
                }
            } catch (err: any) {
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                    setError(t("TicketDetail.TicketNonTrouve"));
                } else {
                    console.error('Erreur fetchTicketDetails: ', err);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTicketDetails();
    }, [ticketId, t]);

    /**
     * Gère le clic sur le bouton de retour.
     * Si une page précédente existe dans l'historique de session du navigateur
     * (longueur de l'historique > 1), effectue un retour en arrière standard (`history.back()`).
     * Sinon (ex: page ouverte dans un nouvel onglet via notification ou lien direct),
     * redirige vers la vue mensuelle par défaut (`/clarilog_mensuel` pour le mois et l'année courants).
     */
    const handleGoBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();
            navigate(`/clarilog_mensuel?month=${month}&year=${year}`);
        }
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
                {t("TicketDetail.Statut")} : <span className={
                    ticket.TicketStatus === "En cours"
                        ? styles.inProgress
                        : ["Résolu", "Clôturé"].includes(ticket.TicketStatus)
                            ? styles.resolved
                            : styles.defaultStatus
                }> {ticket.TicketStatus || '-'}</span>
            </p>
            <p>{t("TicketDetail.Categorie")} : <span className={styles.important}>{ticket.Category || t("TicketDetail.CategoriePasAttrib")}</span></p>
            <p>{t("TicketDetail.AssigneA")} : <span
                className={
                    ticket.AssignedToName ? styles.resolved : ticket.AssignedToId ? styles.defaultStatus : styles.important
                }
            >
                {ticket.AssignedToName ? ticket.AssignedToName : ticket.AssignedToId || t("TicketDetail.NonAssigne")}
            </span>
            </p>
            <p>
                {t("TicketDetail.DateReso")} : <span className={ticket.ResolutionDate ? styles.resolved : styles.important}>
                    {ticket.ResolutionDate ? new Date(ticket.ResolutionDate).toLocaleDateString('fr-FR') : t("TicketDetail.NonReso")}
                </span>
            </p>
            <p className={styles.description}>{t("TicketDetail.Description")} : <span>{ticket.DescriptionText || t("TicketDetail.PasDeDescription")}</span></p>
            {ticket.ResolutionDate && ticket.resolutionTime && (
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