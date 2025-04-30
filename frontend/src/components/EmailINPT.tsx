import axios from 'axios';

import { useState, useEffect } from 'react';
import { useTranslation } from "../hooks/useTranslation";

import Title from './Title';
import Button from './Button';

import styles from '../styles/components/Email.module.scss'

interface EmailINPT {
    id: number;
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

function EmailINPT() {
    const { t } = useTranslation();
    const [emails, setEmails] = useState<EmailINPT[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    function goBack() {
        window.history.back();
    }

    useEffect(() => {
        async function fetchEmails() {
            try {
                const response = await axios.get<EmailINPT[]>('http://localhost:3001/emails_impt');
                // Ne garder que les opérations
                const operationEmails = response.data.filter(email => email.typeEmail === 'operation');
                setEmails(operationEmails);
                setLoading(false);
            } catch (err: any) {
                setError(err);
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
                                <td>{email.numeroOperation}</td>
                                <td>{email.nomSite}</td>
                                <td>{email.dateHeure}</td>
                                <td>{email.from}</td>
                                <td className={styles.statusCell}>{email.status}</td>
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