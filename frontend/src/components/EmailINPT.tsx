import axios from 'axios';

import { useState, useEffect } from 'react';
import { useTranslation } from "../hooks/useTranslation";
import { useNavigate } from 'react-router-dom';

import Title from './Title';
import Button from './Button';

import styles from '../styles/components/Email.module.scss';

/**
 * Définit la structure d'un objet email INPT après traitement et extraction des données pertinentes.
 * Utilisé pour typer les données affichées dans le tableau.
 * @property id Identifiant unique de l'email (messageId ou seqno).
 * @property from? L'expéditeur de l'email.
 * @property subject? Le sujet de l'email.
 * @property date? La date de réception de l'email.
 * @property numeroOperation? Le numéro d'opération extrait du sujet ou du corps.
 * @property nomSite? Le nom du site extrait du sujet ou du corps.
 * @property dateHeure? La date/heure de l'événement extrait du sujet ou du corps.
 * @property text? Le corps texte de l'email.
 * @property typeEmail? Le type d'email déterminé ('operation', 'incident_debut', 'incident_fin').
 * @property status? Le statut calculé de l'opération ('✅', '🔃', '❌').
 */
interface EmailINPT {
    id: number | string;
    from?: string;
    subject?: string;
    date?: string | Date;
    numeroOperation?: string | null;
    nomSite?: string | null;
    dateHeure?: string | null;
    text?: string;
    typeEmail?: 'operation' | 'incident_debut' | 'incident_fin';
    status?: string;
}

/**
 * Composant React affichant une liste des emails INPT de type 'operation' dans un tableau.
 * Récupère les données depuis l'API `/emails_impt`, filtre les emails pour ne garder que
 * les opérations, et rafraîchit la liste périodiquement.
 * Gère les états de chargement et d'erreur.
 *
 * @returns Le composant JSX affichant le titre, le tableau des emails ou les états alternatifs.
 */
function EmailINPT() {
    const { t } = useTranslation();
    const [emails, setEmails] = useState<EmailINPT[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const navigate = useNavigate();

    /**
     * Fonction simple pour naviguer vers la page précédente (page des alertes) dans l'historique du navigateur.
     */
    function goBack() {
        navigate(`/alertes`);
    }

    useEffect(() => {
        /**
         * Récupère les emails depuis l'API, filtre pour ne garder que les 'operation',
         * et met à jour l'état du composant. Gère le chargement et les erreurs.
         */
        async function fetchEmails() {
            try {
                const response = await axios.get<EmailINPT[]>('http://localhost:3001/emails_inpt');
                const operationEmails = response.data.filter(email => email.typeEmail === 'operation');
                setEmails(operationEmails);
                setError(null);
            } catch (err: any) {
                setError(err);
                console.error("Erreur fetch emails INPT:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchEmails();
        const intervalId = setInterval(() => {
            fetchEmails();
        }, 50000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>{t("EmailOnduleur.Chargement")}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p>{t("EmailOnduleur.Erreur")} {error.message}</p>
                <Button
                    backgroundColor={"#2B3244"}
                    text={t("Global.Reessayer")}
                    textColor={"white"}
                    onClick={() => window.location.reload()}
                />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.gestionTitle}>
                <Title text={t("EmailINPT.Title")} />
            </div>
            <div className={styles.tablecontainer}>
                <table className={styles.tickettable}>
                    <thead>
                        <tr>
                            <th>{t("EmailINPT.NumeroOperation")}</th>
                            <th>{t("EmailINPT.NomSite")}</th>
                            <th>{t("EmailINPT.DateHeure")}</th>
                            <th>{t("EmailINPT.Expediteur")}</th>
                            <th>{t("EmailINPT.Statut")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {emails.map(email => (
                            <tr key={email.id}>
                                <td>{email.numeroOperation || '-'}</td>
                                <td>{email.nomSite || '-'}</td>
                                <td>{email.dateHeure || '-'}</td>
                                <td>{email.from || '-'}</td>
                                <td className={styles.statusCell}>{email.status || '?'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {emails.length === 0 && (
                <div className={styles.noDataMessage}>
                    {t("EmailINPT.AucuneDonnee")}
                </div>
            )}
            <Button
                backgroundColor={"#2B3244"}
                text={t("Rapport.GoBack")}
                textColor={"white"}
                onClick={goBack}
            />
        </div>
    );
}
export default EmailINPT;