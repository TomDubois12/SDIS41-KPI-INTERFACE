import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { Subscription } from './entities/subscription.entity';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name); // Créez une instance de Logger
    
    constructor(private readonly subscriptionRepository: SubscriptionRepository) {
        // Generate VAPID keys if necessary
        // In a production app, you'd typically store these in environment variables
        const vapidKeys = webpush.generateVAPIDKeys(); // Fixed case to uppercase VAPID
        console.log('Clé publique VAPID :', vapidKeys.publicKey);
        console.log('Clé privée VAPID :', vapidKeys.privateKey);
        
        webpush.setVapidDetails(
            'mailto:tom.dubois@sdis41.fr', // Use mailto: prefix for email
            vapidKeys.publicKey,
            vapidKeys.privateKey,
        );
        // TODO: Persister ces clés en production
    }

    async subscribeUser(endpoint: string, p256dh: string, auth: string, userId: number | null): Promise<Subscription> {
        // Vérifiez si l'abonnement existe déjà
        const existingSubscription = await this.subscriptionRepository.findOneByEndpoint(endpoint);
        if (existingSubscription) {
            // L'abonnement existe déjà, vous pouvez choisir de le mettre à jour ou de le retourner tel quel
            console.log('Abonnement existant :', existingSubscription.id);
            return existingSubscription;
        }
        return await this.subscriptionRepository.saveSubscription(endpoint, p256dh, auth, userId);
    }

    async getAllSubscriptions(): Promise<Subscription[]> {
        return this.subscriptionRepository.find();
    }

    async sendPushNotification(subscription: Subscription, payload: string): Promise<boolean> {
        try {
            const pushSubscription: webpush.PushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                },
            };

            await webpush.sendNotification(pushSubscription, payload);
            this.logger.log(`Notification envoyée à ${subscription.endpoint}`);
            return true;
        } catch (error) {
            this.logger.error(`Erreur lors de l'envoi de la notification à ${subscription.endpoint}`, error.stack);
            return false;
        }
    }

    // ... autres méthodes pour envoyer des notifications viendront ici ...
}