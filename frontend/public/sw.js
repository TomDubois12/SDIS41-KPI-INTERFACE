console.log('Service Worker running - v1.2'); // Version mise à jour

// Lors de l'installation du Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker v1.2 installed!');
    // Force le nouveau SW à devenir actif dès que possible
    event.waitUntil(self.skipWaiting());
});

// Lors de l'activation du Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker v1.2 activated!');
    // Prend le contrôle immédiat des clients (pages) ouverts
    event.waitUntil(self.clients.claim());
});

// Écoute de l'événement "push" (réception d'une notification du serveur)
self.addEventListener('push', function (event) {
    console.log('Push notification received', event);

    try {
        // Extrait les données envoyées par le backend
        const pushData = event.data ? event.data.json() : {};
        console.log('Notification data from backend:', pushData);

        // Définit les options pour l'affichage de la notification
        const title = pushData.title || 'Notification';
        const body = pushData.body || 'Vous avez une nouvelle notification !';
        const icon = pushData.icon || '/icons/icon-192x192.png';
        const badge = pushData.badge || '/icons/badge-72x72.png';
        const originalData = pushData.data || {};

        const options = {
            body: body,
            icon: icon,
            badge: badge,
            vibrate: [100, 50, 100],
            data: originalData
        };

        // Affiche la notification
        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (error) {
        console.error('Error processing push event:', error);
        event.waitUntil(self.registration.showNotification('Erreur Notification', { body: 'Impossible de traiter la notification reçue.' }));
    }
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', function (event) {
    console.log('Notification clicked', event);
    // Récupère les données associées à la notification
    const notificationData = event.notification.data;
    console.log('Notification data on click:', notificationData);
    // Extrait l'URL spécifique (pour les tickets) et le type d'email
    const urlToOpen = notificationData?.url;
    const emailType = notificationData?.emailType;

    // Ferme la notification sur laquelle l'utilisateur a cliqué
    event.notification.close();

    // Tente d'ouvrir/focaliser la fenêtre appropriée
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {

            // --- Priorité 1: Ouvrir l'URL spécifique si elle existe (Tickets) ---
            if (urlToOpen) {
                let clientFound = false;
                for (const client of clientList) {
                    try {
                        const clientUrl = new URL(client.url);
                        const targetUrl = new URL(urlToOpen, client.url); // Gère chemins relatifs/absolus
                        // Compare chemin et query params
                        if (clientUrl.pathname === targetUrl.pathname && clientUrl.search === targetUrl.search && 'focus' in client) {
                            console.log(`Fenêtre existante trouvée pour ${urlToOpen}. Mise au focus.`);
                            clientFound = true;
                            return client.focus(); // Met le focus sur l'onglet existant
                        }
                    } catch (e) { console.error("Erreur de comparaison d'URL pour urlToOpen:", e); }
                }
                if (!clientFound) {
                    console.log(`Ouverture nouvelle fenêtre vers ${urlToOpen}`);
                    return self.clients.openWindow(urlToOpen); // Ouvre l'URL spécifique
                }
            }
            // --- Priorité 2: Ouvrir la page spécifique aux alertes email si le type est connu ---
            else if (emailType) {
                let targetPath = '/'; // Chemin par défaut si type inconnu
                if (emailType === 'INPT') {
                    targetPath = '/alertes_inpt';
                } else if (emailType === 'Onduleur') {
                    targetPath = '/alertes_onduleurs';
                }
                console.log(`Type email détecté: ${emailType}. Cible: ${targetPath}`);

                let clientFound = false;
                for (const client of clientList) {
                    try {
                        const clientUrl = new URL(client.url);
                        // Compare uniquement le chemin pour les pages d'alertes générales
                        if (clientUrl.pathname === targetPath && 'focus' in client) {
                            console.log(`Fenêtre existante trouvée pour ${targetPath}. Mise au focus.`);
                            clientFound = true;
                            return client.focus();
                        }
                    } catch (e) { console.error("Erreur de comparaison d'URL pour emailType:", e); }
                }
                if (!clientFound) {
                    console.log(`Ouverture nouvelle fenêtre vers ${targetPath}`);
                    return self.clients.openWindow(targetPath); // Ouvre la page d'alerte correspondante
                }
            }
            // --- Priorité 3: Fallback - Focus ou ouvrir la racine ---
            else {
                if (clientList.length > 0) {
                    console.log("Aucune URL ou type email spécifique, mise au focus de la fenêtre existante.");
                    return clientList[0].focus(); // Met le focus sur le premier onglet trouvé
                }
                console.log("Aucune URL/type spécifique et aucune fenêtre ouverte, ouverture de '/'.");
                return self.clients.openWindow('/'); // Ouvre la page d'accueil
            }
        })
    );
});