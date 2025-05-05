import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

import { SubscriptionRepository } from './repositories/subscription.repository';
import { Subscription } from './entities/subscription.entity';
import { TicketService } from '../ticket/ticket.service';

/**
 * Interface définissant la structure des données pour la mise à jour des préférences.
 * Les propriétés sont optionnelles car une mise à jour peut ne concerner qu'une seule préférence.
 */
interface SubscriptionPreferences {
    notifyOnTicket?: boolean;
    notifyOnEmail?: boolean;
}

/**
 * Interface définissant la structure des données retournées lors de la récupération des préférences actuelles.
 */
export interface CurrentPreferences {
    notifyOnTicket: boolean;
    notifyOnEmail: boolean;
}

/**
 * Service principal pour la gestion des notifications Web Push.
 * Gère l'enregistrement des abonnements (subscribe), la suppression (unsubscribe),
 * la mise à jour des préférences de notification, l'envoi de notifications push
 * et la surveillance des nouveaux tickets pour déclencher des notifications.
 * Utilise les clés VAPID configurées pour sécuriser les envois.
 */
@Injectable()
export class NotificationService implements OnModuleInit {
    private readonly logger = new Logger(NotificationService.name);
    private vapidPublicKey: string;
    private vapidPrivateKey: string;
    private previousTickets: any[] = [];

