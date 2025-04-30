import { Controller, Post, Body, UsePipes, ValidationPipe, Get, Patch, NotFoundException, HttpCode, HttpStatus, Logger, Query } from '@nestjs/common';

import { NotificationService, CurrentPreferences } from './notifications.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { GetPreferencesDto } from './dto/get-preferences.dto';
import { UnsubscribeDto } from './dto/unsubscribe.dto';

/**
 * Contrôleur gérant les requêtes HTTP relatives aux abonnements et préférences
 * pour les notifications Web Push.
 * Fournit des endpoints pour s'abonner, se désabonner, récupérer la clé VAPID,
 * et gérer les préférences de notification.
 * Route de base : /notifications
 */
@Controller('notifications')
export class NotificationsController {
    private readonly logger = new Logger(NotificationsController.name);
    /**
     * Injecte le service NotificationService pour la logique métier.
     * @param notificationService Le service gérant les notifications et abonnements.
     */
    constructor(private readonly notificationService: NotificationService) {}

    /**
     * Enregistre un nouvel abonnement Web Push pour un utilisateur/appareil.
     * Valide les données d'abonnement reçues via le DTO SubscribeDto.
     * Route : POST /notifications/subscribe
     * @param subscriptionDto Données de l'abonnement (endpoint, clés p256dh et auth).
     * @returns Un objet indiquant le succès et l'ID de l'abonnement sauvegardé, ou une erreur.
     */
    @Post('subscribe')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async subscribe(@Body() subscriptionDto: SubscribeDto) {
        try {
            const savedSubscription = await this.notificationService.subscribeUser(
                subscriptionDto.endpoint,
                subscriptionDto.keys.p256dh,
                subscriptionDto.keys.auth,
                null,
            );
            return { success: true, subscriptionId: savedSubscription.id };
        } catch (error: any) {
            this.logger.error(`Erreur lors de l'appel à /subscribe: ${error.message}`, error.stack);
            return { success: false, error: 'An error occurred during subscription.' };
        }
    }

    /**
     * Traite une demande de désabonnement pour un endpoint spécifique.
     * Valide l'endpoint reçu via UnsubscribeDto.
     * Répond toujours avec succès (HTTP 200 OK) pour des raisons de sécurité/confidentialité,
     * même si l'endpoint n'était pas trouvé. L'action réelle est logguée côté serveur.
     * Route : POST /notifications/unsubscribe
     * @param unsubscribeDto DTO contenant l'endpoint à désabonner.
     * @returns Un objet indiquant que la requête a été traitée.
     */
    @Post('unsubscribe')
    @HttpCode(HttpStatus.OK) // Assure une réponse 200 OK même si l'action interne échoue
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async unsubscribe(@Body() unsubscribeDto: UnsubscribeDto) {
        const shortEndpoint = unsubscribeDto.endpoint.substring(0, 40) + '...'; // Pour logs concis
        this.logger.log(`Requête POST /unsubscribe reçue pour endpoint: ${shortEndpoint}`);
        try {
            const deleted = await this.notificationService.handleUnsubscribe(unsubscribeDto.endpoint);
            if (deleted) {
                this.logger.log(`Désinscription backend réussie pour ${shortEndpoint}.`);
            } else {
                this.logger.log(`Désinscription backend : ${shortEndpoint} non trouvé ou déjà supprimé.`);
            }
            return { success: true, message: 'Unsubscription request processed.' };
        } catch (error) {
            this.logger.error(`Erreur dans POST /unsubscribe pour ${shortEndpoint}: ${error.message}`, error instanceof Error ? error.stack : undefined);
            return { success: false, message: 'An error occurred while processing unsubscription.' };
        }
    }

    /**
     * Retourne la clé publique VAPID du serveur.
     * Cette clé est nécessaire côté client pour initialiser l'abonnement push.
     * Route : GET /notifications/vapid-public-key
     * @returns Un objet contenant la clé publique VAPID.
     * @throws {Error} Si la clé VAPID n'est pas configurée sur le serveur.
     */
    @Get('vapid-public-key')
    getVapidPublicKey(): { publicKey: string } {
        const key = this.notificationService.getPublicKey();
        if (!key) {
            this.logger.error('Clé publique VAPID non disponible !');
            throw new Error('VAPID public key is not configured on the server.');
        }
        return { publicKey: key };
    }

    /**
     * Met à jour les préférences de notification pour un abonnement existant,
     * identifié par son endpoint.
     * Valide les données via UpdatePreferencesDto.
     * Route : PATCH /notifications/preferences
     * @param updatePreferencesDto DTO contenant l'endpoint et les nouvelles préférences.
     * @returns Un objet indiquant le succès de la mise à jour.
     * @throws {NotFoundException} Si l'abonnement correspondant à l'endpoint n'est pas trouvé.
     * @throws {HttpException} Pour d'autres erreurs serveur.
     */
    @Patch('preferences')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, skipMissingProperties: false }))
    async updatePreferences(@Body() updatePreferencesDto: UpdatePreferencesDto) {
        const shortEndpoint = updatePreferencesDto.endpoint.substring(0, 40) + '...';
        this.logger.log(`Requête PATCH /preferences reçue pour endpoint: ${shortEndpoint}`);

        try {
            const result = await this.notificationService.updatePreferences(
                updatePreferencesDto.endpoint,
                {
                    notifyOnTicket: updatePreferencesDto.notifyOnTicket,
                    notifyOnEmail: updatePreferencesDto.notifyOnEmail,
                }
            );

            if (!result) {
                this.logger.warn(`Préférences non mises à jour : abonnement non trouvé pour ${shortEndpoint}`);
                throw new NotFoundException(`Subscription not found for the provided endpoint.`);
            }

            this.logger.log(`Préférences mises à jour avec succès pour ${shortEndpoint}`);
            return { success: true, message: 'Preferences updated successfully.' };

        } catch (error) {
            if (!(error instanceof NotFoundException)) {
                this.logger.error(`Erreur dans PATCH /preferences pour ${shortEndpoint}: ${error.message}`, error instanceof Error ? error.stack : undefined);
            }
            throw error;
        }
    }

    /**
     * Récupère les préférences de notification actuelles pour un abonnement,
     * identifié par son endpoint fourni en paramètre de requête.
     * Valide l'endpoint via GetPreferencesDto.
     * Route : GET /notifications/preferences
     * @param query DTO contenant l'endpoint extrait des paramètres de requête.
     * @returns Les préférences actuelles (`CurrentPreferences`).
     * @throws {NotFoundException} Si l'abonnement correspondant à l'endpoint n'est pas trouvé.
     * @throws {HttpException} Pour d'autres erreurs serveur.
     */
    @Get('preferences')
    async getPreferences(@Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) query: GetPreferencesDto): Promise<CurrentPreferences> {
        const shortEndpoint = query.endpoint.substring(0, 40) + '...';
        this.logger.log(`Requête GET /preferences reçue pour endpoint: ${shortEndpoint}`);

        try {
            const preferences = await this.notificationService.getPreferencesByEndpoint(query.endpoint);

            if (preferences === null) {
                this.logger.warn(`GET /preferences: Abonnement non trouvé pour ${shortEndpoint}`);
                throw new NotFoundException(`Subscription not found for the provided endpoint.`);
            }

            this.logger.log(`GET /preferences: Préférences trouvées pour ${shortEndpoint}`);
            return preferences;
        } catch (error) {
            if (!(error instanceof NotFoundException)) {
                this.logger.error(`Erreur dans GET /preferences pour ${shortEndpoint}: ${error.message}`, error instanceof Error ? error.stack : undefined);
            }
            throw error;
        }
    }
}