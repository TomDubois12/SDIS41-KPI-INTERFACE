import { Link } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react"; // Importer useEffect et useCallback
import { useTranslation } from "../hooks/useTranslation";

import styles from "../styles/components/Parametre.module.scss";

// Fonction utilitaire pour convertir la clé VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+') // Remplacer les caractères URL-safe par les caractères Base64 standard
        .replace(/_/g, '/');

    const rawData = window.atob(base64); // Décoder la chaîne Base64
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}


const Parametres = () => {
    // États pour le menu existant
    const [isOpen, setIsOpen] = useState(false);
    const { t, setLang, lang } = useTranslation();

    // --- Nouveaux États pour les notifications ---
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notificationButtonText, setNotificationButtonText] = useState("Activer les notifications");
    const [error, setError] = useState<string | null>(null);
    const [supportsNotifications, setSupportsNotifications] = useState(true); // On suppose supporté au début

    // --- Vérification initiale de l'état de l'abonnement ---
    useEffect(() => {
        // Vérifier la compatibilité
        if (!('serviceWorker' in navigator && 'PushManager' in window)) {
            setSupportsNotifications(false);
            setNotificationButtonText("Notifications non supportées");
            console.warn("Push notifications are not supported by this browser.");
            return;
        }

        setSupportsNotifications(true);
        // Attendre que le Service Worker soit prêt
        navigator.serviceWorker.ready.then(registration => {
            // Vérifier si un abonnement existe déjà
            registration.pushManager.getSubscription().then(subscription => {
                if (subscription) {
                    setIsSubscribed(true);
                    setNotificationButtonText(t("Parametre.Notifications.Desactiver")); // Mettre à jour le texte du bouton si déjà abonné
                } else {
                    setIsSubscribed(false);
                    setNotificationButtonText(t("Parametre.Notifications.Activer")); // Texte initial si non abonné
                }
            }).catch(err => {
                console.error("Error getting subscription:", err);
                setError("Erreur lors de la vérification de l'abonnement.");
                setNotificationButtonText(t("Parametre.Notifications.Activer"));
            });
        }).catch(err => {
            console.error("Service worker not ready:", err);
            setError("Le service worker n'est pas prêt.");
             setSupportsNotifications(false); // Si le SW n'est pas prêt, on ne peut pas s'abonner
             setNotificationButtonText("Erreur Service Worker");
        });
    }, [t]); // Ajouter t comme dépendance pour mettre à jour le texte du bouton si la langue change

    // --- Fonction pour s'abonner ---
    const subscribeUser = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setNotificationButtonText(t("Parametre.Notifications.ActivationEnCours"));

        if (!navigator.serviceWorker.ready) {
             setError("Le service worker n'est pas prêt.");
             setIsLoading(false);
             setNotificationButtonText(t("Parametre.Notifications.Activer"));
             return;
        }

        try {
            const registration = await navigator.serviceWorker.ready; // Utiliser le SW prêt

            // Récupérer la clé VAPID du backend
            const response = await fetch('http://localhost:3001/notifications/vapid-public-key');
            if (!response.ok) throw new Error('Impossible de récupérer la clé VAPID du serveur.');
            const vapidPublicKey = await response.text();
            if (!vapidPublicKey) throw new Error('Clé VAPID reçue invalide.');
            const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

            // Demander l'abonnement au navigateur (peut déclencher la demande de permission)
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });
            console.log('User is subscribed:', subscription);

            // Envoyer l'abonnement au backend pour enregistrement
            const subscribeResponse = await fetch('http://localhost:3001/notifications/subscribe', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!subscribeResponse.ok) {
                // Si l'enregistrement backend échoue, annuler l'abonnement local
                await subscription.unsubscribe();
                throw new Error('Impossible d\'enregistrer l\'abonnement sur le serveur.');
            }

            console.log('Subscription saved on backend');
            setIsSubscribed(true);
            setNotificationButtonText(t("Parametre.Notifications.Desactiver"));

        } catch (err: any) {
            console.error('Failed to subscribe the user: ', err);
            let message = t('Parametre.Notifications.ErreurActivation');
            if (err.name === 'NotAllowedError') {
                message = t('Parametre.Notifications.PermissionRefusee');
            } else if (err.message) {
                message = `${t('Parametre.Notifications.Erreur')} : ${err.message}`;
            }
            setError(message);
            setIsSubscribed(false); // Assurer que l'état est correct
            setNotificationButtonText(t("Parametre.Notifications.Activer")); // Revenir à l'état initial
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    // --- Fonction pour se désabonner ---
    const unsubscribeUser = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setNotificationButtonText(t("Parametre.Notifications.DesactivationEnCours"));

         if (!navigator.serviceWorker.ready) {
             setError("Le service worker n'est pas prêt.");
             setIsLoading(false);
             setNotificationButtonText(t("Parametre.Notifications.Desactiver"));
             return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                const unsubscribed = await subscription.unsubscribe();
                if (unsubscribed) {
                    console.log('User is unsubscribed.');
                    setIsSubscribed(false);
                    setNotificationButtonText(t("Parametre.Notifications.Activer"));
                    // Optionnel: Prévenir le backend que l'utilisateur s'est désabonné
                    // await fetch('http://localhost:3001/notifications/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint: subscription.endpoint }), headers: { 'Content-Type': 'application/json' } });
                } else {
                     throw new Error("La désinscription a échoué localement.");
                }
            } else {
                console.log("Aucun abonnement à désinscrire.");
                setIsSubscribed(false); // Synchroniser l'état
                setNotificationButtonText(t("Parametre.Notifications.Activer"));
            }
        } catch (err: any) {
            console.error('Failed to unsubscribe the user: ', err);
            setError(`${t('Parametre.Notifications.ErreurDesactivation')} : ${err.message}`);
             setNotificationButtonText(t("Parametre.Notifications.Desactiver")); // Revenir à l'état précédent en cas d'erreur
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    // --- Gestionnaire de clic pour le bouton de notification ---
    const handleNotificationButtonClick = () => {
        if (isSubscribed) {
            unsubscribeUser();
        } else {
            subscribeUser();
        }
    };


    // --- Rendu du composant ---
    return (
        <div className={styles.wrapper}>
            <button className={styles.parametres} onClick={() => setIsOpen(!isOpen)}>
                ☰
            </button>
            {isOpen && (
                <div className={styles.menu}>
                    {/* Bouton de langue existant */}
                    <button onClick={() => setLang(lang === "fr" ? "en" : "fr")}>
                        {t("Parametre.SwitchLanguage")}
                    </button>

                    {/* --- Nouveau Bouton pour les Notifications --- */}
                    <button
                        onClick={handleNotificationButtonClick}
                        disabled={isLoading || !supportsNotifications} // Désactivé si chargement ou non supporté
                    >
                        {isLoading ? t("Global.Chargement") : notificationButtonText}
                    </button>
                    {/* Affichage de l'erreur de notification si elle existe */}
                    {error && <p className={styles.errorMessage}>{error}</p>}


                    {/* Liens existants */}
                    {/* <button>{t("Parametre.SwitchToDT")}</button> */}
                    <Link to="/credits">
                        <button>{t("Parametre.Credits")}</button>
                    </Link>
                    <Link to="/">
                        <button>{t("Parametre.BackToHome")}</button>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Parametres;