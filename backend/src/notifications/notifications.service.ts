import { Injectable, Logger, OnModuleInit, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

import { SubscriptionRepository } from './repositories/subscription.repository';
import { Subscription } from './entities/subscription.entity';
import { TicketService } from '../ticket/ticket.service'; // Ajustez le chemin si nécessaire

// Interface pour clarifier les préférences passées au repo (usage interne)
interface SubscriptionPreferences {
    notifyOnTicket?: boolean;
    notifyOnEmail?: boolean;
}

// Interface exportée pour le type de retour des préférences
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
        // --- Configuration VAPID ---
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

    // Méthode privée pour formater le nom d'opérateur/demandeur
    private formatOperatorName(operatorName: string | null | undefined): string {
       if (!operatorName) {
           if (operatorName === 'Envoyé depuis un mail') return operatorName; // Cas spécifique
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

    /** Enregistre un nouvel abonnement ou retourne l'existant. Utilise les préférences par défaut. */
    async subscribeUser(endpoint: string, p256dh: string, auth: string, userId: number | null): Promise<Subscription> {
        const shortEndpoint = endpoint.substring(0, 40) + '...';
        // Utiliser let car on peut réassigner après la sauvegarde de mise à jour
        let subscription = await this.subscriptionRepository.findOneByEndpoint(endpoint);

        if (subscription) {
            // Abonnement trouvé
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
                 // --- LOG AJOUTÉ AVANT SAUVEGARDE (UPDATE) ---
                 this.logger.log(`[subscribeUser] Tentative de sauvegarde (update) pour l'abonnement ID: ${subscription.id}. Données: ${JSON.stringify(subscription)}`);
                 try {
                     // Utiliser la méthode save publique du repository qui appelle repository.save de TypeORM
                     const savedSubscription = await this.subscriptionRepository.save(subscription);
                     // --- LOG AJOUTÉ APRÈS SAUVEGARDE (UPDATE) ---
                     this.logger.log(`[subscribeUser] Abonnement ID: ${subscription.id} mis à jour et sauvegardé avec succès.`);
                     return savedSubscription; // Retourner l'entité sauvegardée/mise à jour
                 } catch (error) {
                      // --- LOG DÉTAILLÉ DE L'ERREUR DE SAUVEGARDE ---
                      this.logger.error(`[subscribeUser] ERREUR lors de la sauvegarde (update) de l'abonnement ID: ${subscription.id}`, error instanceof Error ? error.stack : error);
                      // Renvoyer l'erreur pour qu'elle soit traitée par NestJS (probablement en 500)
                      throw error;
                 }
            } else {
                this.logger.log(`[subscribeUser] Aucune mise à jour nécessaire pour l'abonnement ID: ${subscription.id}.`);
                return subscription; // Retourner l'abonnement existant non modifié
            }
        } else {
            // Créer un nouvel abonnement
            this.logger.log(`[subscribeUser] Aucun abonnement existant trouvé pour ${shortEndpoint}. Création...`);
            try {
                 // Utiliser saveSubscription du repo pour la création
                 const newSubscription = await this.subscriptionRepository.saveSubscription(endpoint, p256dh, auth, userId);
                 this.logger.log(`[subscribeUser] Nouvel abonnement créé : ${newSubscription.id}`);
                 return newSubscription;
            } catch (error) {
                 // --- LOG DÉTAILLÉ DE L'ERREUR DE CRÉATION ---
                 this.logger.error(`[subscribeUser] ERREUR lors de la création du nouvel abonnement pour ${shortEndpoint}`, error instanceof Error ? error.stack : error);
                 throw error; // Renvoyer l'erreur
            }
        }
    }

    /** Met à jour les préférences pour un abonnement donné via son endpoint. */
    async updatePreferences(endpoint: string, preferences: SubscriptionPreferences): Promise<boolean> {
         const shortEndpoint = endpoint.substring(0,40) + '...';
         this.logger.log(`Mise à jour préférences demandée pour endpoint: ${shortEndpoint} avec ${JSON.stringify(preferences)}`);
         // La méthode du repo retourne true si l'abonnement est trouvé (MàJ effectuée ou non nécessaire)
         const updated = await this.subscriptionRepository.updatePreferencesByEndpoint(endpoint, preferences);
         if (!updated) {
              this.logger.warn(`Aucun abonnement trouvé pour l'endpoint ${shortEndpoint} lors MàJ préférences.`);
         } else {
              this.logger.log(`Préférences MàJ (ou identiques) pour endpoint: ${shortEndpoint}`);
         }
         return updated;
    }

    /** Récupère TOUS les abonnements actifs (pour admin, cleanup, etc.) */
    async getAllSubscriptions(): Promise<Subscription[]> {
        return this.subscriptionRepository.find();
    }

    /** Récupère les abonnements souhaitant les notifications TICKET */
    async getTicketSubscribers(): Promise<Subscription[]> {
        this.logger.debug('Récupération des abonnés aux tickets...');
        return this.subscriptionRepository.findTicketSubscribers();
    }

    /** Récupère les abonnements souhaitant les notifications EMAIL */
    async getEmailSubscribers(): Promise<Subscription[]> {
        this.logger.debug('Récupération des abonnés aux emails...');
        return this.subscriptionRepository.findEmailSubscribers();
    }

    /** Récupère les préférences actuelles pour un abonnement spécifique. */
    async getPreferencesByEndpoint(endpoint: string): Promise<CurrentPreferences | null> {
        const shortEndpoint = endpoint.substring(0, 40) + '...';
        this.logger.debug(`Recherche des préférences pour endpoint: ${shortEndpoint}`);
        const subscription = await this.subscriptionRepository.findOneByEndpoint(endpoint);

        if (!subscription) {
            this.logger.warn(`Aucun abonnement trouvé pour l'endpoint lors de getPreferencesByEndpoint: ${shortEndpoint}`);
            return null;
        }
        // Retourne l'objet correspondant à l'interface CurrentPreferences
        return {
            notifyOnTicket: subscription.notifyOnTicket,
            notifyOnEmail: subscription.notifyOnEmail,
        };
    }

    /** Envoi la notification push et gère les erreurs (suppression si expiré). */
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

    /** Retourne la clé publique VAPID. */
    getPublicKey(): string {
        return this.vapidPublicKey;
    }

    // --- Surveillance Tickets ---
    /** Récupère les tickets du jour via TicketService */
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

    /** Vérifie s'il y a de nouveaux tickets et notifie les abonnés concernés. */
    async checkForNewTicket() {
        const currentTickets = await this.getCurrentTickets();
        const previousTicketIds = this.previousTickets.map(t => t?.TicketId);

        if (currentTickets.length > this.previousTickets.length) {
            const newTickets = currentTickets.filter(
                (ticket) => ticket?.TicketId && !previousTicketIds.includes(ticket.TicketId)
            );

            if (newTickets.length > 0) {
                this.logger.log(`[checkForNewTicket] ${newTickets.length} new ticket(s) IDENTIFIED: IDs=[${newTickets.map(t => t.TicketId).join(', ')}]`);

                // Récupérer UNIQUEMENT les abonnés aux tickets
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
                         // Envoyer à tous les abonnés concernés (parallélisation possible)
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
        // Toujours mettre à jour la liste précédente
        this.previousTickets = [...currentTickets];
    }

    /** Tâche Cron pour vérifier les tickets */
    @Cron(CronExpression.EVERY_5_SECONDS)
    async monitoringTask() {
        await this.checkForNewTicket();
    }

    /** Initialisation de la surveillance */
    async startMonitoring() {
        this.logger.log('[startMonitoring] Initializing previous tickets state...');
        this.previousTickets = await this.getCurrentTickets();
        this.logger.log(`[startMonitoring] Initialized previousTickets with ${this.previousTickets.length} tickets.`);
        this.logger.log('[startMonitoring] Monitoring task scheduled.');
    }

    /** Nettoyage des abonnements expirés */
    async cleanupExpiredSubscriptions(): Promise<number> {
        this.logger.log('[cleanupExpiredSubscriptions] Starting cleanup task...');
        const subscriptions = await this.getAllSubscriptions();
        let removedCount = 0;
        for (const subscription of subscriptions) {
             try {
                 const pushSubscription: webpush.PushSubscription = { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } };
                 // Ping silencieux pour tester la validité
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

    // --- NOUVELLE MÉTHODE POUR GÉRER LA DÉSINSCRIPTION ---
    /**
     * Gère une demande de désinscription provenant du frontend.
     * Tente de supprimer l'abonnement correspondant de la base de données.
     * @param endpoint L'endpoint unique de l'abonnement à supprimer.
     * @returns boolean Indique si une suppression a été tentée (true si trouvé et supprimé, false si non trouvé).
     */
    async handleUnsubscribe(endpoint: string): Promise<boolean> {
        const shortEndpoint = endpoint.substring(0, 40) + '...';
        this.logger.log(`[handleUnsubscribe] Demande de suppression reçue pour ${shortEndpoint}`);
        try {
            // Utiliser la méthode deleteByEndpoint du repository
            const deleted = await this.subscriptionRepository.deleteByEndpoint(endpoint);
            if (deleted) {
                this.logger.log(`[handleUnsubscribe] Abonnement pour ${shortEndpoint} supprimé de la base de données.`);
            } else {
                this.logger.warn(`[handleUnsubscribe] Aucun abonnement trouvé à supprimer pour ${shortEndpoint}.`);
            }
            return deleted; // Retourne true si suppression effectuée, false sinon
        } catch (error) {
            this.logger.error(`[handleUnsubscribe] Erreur lors de la suppression de l'abonnement pour ${shortEndpoint}`, error);
            // Renvoyer false ou lancer une exception selon la gestion d'erreur souhaitée
            return false;
        }
    }
    // --- FIN NOUVELLE MÉTHODE ---

} // Fin NotificationService