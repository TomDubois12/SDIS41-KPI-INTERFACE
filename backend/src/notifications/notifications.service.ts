import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

import { SubscriptionRepository } from './repositories/subscription.repository';
import { Subscription } from './entities/subscription.entity';
import { TicketService } from '../ticket/ticket.service'; // Ajustez le chemin si nécessaire

@Injectable()
export class NotificationService implements OnModuleInit {
    private readonly logger = new Logger(NotificationService.name);
    private vapidPublicKey: string;
    private vapidPrivateKey: string;
    private previousTickets: any[] = []; // Stockage en mémoire

    constructor(
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => TicketService))
        private readonly ticketService: TicketService,
    ) {
        // Récupérer les clés VAPID
        this.vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY') as string;
        this.vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY') as string;

        if (!this.vapidPublicKey || !this.vapidPrivateKey) {
            this.logger.error('Clés VAPID non trouvées...');
            // Gérer l'erreur comme avant
        } else {
            this.logger.log('Clés VAPID chargées.');
            try {
                webpush.setVapidDetails(
                    this.configService.get<string>('VAPID_MAILTO', 'mailto:tom.dubois@sdis41.fr'), // Email par défaut si non configuré
                    this.vapidPublicKey,
                    this.vapidPrivateKey,
                );
                this.logger.log('Web-push configuré.');
            } catch (error) {
                this.logger.error('Erreur config web-push', error);
            }
        }
    }

    async onModuleInit() {
        this.logger.log('NotificationService Module Initialized. Starting monitoring...');
        await this.startMonitoring();
    }

    // --- Méthode privée pour formater le nom ---
    private formatOperatorName(operatorName: string | null | undefined): string {
        if (!operatorName) {
            // Gérer le cas 'Envoyé depuis un mail' ou autre nom non standard
             if (operatorName === 'Envoyé depuis un mail') return operatorName;
            return 'Inconnu'; // Retourner 'Inconnu' ou une chaîne vide si null/undefined/vide
        }

        // Logique copiée depuis le frontend
        const parts = operatorName.split('\\');
        // Si le format est DOMAIN\user.name ou user.name
         let namePart = parts[parts.length - 1]; // Prendre la dernière partie (ou la seule si pas de \)

        // Remplacer . et - par des espaces
        if (namePart.includes('.') || namePart.includes('-')) {
             namePart = namePart.replace(/[.-]/g, ' ');
        }

        // Mettre en majuscule la première lettre de chaque mot
        const capitalize = (str: string): string => {
             // Gérer les cas comme 'd'' ou 'l'' pour ne pas les mettre en majuscule (optionnel)
             return str.replace(/\b(?!(?:d'|l'))\w/g, (char) => char.toUpperCase());
             // Version simple : return str.replace(/\b\w/g, (char) => char.toUpperCase());
        };

        return capitalize(namePart.trim()); // trim() pour enlever les espaces superflus
    }
    // --- Fin méthode formatOperatorName ---


    async subscribeUser(endpoint: string, p256dh: string, auth: string, userId: number | null): Promise<Subscription> {
        const existingSubscription = await this.subscriptionRepository.findOneByEndpoint(endpoint);
        if (existingSubscription) {
            this.logger.log(`Abonnement existant trouvé : ${existingSubscription.id}`);
            return existingSubscription;
        }
        const newSubscription = await this.subscriptionRepository.saveSubscription(endpoint, p256dh, auth, userId);
        this.logger.log(`Nouvel abonnement créé : ${newSubscription.id}`);
        return newSubscription;
    }

    async getAllSubscriptions(): Promise<Subscription[]> {
        const subscriptions = await this.subscriptionRepository.find();
        // this.logger.log(`[getAllSubscriptions] Found ${subscriptions.length} subscriptions.`); // Log de debug retiré/commenté
        return subscriptions;
    }

    async sendPushNotification(subscription: Subscription, payload: string): Promise<boolean> {
        const shortEndpoint = subscription.endpoint.substring(0, 40) + '...';
        try {
            const pushSubscription: webpush.PushSubscription = {
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            };
            // this.logger.log(`[sendPushNotification] Attempting to send notification to ${shortEndpoint}`); // Log de debug retiré/commenté
            await webpush.sendNotification(pushSubscription, payload);
            this.logger.log(`[sendPushNotification] Notification envoyée avec succès à ${shortEndpoint}`);
            return true;
        } catch (error: any) {
            this.logger.error(`[sendPushNotification] Erreur lors de l'envoi à ${shortEndpoint}`, error.message);
            if (error.statusCode === 404 || error.statusCode === 410) {
                this.logger.warn(`[sendPushNotification] Abonnement expiré/invalide détecté pour ${shortEndpoint}. Suppression...`);
                try {
                    await this.subscriptionRepository.delete(subscription.id);
                    this.logger.log(`[sendPushNotification] Abonnement ${subscription.id} (Endpoint: ${shortEndpoint}) supprimé.`);
                } catch (deleteError: any) {
                    this.logger.error(`[sendPushNotification] Erreur suppression abonnement ${subscription.id}: ${deleteError.message}`);
                }
            } else {
                 this.logger.error(`[sendPushNotification] Détails erreur pour ${shortEndpoint}: Status=${error.statusCode}, Body=${error.body}`);
            }
            return false;
        }
    }

    getPublicKey(): string {
        return this.vapidPublicKey;
    }

    async cleanupExpiredSubscriptions(): Promise<number> {
        // Logique inchangée... (peut être retirée si non utilisée)
        this.logger.log('[cleanupExpiredSubscriptions] Starting cleanup task...');
        const subscriptions = await this.getAllSubscriptions();
        let removedCount = 0;
        for (const subscription of subscriptions) {
             try { /* ... */ } catch (error: any) { /* ... */ }
        }
        this.logger.log(`[cleanupExpiredSubscriptions] Cleanup finished: ${removedCount} subscriptions removed.`);
        return removedCount;
    }

    async getCurrentTickets(): Promise<any[]> {
        try {
            const todayDate = new Date().toISOString().slice(0, 10);
            // this.logger.log(`[getCurrentTickets] Fetching tickets for date: ${todayDate}`); // Log de debug retiré/commenté
            const tickets = await this.ticketService.getTickets(todayDate);
            // this.logger.log(`[getCurrentTickets] Fetched ${tickets?.length ?? 0} tickets.`); // Log de debug retiré/commenté
            return Array.isArray(tickets) ? tickets : [];
        } catch (error) {
            this.logger.error('[getCurrentTickets] Error fetching tickets:', error);
            return [];
        }
    }

    async checkForNewTicket() {
        // Retirer les logs de debug détaillés maintenant que le problème de doublon est résolu
        // this.logger.log('--- [checkForNewTicket] START ---');
        const currentTickets = await this.getCurrentTickets();
        const previousTicketIds = this.previousTickets.map(t => t?.TicketId);

        if (currentTickets.length > this.previousTickets.length) {
            const newTickets = currentTickets.filter(
                (ticket) => ticket?.TicketId && !previousTicketIds.includes(ticket.TicketId)
            );

            if (newTickets.length > 0) {
                this.logger.log(`[checkForNewTicket] ${newTickets.length} new ticket(s) IDENTIFIED: IDs=[${newTickets.map(t => t.TicketId).join(', ')}]`);

                for (const newTicket of newTickets) {
                    this.logger.log(`[checkForNewTicket] Processing new ticket ID=${newTicket.TicketId}`);

                    // --- Appel de la fonction de formatage ---
                    const formattedCallerName = this.formatOperatorName(newTicket.CallerName);
                    // --- Fin Appel ---

                    const title = newTicket.Title || 'Sans titre'; // Fallback pour le titre

                    const payload = JSON.stringify({
                        title: 'Nouveau ticket !',
                        // --- Utilisation du nom formaté dans le corps ---
                        body: `Ticket ${newTicket.TicketId} ${title.substring(0, 100)} par ${formattedCallerName}.`,
                        // Optionnel: ajouter une action ou une URL
                        data: { url: `/clarilog_detail?id=${newTicket.TicketId}` } // Pour ouvrir le ticket au clic
                    });

                    const subscriptions = await this.getAllSubscriptions();
                    this.logger.log(`[checkForNewTicket] Found ${subscriptions.length} subscriptions to notify for Ticket ID=${newTicket.TicketId}.`);

                    let successCount = 0;
                    for (const sub of subscriptions) {
                        // this.logger.log(`[checkForNewTicket] SENDING notification for Ticket ID=${newTicket.TicketId} ...`); // Log moins verbeux
                        const success = await this.sendPushNotification(sub, payload);
                        if(success) successCount++;
                    }
                        this.logger.log(`[checkForNewTicket] Finished sending for Ticket ID=${newTicket.TicketId}. Success count: ${successCount}/${subscriptions.length}`);
                }
            }
        }
        // Toujours mettre à jour previousTickets
        this.previousTickets = [...currentTickets];
         // this.logger.log('--- [checkForNewTicket] END ---');
    }

    @Cron(CronExpression.EVERY_5_SECONDS)
    async monitoringTask() {
         // Retirer les logs de début/fin de tâche si plus nécessaires
         // this.logger.log('====== [monitoringTask] RUNNING ======');
        await this.checkForNewTicket();
         // this.logger.log('====== [monitoringTask] FINISHED ======');
    }

    async startMonitoring() {
        this.logger.log('[startMonitoring] Initializing previous tickets state...');
        this.previousTickets = await this.getCurrentTickets();
        this.logger.log(`[startMonitoring] Initialized previousTickets with ${this.previousTickets.length} tickets.`);
        this.logger.log('[startMonitoring] Monitoring task is now scheduled to run.');
    }
}