    /**
     * Injecte les dépendances : repository pour les abonnements, service de configuration,
     * et service des tickets (avec gestion de dépendance circulaire).
     * Charge également les clés VAPID depuis la configuration et initialise web-push.
     * @param subscriptionRepository Repository pour l'accès aux données des abonnements.
     * @param configService Service pour accéder aux variables d'environnement/configuration.
     * @param ticketService Service pour récupérer les informations des tickets.
     */
    constructor(
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => TicketService))
        private readonly ticketService: TicketService,
    ) {
        this.vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY') as string;
        this.vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY') as string;

        if (!this.vapidPublicKey || !this.vapidPrivateKey) {
            this.logger.error('Clés VAPID non trouvées dans les variables d\'environnement ! Notifications désactivées.');
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
                this.logger.error('Erreur lors de la configuration de web-push avec les clés VAPID.', error);
            }
        }
    }

    /**
     * Méthode du cycle de vie NestJS appelée à l'initialisation du module.
     * Lance la surveillance initiale des tickets.
     */
    async onModuleInit() {
        this.logger.log('NotificationService Module Initialized. Démarrage surveillance tickets...');
        await this.startMonitoring();
    }

    /**
     * Formate un nom d'opérateur potentiellement complexe (ex: "DOMAINE\prenom.nom")
     * en un format plus lisible (ex: "Prenom Nom").
     * Gère les cas null/undefined et certains formats spécifiques.
     * @private
     * @param operatorName Le nom d'opérateur brut.
     * @returns Le nom formaté ou 'Inconnu'.
     */
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

    /**
     * Enregistre un nouvel abonnement push ou met à jour un abonnement existant
     * identifié par son endpoint unique.
     * Vérifie si les clés (p256dh, auth) ou l'userId ont changé pour un endpoint existant.
     * @param endpoint L'URL unique de l'abonnement fournie par le service push.
     * @param p256dh La clé publique P-256 ECDH de l'abonnement.
     * @param auth Le secret d'authentification de l'abonnement.
     * @param userId L'ID de l'utilisateur associé (peut être null).
     * @returns La nouvelle entité Subscription sauvegardée ou mise à jour.
     * @throws L'erreur de base de données si la sauvegarde échoue.
     */
    async subscribeUser(endpoint: string, p256dh: string, auth: string, userId: number | null): Promise<Subscription> {
        const shortEndpoint = endpoint.substring(0, 40) + '...';
        let subscription = await this.subscriptionRepository.findOneByEndpoint(endpoint);

        if (subscription) {
            this.logger.log(`[subscribeUser] Abonnement existant trouvé pour ${shortEndpoint} ID: ${subscription.id}. Vérification MàJ.`);
            let needsSave = false;
            if (subscription.p256dh !== p256dh) { subscription.p256dh = p256dh; needsSave = true; this.logger.log(`[subscribeUser] Clé p256dh différente détectée pour ${shortEndpoint}`); }
            if (subscription.auth !== auth) { subscription.auth = auth; needsSave = true; this.logger.log(`[subscribeUser] Clé auth différente détectée pour ${shortEndpoint}`); }
            if (userId !== null && subscription.userId !== userId) { subscription.userId = userId; needsSave = true; this.logger.log(`[subscribeUser] UserId différent détecté pour ${shortEndpoint}`); }

            if (needsSave) {
                this.logger.log(`[subscribeUser] Tentative de sauvegarde (update) pour l'abonnement ID: ${subscription.id}.`);
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

    /**
     * Met à jour les préférences de notification pour un abonnement spécifique.
     * @param endpoint L'endpoint unique de l'abonnement à mettre à jour.
     * @param preferences Un objet contenant les préférences à mettre à jour (notifyOnTicket, notifyOnEmail).
     * @returns Vrai si la mise à jour a affecté au moins une ligne, faux sinon (abonnement non trouvé).
     */
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

    /**
     * Récupère tous les abonnements enregistrés dans la base de données.
     * @returns Une promesse résolue avec un tableau de toutes les entités Subscription.
     */
    async getAllSubscriptions(): Promise<Subscription[]> {
        return this.subscriptionRepository.find();
    }

    /**
     * Récupère tous les abonnements ayant activé les notifications pour les tickets.
     * @returns Une promesse résolue avec un tableau des entités Subscription concernées.
     */
    async getTicketSubscribers(): Promise<Subscription[]> {
        this.logger.debug('Récupération des abonnés aux tickets...');
        return this.subscriptionRepository.findTicketSubscribers();
    }

    /**
     * Récupère tous les abonnements ayant activé les notifications pour les emails.
     * @returns Une promesse résolue avec un tableau des entités Subscription concernées.
     */
    async getEmailSubscribers(): Promise<Subscription[]> {
        this.logger.debug('Récupération des abonnés aux emails...');
        return this.subscriptionRepository.findEmailSubscribers();
    }

    /**
     * Récupère les préférences de notification actuelles pour un abonnement donné.
     * @param endpoint L'endpoint unique de l'abonnement.
     * @returns Une promesse résolue avec un objet CurrentPreferences, ou null si l'abonnement n'est pas trouvé.
     */
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

    /**
     * Envoie une notification push à un abonnement spécifique.
     * Gère les erreurs d'envoi, notamment la suppression automatique des abonnements expirés (404, 410).
     * @param subscription L'entité Subscription contenant les détails de l'abonné.
     * @param payload Le contenu de la notification (chaîne de caractères, souvent du JSON).
     * @returns Vrai si l'envoi initial a été tenté avec succès (avant la gestion d'erreur 404/410), faux sinon.
     */
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

    /**
     * Retourne la clé publique VAPID configurée pour le service.
     * @returns La clé publique VAPID sous forme de chaîne de caractères.
     */
    getPublicKey(): string {
        return this.vapidPublicKey;
    }

    /**
     * Récupère les tickets du jour via le TicketService.
     * Gère les erreurs potentielles lors de l'appel au service.
     * @private
     * @returns Une promesse résolue avec un tableau de tickets, ou un tableau vide en cas d'erreur.
     */
    async getCurrentTickets(): Promise<any[]> {
        try {
            const todayDate = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
            const tickets = await this.ticketService.getTickets(todayDate);
            return Array.isArray(tickets) ? tickets : [];
        } catch (error) {
            this.logger.error('[getCurrentTickets] Erreur fetching tickets via TicketService:', error);
            return [];
        }
    }

    /**
     * Vérifie s'il y a de nouveaux tickets par rapport à l'état précédent.
     * Si oui, récupère les abonnés intéressés et leur envoie une notification pour chaque nouveau ticket.
     * Met à jour l'état des tickets précédents.
     */
    async checkForNewTicket() {
        const currentTickets = await this.getCurrentTickets();
        const previousTicketIds = new Set(this.previousTickets.map(t => t?.TicketId));

        const newTickets = currentTickets.filter(
            (ticket) => ticket?.TicketId && !previousTicketIds.has(ticket.TicketId)
        );

        if (newTickets.length > 0) {
            this.logger.log(`[checkForNewTicket] ${newTickets.length} nouveau(x) ticket(s) IDENTIFIÉ(S): IDs=[${newTickets.map(t => t.TicketId).join(', ')}]`);

            const subscriptions = await this.getTicketSubscribers();
            this.logger.log(`[checkForNewTicket] Trouvé ${subscriptions.length} abonnés pour les notifications de ticket.`);

            if (subscriptions.length > 0) {
                for (const newTicket of newTickets) {
                    this.logger.log(`[checkForNewTicket] Traitement nouveau ticket ID=${newTicket.TicketId}`);
                    const formattedCallerName = this.formatOperatorName(newTicket.CallerName);
                    const title = newTicket.Title || 'Sans titre';
                    const payload = JSON.stringify({
                        title: 'Nouveau ticket !',
                        body: `Ticket ${newTicket.TicketId} \nSujet : ${title.substring(0, 100)} \npar ${formattedCallerName}.`,
                        data: { url: `/clarilog_detail?id=${newTicket.TicketId}` }
                    });

                    this.logger.log(`[checkForNewTicket] Envoi notification ticket ID=${newTicket.TicketId} à ${subscriptions.length} abonnés.`);
                    await Promise.allSettled(
                        subscriptions.map(sub => this.sendPushNotification(sub, payload))
                    );
                    this.logger.log(`[checkForNewTicket] Tentative d'envoi terminée pour Ticket ID=${newTicket.TicketId}.`);
                }
            } else {
                this.logger.log(`[checkForNewTicket] Aucun abonné actif trouvé pour les notifications de ticket.`);
            }
        }
        this.previousTickets = [...currentTickets];
    }

    /**
     * Tâche planifiée (Cron Job) exécutée toutes les 5 secondes pour vérifier les nouveaux tickets.
     */
    @Cron(CronExpression.EVERY_5_SECONDS)
    async monitoringTask() {
        await this.checkForNewTicket();
    }

    /**
     * Initialise l'état de la surveillance en chargeant l'état actuel des tickets.
     * Normalement appelée une seule fois au démarrage du service.
     */
    async startMonitoring() {
        this.logger.log('[startMonitoring] Initialisation état des tickets précédents...');
        this.previousTickets = await this.getCurrentTickets();
        this.logger.log(`[startMonitoring] Initialisé previousTickets avec ${this.previousTickets.length} tickets.`);
        this.logger.log('[startMonitoring] Tâche de surveillance planifiée (via @Cron).');
    }

    /**
     * Tente d'envoyer une notification "ping" à tous les abonnements pour détecter
     * et supprimer ceux qui sont expirés (répondant 404 ou 410).
     * Méthode potentiellement longue et coûteuse en ressources. À utiliser avec précaution.
     * @returns Le nombre d'abonnements supprimés lors de cette opération.
     */
    async cleanupExpiredSubscriptions(): Promise<number> {
        this.logger.log('[cleanupExpiredSubscriptions] Démarrage tâche de nettoyage...');
        const subscriptions = await this.getAllSubscriptions();
        let removedCount = 0;
        for (const subscription of subscriptions) {
            try {
                const pushSubscription: webpush.PushSubscription = { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } };
                await webpush.sendNotification(pushSubscription, JSON.stringify({ type: 'ping' }));
            } catch (error: any) {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    this.logger.warn(`[cleanup] Trouvé abonnement expiré: ${subscription.id}. Suppression.`);
                    try {
                        await this.subscriptionRepository.delete(subscription.id);
                        removedCount++;
                    }
                    catch (deleteError: any) {
                        this.logger.error(`[cleanup] Erreur lors de la suppression de ${subscription.id}: ${deleteError.message}`);
                    }
                }
            }
        }
        this.logger.log(`[cleanupExpiredSubscriptions] Nettoyage terminé: ${removedCount} abonnements supprimés.`);
        return removedCount;
    }

    /**
     * Supprime un abonnement de la base de données en utilisant son endpoint.
     * @param endpoint L'endpoint unique de l'abonnement à supprimer.
     * @returns Vrai si un abonnement a été trouvé et supprimé, faux sinon.
     */
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