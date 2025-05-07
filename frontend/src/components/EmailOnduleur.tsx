import axios from 'axios';

import { useState, useEffect } from 'react';
import { useTranslation } from "../hooks/useTranslation";
import { useNavigate } from 'react-router-dom';

import Title from './Title';
import Button from './Button';

import styles from '../styles/components/Email.module.scss';

/**
 * Définit la structure d'un objet email Onduleur après traitement et extraction des données pertinentes.
 * @property id Identifiant unique de l'email (probablement messageId).
 * @property type Type d'email déterminé (ex: 'Administratif', 'Alerte').
 * @property message Le message principal extrait de l'email.
 * @property event L'événement spécifique rapporté par l'onduleur.
 * @property timestamp L'horodatage de l'événement fourni dans l'email.
 */
interface EmailOnduleur {
    id: number | string;
    type: string;
    message: string;
    event: string;
    timestamp: string;
}

/**
 * Composant React affichant une liste des emails provenant des onduleurs dans un tableau.
 * Récupère les données depuis l'API `/emails_onduleurs` et rafraîchit la liste périodiquement.
 * Gère les états de chargement et d'erreur. Applique un style différent aux lignes
 * du tableau selon le type d'email ('Administratif' ou 'Alerte').
 *
 * @returns Le composant JSX affichant le titre, le tableau des emails ou les états alternatifs.
 */
function EmailOnduleur() {
    const { t } = useTranslation();
    const [emails, setEmails] = useState<EmailOnduleur[]>([]);
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
         * Récupère les emails depuis l'API et met à jour l'état du composant.
         * Gère le chargement et les erreurs.
         */
        async function fetchEmails() {
            try {
                const response = await axios.get<EmailOnduleur[]>('/emails_onduleurs');
                setEmails(response.data);
                setError(null);
            } catch (err: any) {
                setError(err);
                console.error("Erreur fetch emails Onduleur:", err);
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
        return <p>{t("EmailOnduleur.Chargement")}</p>;
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
                <Title text={t("EmailOnduleur.Title")} />
            </div>
            <div className={styles.tablecontainer}>
                <table className={styles.tickettable}>
                    <thead>
                        <tr>
                            <th>{t("EmailOnduleur.Type")}</th>
                            <th>{t("EmailOnduleur.Message")}</th>
                            <th>{t("EmailOnduleur.Evenement")}</th>
                            <th>{t("EmailOnduleur.Horodatage")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {emails.map((email) => (
                            <tr
                                key={email.id}
                                className={
                                    email.type === 'Administratif'
                                        ? styles.rowAdministratif
                                        : styles.rowAlerte
                                }
                            >
                                <td>{email.type}</td>
                                <td>{email.message}</td>
                                <td>{email.event}</td>
                                <td>{email.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {emails.length === 0 && (
                <div className={styles.noDataMessage}>
                    {t("EmailOnduleur.AucuneDonnee")}
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
export default EmailOnduleur;