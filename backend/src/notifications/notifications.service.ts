import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

import { SubscriptionRepository } from './repositories/subscription.repository';
import { Subscription } from './entities/subscription.entity';
import { TicketService } from '../ticket/ticket.service';

interface SubscriptionPreferences {
    notifyOnTicket?: boolean;
    notifyOnEmail?: boolean;
}

export interface CurrentPreferences {
    notifyOnTicket: boolean;
    notifyOnEmail: boolean;
}

@Injectable()
export class NotificationService implements OnModuleInit {
    private readonly logger = new Logger(NotificationService.name);
    private vapidPublicKey: string;
    private vapidPrivateKey: string;
    private previousTickets: any[] = [];

    constructor(
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => TicketService))
        private readonly ticketService: TicketService,
    ) {
        this.vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY') as string;
        this.vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY') as string;
        if (!this.vapidPublicKey || !this.vapidPrivateKey) {
            this.logger.error('Clés VAPID non trouvées dans les variables d\'environnement !');
        } else {
            this.logger.log('Clés VAPID chargées.');
            try {
                webpush.setVapidDetails(
                    this.configService.get<string>('VAPID_MAILTO', 'mailto:votre-email@example.com'),
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
        this.logger.log('NotificationService Module Initialized. Démarrage surveillance tickets...');
        await this.startMonitoring();
    }

    private formatOperatorName(operatorName: string | null | undefined): string {
        if (!operatorName) {
            if (operatorName === 'Envoyé depuis un mail') return operatorName;
            return 'Inconnu';
        }
        const parts = operatorName.split('\\');
        let namePart = parts[parts.length - 1];
        if (namePart.includes('.') || namePart.includes('-')) {
            namePart = namePart.replace(/[.-]/g, ' ');
        }
        const capitalize = (str: string): string => str.replace(/\b(?!(?:d'|l'))\w/g, (char) => char.toUpperCase());
        return capitalize(namePart.trim());
    }

    async subscribeUser(endpoint: string, p256dh: string, auth: string, userId: number | null): Promise<Subscription> {
        const shortEndpoint = endpoint.substring(0, 40) + '...';
        let subscription = await this.subscriptionRepository.findOneByEndpoint(endpoint);

        if (subscription) {
            this.logger.log(`[subscribeUser] Abonnement existant trouvé pour ${shortEndpoint} ID: ${subscription.id}. Vérification MàJ.`);
            let needsSave = false;
            if (subscription.p256dh !== p256dh) {
                subscription.p256dh = p256dh;
                needsSave = true;
                this.logger.log(`[subscribeUser] Clé p256dh différente détectée pour ${shortEndpoint}`);
            }
            if (subscription.auth !== auth) {
                subscription.auth = auth;
                needsSave = true;
                this.logger.log(`[subscribeUser] Clé auth différente détectée pour ${shortEndpoint}`);
            }
            if (userId !== null && subscription.userId !== userId) {
                subscription.userId = userId;
                needsSave = true;
                this.logger.log(`[subscribeUser] UserId différent détecté pour ${shortEndpoint}`);
            }

            if (needsSave) {
                this.logger.log(`[subscribeUser] Tentative de sauvegarde (update) pour l'abonnement ID: ${subscription.id}. Données: ${JSON.stringify(subscription)}`);
                try {
                    const savedSubscription = await this.subscriptionRepository.save(subscription);
                    this.logger.log(`[subscribeUser] Abonnement ID: ${subscription.id} mis à jour et sauvegardé avec succès.`);
                    return savedSubscription;
                } catch (error) {
                    this.logger.error(`[subscribeUser] ERREUR lors de la sauvegarde (update) de l'abonnement ID: ${subscription.id}`, error instanceof Error ? error.stack : error);
                    throw error;
                }
            } else {
                this.logger.log(`[subscribeUser] Aucune mise à jour nécessaire pour l'abonnement ID: ${subscription.id}.`);
                return subscription;
            }
        } else {
            this.logger.log(`[subscribeUser] Aucun abonnement existant trouvé pour ${shortEndpoint}. Création...`);
            try {
                const newSubscription = await this.subscriptionRepository.saveSubscription(endpoint, p256dh, auth, userId);
                this.logger.log(`[subscribeUser] Nouvel abonnement créé : ${newSubscription.id}`);
                return newSubscription;
            } catch (error) {
                this.logger.error(`[subscribeUser] ERREUR lors de la création du nouvel abonnement pour ${shortEndpoint}`, error instanceof Error ? error.stack : error);
                throw error;
            }
        }
    }

    async updatePreferences(endpoint: string, preferences: SubscriptionPreferences): Promise<boolean> {
        const shortEndpoint = endpoint.substring(0, 40) + '...';
        this.logger.log(`Mise à jour préférences demandée pour endpoint: ${shortEndpoint} avec ${JSON.stringify(preferences)}`);
        const updated = await this.subscriptionRepository.updatePreferencesByEndpoint(endpoint, preferences);
        if (!updated) {
            this.logger.warn(`Aucun abonnement trouvé pour l'endpoint ${shortEndpoint} lors MàJ préférences.`);
        } else {
            this.logger.log(`Préférences MàJ (ou identiques) pour endpoint: ${shortEndpoint}`);
        }
        return updated;
    }

    async getAllSubscriptions(): Promise<Subscription[]> {
        return this.subscriptionRepository.find();
    }

    async getTicketSubscribers(): Promise<Subscription[]> {
        this.logger.debug('Récupération des abonnés aux tickets...');
        return this.subscriptionRepository.findTicketSubscribers();
    }

    async getEmailSubscribers(): Promise<Subscription[]> {
        this.logger.debug('Récupération des abonnés aux emails...');
        return this.subscriptionRepository.findEmailSubscribers();
    }

    async getPreferencesByEndpoint(endpoint: string): Promise<CurrentPreferences | null> {
        const shortEndpoint = endpoint.substring(0, 40) + '...';
        this.logger.debug(`Recherche des préférences pour endpoint: ${shortEndpoint}`);
        const subscription = await this.subscriptionRepository.findOneByEndpoint(endpoint);

        if (!subscription) {
            this.logger.warn(`Aucun abonnement trouvé pour l'endpoint lors de getPreferencesByEndpoint: ${shortEndpoint}`);
            return null;
        }
        return {
            notifyOnTicket: subscription.notifyOnTicket,
            notifyOnEmail: subscription.notifyOnEmail,
        };
    }

    async sendPushNotification(subscription: Subscription, payload: string): Promise<boolean> {
        const shortEndpoint = subscription.endpoint.substring(0, 40) + '...';
        try {
            const pushSubscription: webpush.PushSubscription = {
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            };
            await webpush.sendNotification(pushSubscription, payload);
            this.logger.log(`[sendPushNotification] Succès vers ${shortEndpoint}`);
            return true;
        } catch (error: any) {
            this.logger.error(`[sendPushNotification] Échec vers ${shortEndpoint}`, error.message);
            if (error.statusCode === 404 || error.statusCode === 410) {
                this.logger.warn(`[sendPushNotification] Suppression abonnement expiré ${subscription.id} (Endpoint: ${shortEndpoint})`);
                try {
                    await this.subscriptionRepository.delete(subscription.id);
                    this.logger.log(`[sendPushNotification] Abonnement ${subscription.id} supprimé.`);
                } catch (deleteError: any) {
                    this.logger.error(`[sendPushNotification] Erreur suppression abonnement ${subscription.id}: ${deleteError.message}`);
                }
            } else {
                this.logger.error(`[sendPushNotification] Détails erreur non gérée pour ${shortEndpoint}: Status=${error.statusCode}, Body=${error.body}`);
            }
            return false;
        }
    }

    getPublicKey(): string {
        return this.vapidPublicKey;
    }

    async getCurrentTickets(): Promise<any[]> {
        try {
            const todayDate = new Date().toISOString().slice(0, 10);
            const tickets = await this.ticketService.getTickets(todayDate);
            return Array.isArray(tickets) ? tickets : [];
        } catch (error) {
            this.logger.error('[getCurrentTickets] Erreur fetching tickets via TicketService:', error);
            return [];
        }
    }

    async checkForNewTicket() {
        const currentTickets = await this.getCurrentTickets();
        const previousTicketIds = this.previousTickets.map(t => t?.TicketId);

        if (currentTickets.length > this.previousTickets.length) {
            const newTickets = currentTickets.filter(
                (ticket) => ticket?.TicketId && !previousTicketIds.includes(ticket.TicketId)
            );

            if (newTickets.length > 0) {
                this.logger.log(`[checkForNewTicket] ${newTickets.length} new ticket(s) IDENTIFIED: IDs=[${newTickets.map(t => t.TicketId).join(', ')}]`);

                const subscriptions = await this.getTicketSubscribers();
                this.logger.log(`[checkForNewTicket] Found ${subscriptions.length} subscribers for ticket notifications.`);

                if (subscriptions.length > 0) {
                    for (const newTicket of newTickets) {
                        this.logger.log(`[checkForNewTicket] Processing new ticket ID=${newTicket.TicketId}`);
                        const formattedCallerName = this.formatOperatorName(newTicket.CallerName);
                        const title = newTicket.Title || 'Sans titre';
                        const payload = JSON.stringify({
                            title: 'Nouveau ticket !',
                            body: `Ticket ${newTicket.TicketId} \nSujet : ${title.substring(0, 100)} \npar ${formattedCallerName}.`,
                            data: { url: `/clarilog_detail?id=${newTicket.TicketId}` }
                        });

                        this.logger.log(`[checkForNewTicket] Sending ticket notification ID=${newTicket.TicketId} to ${subscriptions.length} subscribers.`);
                        await Promise.allSettled(
                            subscriptions.map(sub => this.sendPushNotification(sub, payload))
                        );
                        this.logger.log(`[checkForNewTicket] Finished sending attempt for Ticket ID=${newTicket.TicketId}.`);
                    }
                } else {
                    this.logger.log(`[checkForNewTicket] No active subscribers found for ticket notifications.`);
                }
            }
        }
        this.previousTickets = [...currentTickets];
    }

    @Cron(CronExpression.EVERY_5_SECONDS)
    async monitoringTask() {
        await this.checkForNewTicket();
    }

    async startMonitoring() {
        this.logger.log('[startMonitoring] Initializing previous tickets state...');
        this.previousTickets = await this.getCurrentTickets();
        this.logger.log(`[startMonitoring] Initialized previousTickets with ${this.previousTickets.length} tickets.`);
        this.logger.log('[startMonitoring] Monitoring task scheduled.');
    }

    async cleanupExpiredSubscriptions(): Promise<number> {
        this.logger.log('[cleanupExpiredSubscriptions] Starting cleanup task...');
        const subscriptions = await this.getAllSubscriptions();
        let removedCount = 0;
        for (const subscription of subscriptions) {
            try {
                const pushSubscription: webpush.PushSubscription = { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } };
                await webpush.sendNotification(pushSubscription, JSON.stringify({ type: 'ping' }));
            } catch (error: any) {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    this.logger.warn(`[cleanup] Found expired subscription: ${subscription.id}. Deleting.`);
                    try {
                        await this.subscriptionRepository.delete(subscription.id);
                        removedCount++;
                    }
                    catch (deleteError: any) {
                        this.logger.error(`[cleanup] Error deleting ${subscription.id}: ${deleteError.message}`);
                    }
                }
            }
        }
        this.logger.log(`[cleanupExpiredSubscriptions] Cleanup finished: ${removedCount} subscriptions removed.`);
        return removedCount;
    }

    async handleUnsubscribe(endpoint: string): Promise<boolean> {
        const shortEndpoint = endpoint.substring(0, 40) + '...';
        this.logger.log(`[handleUnsubscribe] Demande de suppression reçue pour ${shortEndpoint}`);
        try {
            const deleted = await this.subscriptionRepository.deleteByEndpoint(endpoint);
            if (deleted) {
                this.logger.log(`[handleUnsubscribe] Abonnement pour ${shortEndpoint} supprimé de la base de données.`);
            } else {
                this.logger.warn(`[handleUnsubscribe] Aucun abonnement trouvé à supprimer pour ${shortEndpoint}.`);
            }
            return deleted;
        } catch (error) {
            this.logger.error(`[handleUnsubscribe] Erreur lors de la suppression de l'abonnement pour ${shortEndpoint}`, error);
            return false;
        }
    }
}