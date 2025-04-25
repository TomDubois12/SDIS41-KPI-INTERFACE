// Dans sw.js
console.log('Service Worker running - v1.0'); // Ajoutez une version pour suivre les mises à jour

// Lors de l'installation du Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker installed!');
    self.skipWaiting(); // Force l'activation immédiate
});

// Lors de l'activation du Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker activated!');
    // Prendre le contrôle de toutes les pages clients sans recharger
    event.waitUntil(self.clients.claim());
});

// Écoute de l'événement "push"
self.addEventListener('push', function (event) {
    console.log('Push notification received', event);

    try {
        const data = event.data ? event.data.json() : {};
        console.log('Notification data:', data);
        
        const title = data.title || 'Notification';
        const body = data.body || 'You have a new notification!';
        const icon = data.icon || '/icons/icon-192x192.png'; 
        const badge = data.badge || '/icons/badge-72x72.png';

        const options = {
            body: body,
            icon: icon,
            badge: badge,
            vibrate: [100, 50, 100], // Vibration pattern
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            },
        };

        // Affichage de la notification
        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (error) {
        console.error('Error showing notification:', error);
    }
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', function(event) {
    console.log('Notification clicked', event);
    
    event.notification.close();
    
    // Ouvrir la fenêtre appropriée ou mettre le focus sur la fenêtre existante
    event.waitUntil(
        self.clients.matchAll({type: 'window'}).then(clientList => {
            // Si une fenêtre est déjà ouverte, mettre le focus dessus
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            // Sinon, ouvrir une nouvelle fenêtre
            return self.clients.openWindow('/');
        })
    );
});