// src/components/Parametres.tsx (VERSION FINALE COMPLÈTE)

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

    // --- États pour la gestion globale des notifications ---
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isMainLoading, setIsMainLoading] = useState(false);
    const [mainNotificationButtonText, setMainNotificationButtonText] = useState(t("Parametre.Notifications.Activer"));
    const [notificationError, setNotificationError] = useState<string | null>(null);
    const [supportsNotifications, setSupportsNotifications] = useState(true);
    const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);

    // --- États pour les préférences spécifiques ---
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
                 try { const errorData = await response.json(); errorMsg = errorData?.message || errorMsg; } catch(e) {}
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
            setNotifyTicketPref(true); setNotifyEmailPref(true); // Revenir aux défauts si erreur
        } finally {
            setIsPrefsLoading(false);
        }
    }, [t]);

    // --- Vérification initiale de l'abonnement et des préférences ---
     useEffect(() => {
         if (!('serviceWorker' in navigator && 'PushManager' in window)) {
             setSupportsNotifications(false);
             setMainNotificationButtonText(t("Parametre.Notifications.NonSupportees"));
             return;
         }
         setSupportsNotifications(true);

         navigator.serviceWorker.ready.then(registration => {
             registration.pushManager.getSubscription().then(subscription => {
                 if (subscription) {
                     setIsSubscribed(true);
                     setMainNotificationButtonText(t("Parametre.Notifications.Desactiver"));
                     setCurrentEndpoint(subscription.endpoint);
                     fetchPreferences(subscription.endpoint); // Charger les préférences
                 } else {
                     setIsSubscribed(false);
                     setMainNotificationButtonText(t("Parametre.Notifications.Activer"));
                     setCurrentEndpoint(null);
                     setNotifyTicketPref(true); setNotifyEmailPref(true); // Reset état local
                 }
             }).catch(err => {
                 console.error("Error getting subscription:", err);
                 setNotificationError(t("Parametre.Notifications.ErreurRecupAbonnement"));
                 setIsSubscribed(false);
                 setMainNotificationButtonText(t("Parametre.Notifications.Activer"));
                 setCurrentEndpoint(null);
             });
         }).catch(err => {
             console.error("Service worker not ready:", err);
             setNotificationError(t("Parametre.Notifications.ErreurSW"));
             setSupportsNotifications(false);
             setMainNotificationButtonText(t("Parametre.Notifications.ErreurSW"));
             setCurrentEndpoint(null);
         });
     }, [t, fetchPreferences]); // Dépendances de l'effet initial


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
             // Optionnel: Annuler changement local ? Pour l'instant, on affiche juste l'erreur.
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

    // --- Fonction pour s'abonner (globablement) ---
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

            // Construire manuellement le payload pour correspondre au DTO backend
            const p256dhKey = subscription.getKey('p256dh');
            const authKey = subscription.getKey('auth');
            if (!p256dhKey || !authKey) throw new Error("Impossible de récupérer les clés de l'abonnement.");

            const payloadToSend = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: arrayBufferToBase64Url(p256dhKey),
                    auth: arrayBufferToBase64Url(authKey)
                }
            };
            console.log('Payload envoyé (manuel):', JSON.stringify(payloadToSend));

            // Envoyer le payload manuel
            const subscribeResponse = await fetch('http://localhost:3001/notifications/subscribe', {
                method: 'POST',
                body: JSON.stringify(payloadToSend),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!subscribeResponse.ok) {
                await subscription.unsubscribe(); // Annuler localement si erreur backend
                let errorMsg = `Erreur serveur (${subscribeResponse.status})`;
                try { const errorData = await subscribeResponse.json(); errorMsg = errorData?.message || errorMsg; } catch(e){}
                throw new Error(`${t("Parametre.Notifications.ErreurSauvegardeAbonnement")} ${errorMsg}`);
            }

            // Succès
            console.log('Subscription saved on backend');
            setIsSubscribed(true);
            setMainNotificationButtonText(t("Parametre.Notifications.Desactiver"));
            setCurrentEndpoint(subscription.endpoint);
            setNotifyTicketPref(true); // Mettre à jour état local avec défauts
            setNotifyEmailPref(true);

        } catch (err: any) {
             console.error('Failed to subscribe the user: ', err);
             let message = t('Parametre.Notifications.ErreurActivation');
             if (err.name === 'NotAllowedError') message = t('Parametre.Notifications.PermissionRefusee');
             else if (err.message) message = err.message; // Utiliser le message d'erreur reçu
             setNotificationError(message);
             setIsSubscribed(false);
             setMainNotificationButtonText(t("Parametre.Notifications.Activer"));
             setCurrentEndpoint(null);
        } finally {
            setIsMainLoading(false);
        }
    }, [t]); // Retiré fetchPreferences des dépendances car non appelé ici

    // --- Fonction pour se désabonner (globalement) ---
    const unsubscribeUser = useCallback(async () => {
        setIsMainLoading(true);
        setNotificationError(null);
        setMainNotificationButtonText(t("Parametre.Notifications.DesactivationEnCours"));
        try {
             const registration = await navigator.serviceWorker.ready;
             const subscription = await registration.pushManager.getSubscription();
             if (subscription) {
                 const endpointToDelete = subscription.endpoint;
                 const unsubscribed = await subscription.unsubscribe();
                 if (unsubscribed) {
                     console.log('User is unsubscribed locally.');
                     setIsSubscribed(false);
                     setMainNotificationButtonText(t("Parametre.Notifications.Activer"));
                     setCurrentEndpoint(null);
                     setNotifyTicketPref(true); setNotifyEmailPref(true); // Reset état local

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
             // Si erreur pendant désabonnement, l'état peut être incohérent.
             // Laisser le bouton sur "Désactiver" pour permettre de réessayer ?
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
                                             <input
                                                 type="checkbox"
                                                 checked={notifyTicketPref}
                                                 onChange={handleTicketPrefChange}
                                                 disabled={isPrefsLoading || isMainLoading} // Désactiver aussi pendant chargement principal
                                             />
                                             {t("Parametre.Notifications.PrefTickets")}
                                         </label>
                                         <label className={isPrefsLoading || isMainLoading ? styles.disabledLabel : ''}>
                                             <input
                                                 type="checkbox"
                                                 checked={notifyEmailPref}
                                                 onChange={handleEmailPrefChange}
                                                 disabled={isPrefsLoading || isMainLoading}
                                             />
                                             {t("Parametre.Notifications.PrefEmails")}
                                         </label>
                                     </div>
                                 )}
                             </>
                         ) : (
                             <p>{t("Parametre.Notifications.NonSupportees")}</p>
                         )}
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