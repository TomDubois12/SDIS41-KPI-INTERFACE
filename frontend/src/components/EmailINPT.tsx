import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { useTranslation } from "../hooks/useTranslation";
import Title from './Title';

import styles from '../styles/components/Email.module.scss'
import Button from './Button';

interface EmailINPT {
    id: number;
    from?: string;
    subject?: string;
    date?: string | Date;
    numeroOperation?: string | null;
    nomSite?: string | null;
    dateHeure?: string | null;
    text?: string;
}

function EmailINPT() {
    const { t } = useTranslation();
    const [emails, setEmails] = useState<EmailINPT[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchEmails() {
            try {
                const response = await axios.get<EmailINPT[]>('http://localhost:3001/emails_impt');
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
        }, 80000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) {
        return <p>{t("EmailOnduleur.Chargement")}</p>;
    }

    if (error) {
        return <p>{t("EmailOnduleur.Erreur")}</p>;
    }

    function goBack() {
        window.history.back();
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
                        </tr>
                    </thead>
                    <tbody>
                        {emails.map(email => (
                            <tr key={email.id}>
                                <td>{email.numeroOperation}</td>
                                <td>{email.nomSite}</td>
                                <td>{email.dateHeure}</td>
                                <td>{email.from}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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