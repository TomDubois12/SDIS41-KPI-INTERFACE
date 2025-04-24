// src/components/Parametres.tsx (VERSION FINALE COMPLÈTE - Vérifiée)

import { Link } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "../hooks/useTranslation"; // Assurez-vous que le chemin est correct

import styles from "../styles/components/Parametre.module.scss"; // Assurez-vous que le chemin est correct

// Fonction utilitaire pour convertir ArrayBuffer en Base64 URL
function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    const binary = String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)));
    return btoa(binary)
        .replace(/\+/g, '-') // Remplacer '+' par '-'
        .replace(/\//g, '_') // Remplacer '/' par '_'
        .replace(/=+$/, ''); // Supprimer le padding '='
}

// Fonction utilitaire pour convertir la clé VAPID Base64 URL en Uint8Array
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

const Parametres = () => {
    // États du menu
    const [isOpen, setIsOpen] = useState(false);
    const { t, setLang, lang } = useTranslation();

    // --- États Notifications ---
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isMainLoading, setIsMainLoading] = useState(false);
    const [mainNotificationButtonText, setMainNotificationButtonText] = useState(t("Parametre.Notifications.Activer"));
    const [notificationError, setNotificationError] = useState<string | null>(null);
    const [supportsNotifications, setSupportsNotifications] = useState(true);
    const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
    const [notifyTicketPref, setNotifyTicketPref] = useState(true);
    const [notifyEmailPref, setNotifyEmailPref] = useState(true);
    const [isPrefsLoading, setIsPrefsLoading] = useState(false);

    // --- Fonction pour récupérer les préférences actuelles ---
    const fetchPreferences = useCallback(async (endpoint: string) => {
        setIsPrefsLoading(true);
        setNotificationError(null);
        console.log(`Récupération des préférences pour: ${endpoint.substring(0,40)}...`);
        try {
            const response = await fetch(`http://localhost:3001/notifications/preferences?endpoint=${encodeURIComponent(endpoint)}`);
            if (!response.ok) {
                 let errorMsg = `${t("Parametre.Notifications.ErreurRecupPrefs")} (${response.status})`;
                 try { const errorData = await response.json(); errorMsg = errorData?.message || errorMsg; } catch(e){}
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

    // --- useEffect d'initialisation AVEC LOGS DÉTAILLÉS ---
    useEffect(() => {
        console.log("[Effect Étape 1] Début useEffect. Vérification support SW/Push...");
        setNotificationError(null); // Reset error on load/re-run

        if (!('serviceWorker' in navigator && 'PushManager' in window)) {
            console.warn("[Effect Étape 1] Non supporté.");
            setSupportsNotifications(false);
            setMainNotificationButtonText(t("Parametre.Notifications.NonSupportees"));
            return; // Sortir si non supporté
        }
        console.log("[Effect Étape 1] Support OK.");
        setSupportsNotifications(true); // S'assurer que c'est true si supporté

        console.log("[Effect Étape 2] Tentative d'enregistrement SW '/sw.js'...");
        navigator.serviceWorker.register('/sw.js') // Assure que sw.js est à la racine
            .then(reg => { // reg est ServiceWorkerRegistration
                console.log('[Effect Étape 2] Enregistrement SW Réussi. Registration:', reg);
                console.log('[Effect Étape 3] Attente SW Ready (activation)...');
                // Retourner la promesse .ready pour la chaîne suivante
                return navigator.serviceWorker.ready;
            })
            .then(registration => { // registration est le ServiceWorkerRegistration activé
                console.log('[Effect Étape 3] SW Ready (activé et contrôle la page). Registration:', registration);
                console.log('[Effect Étape 4] Vérification abonnement Push existant...');
                return registration.pushManager.getSubscription(); // Retourner la promesse
            })
            .then(subscription => { // subscription est le PushSubscription ou null
                console.log('[Effect Étape 4] Résultat getSubscription:', subscription);
                // Mise à jour UI et fetch prefs si nécessaire
                if (subscription) {
                    console.log('[Effect Étape 5a] Abonnement trouvé. Mise à jour UI (subscribed=true) et stockage endpoint...');
                    setIsSubscribed(true);
                    setMainNotificationButtonText(t("Parametre.Notifications.Desactiver"));
                    const endpoint = subscription.endpoint;
                    setCurrentEndpoint(endpoint);
                    console.log('[Effect Étape 5a] Lancement fetchPreferences...');
                    // Lancer fetchPreferences (retourne une promesse)
                    return fetchPreferences(endpoint);
                } else {
                    console.log('[Effect Étape 5b] Aucun abonnement trouvé. Mise à jour UI (subscribed=false)...');
                    setIsSubscribed(false);
                    setMainNotificationButtonText(t("Parametre.Notifications.Activer"));
                    setCurrentEndpoint(null);
                    setNotifyTicketPref(true); // Reset état local
                    setNotifyEmailPref(true);
                    return Promise.resolve(); // Continuer la chaîne
                }
            })
            .then(() => {
                 // S'exécute après la mise à jour UI et après fetchPreferences (si appelé)
                 console.log('[Effect Étape 6] Chaîne de promesses useEffect terminée avec succès.');
            })
            .catch(err => {
                // Gère les erreurs de register, ready, getSubscription, ou fetchPreferences
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
                // Ne pas mettre supportsNotifications à false ici, sauf si l'erreur est liée au support
            });
    }, [t, fetchPreferences]); // Dépendances useEffect

    // --- Fonction pour mettre à jour les préférences côté Backend ---
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
                 try { const errorData = await response.json(); errorMsg = errorData?.message || errorMsg; } catch(e){}
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

    // --- Gestionnaires de changement pour les checkboxes ---
    const handleTicketPrefChange = (event: React.ChangeEvent<HTMLInputElement>) => {
         const isChecked = event.target.checked;
         setNotifyTicketPref(isChecked);
         updateBackendPreferences({ ticket: isChecked, email: notifyEmailPref });
     };
     const handleEmailPrefChange = (event: React.ChangeEvent<HTMLInputElement>) => {
         const isChecked = event.target.checked;
         setNotifyEmailPref(isChecked);
         updateBackendPreferences({ ticket: notifyTicketPref, email: isChecked });
     };

    // --- Fonction pour s'abonner (globalement) ---
    const subscribeUser = useCallback(async () => {
        setIsMainLoading(true);
        setNotificationError(null);
        setMainNotificationButtonText(t("Parametre.Notifications.ActivationEnCours"));
        try {
            const registration = await navigator.serviceWorker.ready;
            const response = await fetch('http://localhost:3001/notifications/vapid-public-key');
            if (!response.ok) throw new Error('Impossible de récupérer la clé VAPID.');
            const keyData = await response.json(); // Récupérer comme JSON
            const vapidPublicKey = keyData?.publicKey;
            if (!vapidPublicKey) throw new Error('Clé VAPID reçue invalide.');

            const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
            const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
            console.log('User is subscribed (raw):', subscription);

            // Construire manuellement le payload pour correspondre au DTO
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

            // Envoyer le payload manuel au backend
            const subscribeResponse = await fetch('http://localhost:3001/notifications/subscribe', {
                method: 'POST',
                body: JSON.stringify(payloadToSend),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!subscribeResponse.ok) {
                await subscription.unsubscribe();
                let errorMsg = `Erreur serveur (${subscribeResponse.status})`;
                try { const errorData = await subscribeResponse.json(); errorMsg = errorData?.message || errorMsg; } catch(e){}
                throw new Error(`${t("Parametre.Notifications.ErreurSauvegardeAbonnement")} ${errorMsg}`);
            }

            // Succès
            console.log('Subscription saved on backend');
            setIsSubscribed(true);
            setMainNotificationButtonText(t("Parametre.Notifications.Desactiver"));
            setCurrentEndpoint(subscription.endpoint);
            setNotifyTicketPref(true); // Reset prefs locales aux défauts après nouvel abonnement
            setNotifyEmailPref(true);

        } catch (err: any) {
             console.error('Failed to subscribe the user: ', err);
             let message = t('Parametre.Notifications.ErreurActivation');
             if (err.name === 'NotAllowedError') message = t('Parametre.Notifications.PermissionRefusee');
             else if (err.message) message = err.message; // Afficher l'erreur spécifique
             setNotificationError(message);
             setIsSubscribed(false);
             setMainNotificationButtonText(t("Parametre.Notifications.Activer"));
             setCurrentEndpoint(null);
        } finally {
            setIsMainLoading(false);
        }
    }, [t]); // Retiré fetchPreferences et updateBackendPreferences des dépendances

    // --- Fonction pour se désabonner (globalement) ---
    const unsubscribeUser = useCallback(async () => {
        setIsMainLoading(true);
        setNotificationError(null);
        setMainNotificationButtonText(t("Parametre.Notifications.DesactivationEnCours"));
        try {
             const registration = await navigator.serviceWorker.ready;
             const subscription = await registration.pushManager.getSubscription();
             if (subscription) {
                 const endpointToDelete = subscription.endpoint; // Garder pour appel API
                 const unsubscribed = await subscription.unsubscribe();
                 if (unsubscribed) {
                     console.log('User is unsubscribed locally.');
                     setIsSubscribed(false);
                     setMainNotificationButtonText(t("Parametre.Notifications.Activer"));
                     setCurrentEndpoint(null);
                     setNotifyTicketPref(true); // Reset état local
                     setNotifyEmailPref(true);

                     // Optionnel mais recommandé: Notifier le backend
                     try {
                          const deleteResponse = await fetch('http://localhost:3001/notifications/unsubscribe', { // Endpoint à créer
                              method: 'POST',
                              body: JSON.stringify({ endpoint: endpointToDelete }),
                              headers: { 'Content-Type': 'application/json' },
                          });
                          if(deleteResponse.ok) { console.log("Subscription removed from backend."); }
                          else { console.warn("Failed to remove subscription from backend.", await deleteResponse.text()); }
                     } catch (backendDeleteError) { console.error("Error notifying backend of unsubscription:", backendDeleteError); }

                 } else { throw new Error(t("Parametre.Notifications.ErreurDesinscriptionLocale")); }
             } else {
                  console.log("Aucun abonnement à désinscrire.");
                  setIsSubscribed(false);
                  setMainNotificationButtonText(t("Parametre.Notifications.Activer"));
                  setCurrentEndpoint(null);
             }
        } catch (err: any) {
             console.error('Failed to unsubscribe the user: ', err);
             setNotificationError(err.message || t('Parametre.Notifications.ErreurDesactivation'));
             // Laisser le bouton sur "Désactiver" si erreur locale ?
             setMainNotificationButtonText(t("Parametre.Notifications.Desactiver"));
        } finally {
            setIsMainLoading(false);
        }
    }, [t]);

    // --- Gestionnaire clic bouton principal ---
    const handleNotificationButtonClick = () => {
        if (isSubscribed) { unsubscribeUser(); }
        else { subscribeUser(); }
    };

    // --- Rendu du composant ---
    return (
        <div className={styles.wrapper}>
            <button className={styles.parametres} onClick={() => setIsOpen(!isOpen)}> ☰ </button>
            {isOpen && (
                <div className={styles.menu}>
                    {/* Langue */}
                    <button onClick={() => setLang(lang === "fr" ? "en" : "fr")}>
                        {t("Parametre.SwitchLanguage")}
                    </button>

                    {/* Section Notifications */}
                    <hr className={styles.divider} />
                    <div className={styles.notificationSection}>
                        <h4>{t("Parametre.Notifications.Titre")}</h4>
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
                         ) : ( <p>{t("Parametre.Notifications.NonSupportees")}</p> )}
                         {notificationError && <p className={styles.errorMessage}>{notificationError}</p>}
                    </div>
                    <hr className={styles.divider} />

                    {/* Liens */}
                    <Link to="/credits"><button>{t("Parametre.Credits")}</button></Link>
                    <Link to="/"><button>{t("Parametre.BackToHome")}</button></Link>
                </div>
            )}
        </div>
    );
};

export default Parametres;