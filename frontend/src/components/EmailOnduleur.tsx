import axios from 'axios';

import { useState, useEffect } from 'react';
import { useTranslation } from "../hooks/useTranslation";

import Title from './Title';
import Button from './Button';

import styles from '../styles/components/Email.module.scss'

interface EmailOnduleur {
    id: number;
    type: string;
    message: string;
    event: string;
    timestamp: string;
}

function EmailOnduleur() {
    const { t } = useTranslation();
    const [emails, setEmails] = useState<EmailOnduleur[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    function goBack() {
        window.history.back();
    }

    useEffect(() => {
        async function fetchEmails() {
            try {
                const response = await axios.get<EmailOnduleur[]>('http://localhost:3001/emails_onduleurs');
                setEmails(response.data);
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
