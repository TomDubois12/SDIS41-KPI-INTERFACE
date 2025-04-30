import { Link } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/components/Parametre.module.scss';

/**
 * Convertit un ArrayBuffer en une chaîne de caractères base64url safe.
 * Utile pour encoder les clés de l'abonnement push avant de les envoyer au backend.
 * @param buffer L'ArrayBuffer à convertir.
 * @returns La chaîne de caractères encodée en base64url.
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    const binary = String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)));
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Convertit une chaîne de caractères base64url safe en Uint8Array.
 * Utile pour décoder la clé publique VAPID reçue du serveur avant de l'utiliser
 * pour l'abonnement push.
 * @param base64String La chaîne de caractères encodée en base64url.
 * @returns L'Uint8Array correspondant.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Composant React représentant un menu de paramètres (accessible via un bouton 'hamburger').
 * Permet à l'utilisateur de changer la langue de l'interface, d'activer/désactiver
 * les notifications Web Push, et de gérer ses préférences de notification (tickets, emails)
 * si l'abonnement est actif. Gère les états de chargement, d'erreur, et vérifie la
 * compatibilité du navigateur avec les notifications push.
 *
 * @returns Le composant JSX affichant le bouton de menu et le menu déroulant si ouvert.
 */
const Parametres = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { t, setLang, lang } = useTranslation();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isMainLoading, setIsMainLoading] = useState(false);
    const [mainNotificationButtonText, setMainNotificationButtonText] = useState(t("Parametre.Notifications.Activer"));
    const [notificationError, setNotificationError] = useState<string | null>(null);
    const [supportsNotifications, setSupportsNotifications] = useState(true);
    const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
    const [notifyTicketPref, setNotifyTicketPref] = useState(true);
    const [notifyEmailPref, setNotifyEmailPref] = useState(true);
    const [isPrefsLoading, setIsPrefsLoading] = useState(false);

    /**
     * Récupère les préférences de notification actuelles depuis le backend
     * pour un endpoint d'abonnement donné. Met à jour l'état local des préférences.
     * @param endpoint L'endpoint de l'abonnement pour lequel récupérer les préférences.
     */
    const fetchPreferences = useCallback(async (endpoint: string) => {
        setIsPrefsLoading(true);
        setNotificationError(null);
        console.log(`Récupération des préférences pour: ${endpoint.substring(0, 40)}...`);
        try {
            const response = await fetch(`http://localhost:3001/notifications/preferences?endpoint=${encodeURIComponent(endpoint)}`);
            if (!response.ok) {
                let errorMsg = `${t("Parametre.Notifications.ErreurRecupPrefs")} (${response.status})`;
                try { const errorData = await response.json(); errorMsg = errorData?.message || errorMsg; } catch (e) {}
                throw new Error(errorMsg);
            }
            const prefs = await response.json();
            if (prefs && typeof prefs.notifyOnTicket === 'boolean' && typeof prefs.notifyOnEmail === 'boolean') {
                setNotifyTicketPref(prefs.notifyOnTicket);
                setNotifyEmailPref(prefs.notifyOnEmail);
                console.log("Préférences récupérées depuis backend:", prefs);
            } else {
                console.warn("Format de réponse inattendu pour les préférences, utilisation des défauts.", prefs);
                setNotifyTicketPref(true); setNotifyEmailPref(true);
                setNotificationError(t("Parametre.Notifications.ErreurFormatPrefs"));
            }
        } catch (err: any) {
            console.error("Erreur fetchPreferences:", err);
            setNotificationError(err.message || t("Parametre.Notifications.ErreurRecupPrefs"));
            setNotifyTicketPref(true); setNotifyEmailPref(true);
        } finally {
            setIsPrefsLoading(false);
        }
    }, [t]);

    /**
     * Effet exécuté au montage pour vérifier la compatibilité des notifications push,
     * enregistrer le Service Worker, et déterminer l'état actuel de l'abonnement push.
     * Si un abonnement existe, récupère les préférences associées.
     */
    useEffect(() => {
        console.log("[Effect Étape 1] Début useEffect. Vérification support SW/Push...");
        setNotificationError(null);

        if (!('serviceWorker' in navigator && 'PushManager' in window)) {
            console.warn("[Effect Étape 1] Non supporté.");
            setSupportsNotifications(false);
            setMainNotificationButtonText(t("Parametre.Notifications.NonSupportees"));
            return;
        }
        console.log("[Effect Étape 1] Support OK.");
        setSupportsNotifications(true);

        console.log("[Effect Étape 2] Tentative d'enregistrement SW '/sw.js'...");
        navigator.serviceWorker.register('/sw.js')
            .then(reg => {
                console.log('[Effect Étape 2] Enregistrement SW Réussi. Registration:', reg);
                console.log('[Effect Étape 3] Attente SW Ready (activation)...');
                return navigator.serviceWorker.ready;
            })
            .then(registration => {
                console.log('[Effect Étape 3] SW Ready (activé et contrôle la page). Registration:', registration);
                console.log('[Effect Étape 4] Vérification abonnement Push existant...');
                return registration.pushManager.getSubscription();
            })
            .then(subscription => {
                console.log('[Effect Étape 4] Résultat getSubscription:', subscription);
                if (subscription) {
                    console.log('[Effect Étape 5a] Abonnement trouvé. Mise à jour UI (subscribed=true) et stockage endpoint...');
                    setIsSubscribed(true);
                    setMainNotificationButtonText(t("Parametre.Notifications.Desactiver"));
                    const endpoint = subscription.endpoint;
                    setCurrentEndpoint(endpoint);
                    console.log('[Effect Étape 5a] Lancement fetchPreferences...');
                    return fetchPreferences(endpoint);
                } else {
                    console.log('[Effect Étape 5b] Aucun abonnement trouvé. Mise à jour UI (subscribed=false)...');
                    setIsSubscribed(false);
                    setMainNotificationButtonText(t("Parametre.Notifications.Activer"));
                    setCurrentEndpoint(null);
                    setNotifyTicketPref(true);
                    setNotifyEmailPref(true);
                    return Promise.resolve();
                }
            })
            .then(() => {
                console.log('[Effect Étape 6] Chaîne de promesses useEffect terminée avec succès.');
            })
            .catch(err => {
                console.error('[Effect Catch Final] Erreur dans la chaîne useEffect:', err);
                let errorMsg = t("Parametre.Notifications.ErreurInit");
                if (err.message?.toLowerCase().includes('register')) errorMsg = t("Parametre.Notifications.ErreurSW");
                else if (err.message?.toLowerCase().includes('subscription')) errorMsg = t("Parametre.Notifications.ErreurRecupAbonnement");
                else if (err.message?.toLowerCase().includes('permission')) errorMsg = t("Parametre.Notifications.PermissionRefusee");
                else if (err.message) errorMsg = `${t("Parametre.Notifications.ErreurInattendue")} : ${err.message}`;
                setNotificationError(errorMsg);
                setIsSubscribed(false);
                setMainNotificationButtonText(t("Parametre.Notifications.Erreur"));
                setCurrentEndpoint(null);
            });
    }, [t, fetchPreferences]);

    /**
     * Envoie les préférences de notification mises à jour au backend via une requête PATCH.
     * Gère l'état de chargement et les erreurs potentielles.
     * @param prefsToUpdate Objet contenant les nouvelles valeurs pour `notifyOnTicket` et `notifyOnEmail`.
     */
    const updateBackendPreferences = useCallback(async (prefsToUpdate: { ticket: boolean, email: boolean }) => {
        if (!currentEndpoint) {
            console.error("Impossible de mettre à jour : endpoint manquant.");
            setNotificationError(t("Parametre.Notifications.ErreurManqueEndpoint"));
            return;
        }
        setIsPrefsLoading(true);
        setNotificationError(null);
        try {
            const response = await fetch('http://localhost:3001/notifications/preferences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: currentEndpoint,
                    notifyOnTicket: prefsToUpdate.ticket,
                    notifyOnEmail: prefsToUpdate.email,
                }),
            });
            if (!response.ok) {
                let errorMsg = `Erreur serveur (${response.status})`;
                try { const errorData = await response.json(); errorMsg = errorData?.message || errorMsg; } catch (e) {}
                throw new Error(errorMsg);
            }
            const result = await response.json();
            console.log("Préférences mises à jour avec succès:", result);
        } catch (err: any) {
            console.error("Erreur updateBackendPreferences:", err);
            setNotificationError(err.message || t("Parametre.Notifications.ErreurSauvegardePrefs"));
        } finally {
            setIsPrefsLoading(false);
        }
    }, [currentEndpoint, t]);

    /**
     * Gère le changement d'état de la case à cocher pour les notifications de ticket.
     * Met à jour l'état local et appelle la fonction pour sauvegarder les préférences au backend.
     * @param event L'événement de changement de l'input checkbox.
     */
    const handleTicketPrefChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setNotifyTicketPref(isChecked);
        updateBackendPreferences({ ticket: isChecked, email: notifyEmailPref });
    };
    /**
     * Gère le changement d'état de la case à cocher pour les notifications d'email.
     * Met à jour l'état local et appelle la fonction pour sauvegarder les préférences au backend.
     * @param event L'événement de changement de l'input checkbox.
     */
    const handleEmailPrefChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        setNotifyEmailPref(isChecked);
        updateBackendPreferences({ ticket: notifyTicketPref, email: isChecked });
    };

    /**
     * Tente d'abonner l'utilisateur aux notifications push.
     * Récupère la clé VAPID, demande la permission à l'utilisateur via le navigateur,
     * obtient l'objet `PushSubscription`, et envoie ses détails au backend pour enregistrement.
     * Met à jour l'état de l'interface utilisateur en fonction du succès ou de l'échec.
     */
    const subscribeUser = useCallback(async () => {
        setIsMainLoading(true);
        setNotificationError(null);
        setMainNotificationButtonText(t("Parametre.Notifications.ActivationEnCours"));
        try {
            const registration = await navigator.serviceWorker.ready;
            const response = await fetch('http://localhost:3001/notifications/vapid-public-key');
            if (!response.ok) throw new Error('Impossible de récupérer la clé VAPID.');
            const keyData = await response.json();
            const vapidPublicKey = keyData?.publicKey;
            if (!vapidPublicKey) throw new Error('Clé VAPID reçue invalide.');

            const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
            const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
            console.log('User is subscribed (raw):', subscription);

            const p256dhKey = subscription.getKey('p256dh');
            const authKey = subscription.getKey('auth');
            if (!p256dhKey || !authKey) throw new Error("Impossible de récupérer les clés p256dh/auth.");

            const payloadToSend = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: arrayBufferToBase64Url(p256dhKey),
                    auth: arrayBufferToBase64Url(authKey)
                }
            };
            console.log('Payload envoyé (manuel):', JSON.stringify(payloadToSend));

            const subscribeResponse = await fetch('http://localhost:3001/notifications/subscribe', {
                method: 'POST',
                body: JSON.stringify(payloadToSend),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!subscribeResponse.ok) {
                await subscription.unsubscribe();
                let errorMsg = `Erreur serveur (${subscribeResponse.status})`;
                try { const errorData = await subscribeResponse.json(); errorMsg = errorData?.message || errorMsg; } catch (e) {}
                throw new Error(`${t("Parametre.Notifications.ErreurSauvegardeAbonnement")} ${errorMsg}`);
            }

            console.log('Subscription saved on backend');
            setIsSubscribed(true);
            setMainNotificationButtonText(t("Parametre.Notifications.Desactiver"));
            setCurrentEndpoint(subscription.endpoint);
            setNotifyTicketPref(true);
            setNotifyEmailPref(true);

        } catch (err: any) {
            console.error('Failed to subscribe the user: ', err);
            let message = t('Parametre.Notifications.ErreurActivation');
            if (err.name === 'NotAllowedError') message = t('Parametre.Notifications.PermissionRefusee');
            else if (err.message) message = err.message;
            setNotificationError(message);
            setIsSubscribed(false);
            setMainNotificationButtonText(t("Parametre.Notifications.Activer"));
            setCurrentEndpoint(null);
        } finally {
            setIsMainLoading(false);
        }
    }, [t]);

    /**
     * Tente de désabonner l'utilisateur des notifications push.
     * Récupère l'abonnement actuel, appelle `unsubscribe()` sur celui-ci,
     * et notifie (best effort) le backend pour supprimer l'enregistrement.
     * Met à jour l'état de l'interface utilisateur.
     */
    const unsubscribeUser = useCallback(async () => {
        setIsMainLoading(true);
        setNotificationError(null);
        setMainNotificationButtonText(t("Parametre.Notifications.DesactivationEnCours"));
        let endpointToDelete: string | null = null;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                endpointToDelete = subscription.endpoint;
                const unsubscribed = await subscription.unsubscribe();

                if (unsubscribed) {
                    console.log('User is unsubscribed locally.');
                    setIsSubscribed(false);
                    setMainNotificationButtonText(t("Parametre.Notifications.Activer"));
                    setCurrentEndpoint(null);
                    setNotifyTicketPref(true);
                    setNotifyEmailPref(true);

                    if (endpointToDelete) {
                        console.log(`Notification du backend pour désinscrire: ${endpointToDelete.substring(0, 40)}...`);
                        try {
                            const deleteResponse = await fetch('http://localhost:3001/notifications/unsubscribe', {
                                method: 'POST',
                                body: JSON.stringify({ endpoint: endpointToDelete }),
                                headers: { 'Content-Type': 'application/json' },
                            });
                            if (deleteResponse.ok) { console.log("Subscription removed from backend."); }
                            else { console.warn("Failed to remove subscription from backend.", await deleteResponse.text()); }
                        } catch (backendDeleteError) { console.error("Error notifying backend of unsubscription:", backendDeleteError); }
                    }

                } else {
                    throw new Error(t("Parametre.Notifications.ErreurDesinscriptionLocale"));
                }
            } else {
                console.log("Aucun abonnement local trouvé à désinscrire.");
                setIsSubscribed(false);
                setMainNotificationButtonText(t("Parametre.Notifications.Activer"));
                setCurrentEndpoint(null);
            }
        } catch (err: any) {
            console.error('Failed to unsubscribe the user: ', err);
            setNotificationError(err.message || t('Parametre.Notifications.ErreurDesactivation'));
            setMainNotificationButtonText(t("Parametre.Notifications.Desactiver"));
        } finally {
            setIsMainLoading(false);
        }
    }, [t]);

    /**
     * Gère le clic sur le bouton principal d'activation/désactivation des notifications.
     * Appelle `subscribeUser` ou `unsubscribeUser` en fonction de l'état actuel `isSubscribed`.
     */
    const handleNotificationButtonClick = () => {
        if (isSubscribed) { unsubscribeUser(); }
        else { subscribeUser(); }
    };

    return (
        <div className={styles.wrapper}>
            <button className={styles.parametres} onClick={() => setIsOpen(!isOpen)}> ☰ </button>
            {isOpen && (
                <div className={styles.menu}>
                    <button onClick={() => setLang(lang === "fr" ? "en" : "fr")}>
                        {t("Parametre.SwitchLanguage")}
                    </button>
                    <div className={styles.notificationSection}>
                        <h3>{t("Parametre.Notifications.Titre")}</h3>
                        {supportsNotifications ? (
                            <>
                                <button onClick={handleNotificationButtonClick} disabled={isMainLoading}>
                                    {isMainLoading ? t("Global.Chargement") : mainNotificationButtonText}
                                </button>
                                {isSubscribed && (
                                    <div className={styles.preferences}>
                                        {isPrefsLoading && <span className={styles.loadingPrefs}>({t("Global.Enregistrement")}...)</span>}
                                        <label className={isPrefsLoading || isMainLoading ? styles.disabledLabel : ''}>
                                            <input type="checkbox" checked={notifyTicketPref} onChange={handleTicketPrefChange} disabled={isPrefsLoading || isMainLoading} />
                                            {t("Parametre.Notifications.PrefTickets")}
                                        </label>
                                        <label className={isPrefsLoading || isMainLoading ? styles.disabledLabel : ''}>
                                            <input type="checkbox" checked={notifyEmailPref} onChange={handleEmailPrefChange} disabled={isPrefsLoading || isMainLoading} />
                                            {t("Parametre.Notifications.PrefEmails")}
                                        </label>
                                    </div>
                                )}
                            </>
                        ) : (<p>{t("Parametre.Notifications.NonSupportees")}</p>)}
                        {notificationError && <p className={styles.errorMessage}>{notificationError}</p>}
                    </div>
                    <Link to="/credits"><button>{t("Parametre.Credits")}</button></Link>
                    <Link to="/"><button>{t("Parametre.BackToHome")}</button></Link>
                </div>
            )}
        </div>
    );
};
export default Parametres;