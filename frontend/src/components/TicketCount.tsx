import axios from 'axios';

import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';

import Button from '../components/Button';

import styles from '../styles/components/TicketCount.module.scss';

/**
 * Définit la structure des données d'un ticket individuel tel qu'affiché dans le tableau.
 * @property TicketId Identifiant numérique unique du ticket.
 * @property Title Titre ou sujet du ticket.
 * @property CallerName Nom formaté du demandeur du ticket.
 * @property HeureDeCréation Heure de création du ticket (format HH:MM:SS).
 * @property ResolutionDate Date de résolution du ticket (peut être null si non résolu).
 */
interface Ticket {
    TicketId: number;
    Title: string;
    CallerName: string;
    HeureDeCréation: string;
    ResolutionDate: string | null;
}

/**
 * Composant React affichant le nombre de tickets créés et résolus pour une date spécifique
 * (récupérée depuis les paramètres de l'URL), ainsi qu'une liste cliquable de ces tickets.
 * Les données sont récupérées depuis l'API et rafraîchies périodiquement.
 * Gère les états de chargement et d'erreur.
 *
 * @returns Le composant JSX affichant les compteurs, le tableau des tickets, ou un état alternatif.
 */
const TicketCount: React.FC = () => {
    const [NbTicketCreated, setNbTicketCreated] = useState<number | null>(null);
    const [NbTicketResolved, setNbTicketResolved] = useState<number | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const selectedDate = searchParams.get('date');
    const navigate = useNavigate();
    const { t } = useTranslation();

    const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString('fr-FR') : 'Aucune';

    /**
     * Formate un nom d'opérateur/demandeur potentiellement brut (ex: "DOMAINE\prenom.nom")
     * en un format plus lisible (ex: "Prenom Nom").
     * @param operatorName Le nom brut à formater.
     * @returns Le nom formaté ou une chaîne vide.
     */
    const formatOperatorName = (operatorName: string): string => {
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
     * Fonction pour récupérer les données initiales (compteurs et liste des tickets)
     * pour la date sélectionnée via des appels API concurrents.
     * Gère l'état de chargement initial et les erreurs.
     */
    const fetchInitialData = useCallback(async () => {
        if (!selectedDate) {
            setError("Date non spécifiée dans l'URL.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const [NbTicketCreatedRes, NbTicketResolvedRes, ticketsResponseRes] = await Promise.allSettled([
                axios.get<{ count: number }>(`/tickets/count-created?date=${selectedDate}`),
                axios.get<{ count: number }>(`/tickets/count-resolved?date=${selectedDate}`),
                axios.get<Ticket[]>(`/tickets/tickets?date=${selectedDate}`),
            ]);

            if (NbTicketCreatedRes.status === 'fulfilled') setNbTicketCreated(NbTicketCreatedRes.value.data.count ?? 0);
            else console.error("Erreur fetch NbTicketCreated:", NbTicketCreatedRes.reason);

            if (NbTicketResolvedRes.status === 'fulfilled') setNbTicketResolved(NbTicketResolvedRes.value.data.count ?? 0);
            else console.error("Erreur fetch NbTicketResolved:", NbTicketResolvedRes.reason);

            if (ticketsResponseRes.status === 'fulfilled') {
                const fetchedTickets = ticketsResponseRes.value.data || [];
                const formattedTickets = fetchedTickets.map(ticket => ({
                    ...ticket,
                    CallerName: formatOperatorName(ticket.CallerName),
                }));
                setTickets(formattedTickets);
            } else {
                console.error("Erreur fetch tickets:", ticketsResponseRes.reason);
                setTickets([]);
            }

            setLoading(false);
        } catch (err) {
            setError('Erreur lors de la récupération initiale des données');
            console.error('Erreur complète fetchInitialData: ', err);
            setLoading(false);
            setNbTicketCreated(null);
            setNbTicketResolved(null);
            setTickets([]);
        }
    }, [selectedDate]);

    /**
     * Fonction pour rafraîchir les données (compteurs et liste) à intervalles réguliers.
     * Similaire à fetchInitialData mais ne modifie pas l'état de chargement principal.
     */
    const fetchLiveUpdates = useCallback(async () => {
        if (!selectedDate) return;
        try {
            const [NbTicketCreatedRes, NbTicketResolvedRes, ticketsResponseRes] = await Promise.allSettled([
                axios.get<{ count: number }>(`/tickets/count-created?date=${selectedDate}`),
                axios.get<{ count: number }>(`/tickets/count-resolved?date=${selectedDate}`),
                axios.get<Ticket[]>(`/tickets/tickets?date=${selectedDate}`),
            ]);

            if (NbTicketCreatedRes.status === 'fulfilled') setNbTicketCreated(NbTicketCreatedRes.value.data.count || 0);
            if (NbTicketResolvedRes.status === 'fulfilled') setNbTicketResolved(NbTicketResolvedRes.value.data.count || 0);
            if (ticketsResponseRes.status === 'fulfilled') {
                const fetchedTickets = ticketsResponseRes.value.data || [];
                const formattedTickets = fetchedTickets.map(ticket => ({
                    ...ticket,
                    CallerName: formatOperatorName(ticket.CallerName),
                }));
                setTickets(formattedTickets);
            }
            if (NbTicketCreatedRes.status === 'rejected') console.error('Erreur refresh NbTicketCreated:', NbTicketCreatedRes.reason);
            if (NbTicketResolvedRes.status === 'rejected') console.error('Erreur refresh NbTicketResolved:', NbTicketResolvedRes.reason);
            if (ticketsResponseRes.status === 'rejected') console.error('Erreur refresh tickets:', ticketsResponseRes.reason);

        } catch (err) {
            console.error('Erreur lors du rafraîchissement des données :', err);
        }
    }, [selectedDate]);

    /**
     * Effet pour lancer la récupération initiale des données au montage
     * et mettre en place un intervalle pour les mises à jour périodiques.
     */
    useEffect(() => {
        fetchInitialData();
        const intervalId = setInterval(fetchLiveUpdates, 10000);
        return () => clearInterval(intervalId);
    }, [fetchInitialData, fetchLiveUpdates]);

    /**
     * Gère le clic sur une ligne du tableau de tickets.
     * Navigue vers la page de détail du ticket correspondant.
     * @param ticketId L'ID du ticket sur lequel l'utilisateur a cliqué.
     */
    const handleTicketClick = (ticketId: number) => {
        if (ticketId) {
            navigate(`/clarilog_detail?id=${ticketId}`);
        } else {
            console.warn("Tentative de naviguer avec un TicketId invalide");
        }
    };

    /**
     * Détermine le style CSS à appliquer à une ligne du tableau en fonction
     * de la date de résolution du ticket (résolu ou non).
     * @param resolutionDate La date de résolution du ticket (peut être null).
     * @returns Un objet de style CSS.
     */
    const getRowStyle = (resolutionDate: string | null): React.CSSProperties => {
        return {
            cursor: 'pointer',
            color: resolutionDate ? '#2B3244' : '#C54844',
        };
    };

    /**
     * Gère le clic sur le bouton pour retourner au calendrier mensuel (vue parente probable).
     * Navigue vers la vue mensuelle pour le mois et l'année actuels.
     */
    const goToCalendar = () => {
        const today = new Date();
        const month = (today.getMonth() + 1).toString();
        const year = today.getFullYear().toString();
        navigate(`/clarilog_mensuel?month=${month}&year=${year}`);
    };

    if (loading) return <p>{t('Global.Chargement')}</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2 className={styles.ticket}>Date : <span className={styles.result}>{formattedDate}</span></h2>
            <h2 className={styles.ticket}>{t('TicketCount.NbTicketsCreesJour')} : <span className={styles.result}>{NbTicketCreated ?? '-'}</span></h2>
            <h2 className={styles.ticket}>{t('TicketCount.NbTicketsResolusJour')} : <span className={styles.result}>{NbTicketResolved ?? '-'}</span></h2>
            <h2 className={styles.ticket}>{t('TicketCount.TitleTableau')}</h2>
            <div className={styles.tablecontainer}>
                <table className={styles.tickettable}>
                    <thead>
                        <tr>
                            <th>{t('TicketCount.ID')}</th>
                            <th>{t('TicketCount.TitreDemande')}</th>
                            <th>{t('TicketCount.Demandeur')}</th>
                            <th>{t('TicketCount.Heure')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map(({ TicketId, Title, CallerName, HeureDeCréation, ResolutionDate }, index) => (
                            <tr
                                key={TicketId ?? `fallback-key-${index}`}
                                onClick={() => handleTicketClick(TicketId)}
                                style={getRowStyle(ResolutionDate)}
                            >
                                <td>{TicketId || t('TicketCount.Erreur.ID')}</td>
                                <td>{Title || t('TicketCount.Erreur.Titre')}</td>
                                <td>{CallerName || t('TicketCount.Erreur.Demandeur')}</td>
                                <td>{HeureDeCréation || t('TicketCount.Erreur.Heure')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Button
                backgroundColor={'#2B3244'}
                text={t('Calendar.GoToMonth')}
                textColor={'white'}
                onClick={goToCalendar}
            />
        </div>
    );
};
export default TicketCount;