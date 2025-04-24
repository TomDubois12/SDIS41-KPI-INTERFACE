// src/notifications/notifications.controller.ts
import { Controller, Post, Body, UsePipes, ValidationPipe, Get, Patch, NotFoundException, HttpCode, HttpStatus, Logger, Query } from '@nestjs/common';
import { NotificationService, CurrentPreferences } from './notifications.service'; // Importer CurrentPreferences
import { SubscribeDto } from './dto/subscribe.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { GetPreferencesDto } from './dto/get-preferences.dto'; // Importer le DTO pour GET

@Controller('notifications')
export class NotificationsController {
    private readonly logger = new Logger(NotificationsController.name);

    constructor(private readonly notificationService: NotificationService) {}

    /**
     * Enregistre un nouvel abonnement push.
     */
    @Post('subscribe')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async subscribe(@Body() subscriptionDto: SubscribeDto) {
        try {
            const savedSubscription = await this.notificationService.subscribeUser(
                subscriptionDto.endpoint,
                subscriptionDto.keys.p256dh,
                subscriptionDto.keys.auth,
                null, // userId (à adapter si vous gérez les utilisateurs)
            );
            return { success: true, subscriptionId: savedSubscription.id };
        } catch (error: any) {
            this.logger.error(`Erreur lors de l'appel à /subscribe: ${error.message}`, error.stack);
            // Retourner une erreur HTTP 500 ou autre serait mieux
            return { success: false, error: 'An error occurred during subscription.' };
        }
    }

    /**
     * Retourne la clé publique VAPID du serveur.
     */
    @Get('vapid-public-key')
    getVapidPublicKey(): { publicKey: string } {
        const key = this.notificationService.getPublicKey();
        if (!key) {
             this.logger.error('Clé publique VAPID non disponible !');
             // En production, une erreur 503 Service Unavailable pourrait être appropriée
             throw new Error('VAPID public key is not configured on the server.');
        }
        return { publicKey: key };
    }

    /**
     * Met à jour les préférences de notification pour un abonnement donné.
     */
    @Patch('preferences')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, skipMissingProperties: false }))
    async updatePreferences(@Body() updatePreferencesDto: UpdatePreferencesDto) {
        const shortEndpoint = updatePreferencesDto.endpoint.substring(0,40) + '...';
        this.logger.log(`Requête PATCH /preferences reçue pour endpoint: ${shortEndpoint}`);

        try {
            const result = await this.notificationService.updatePreferences(
                updatePreferencesDto.endpoint,
                { // Ne passer que les préférences pertinentes
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
             // Renvoyer l'erreur pour le filtre d'exception global
             if (!(error instanceof NotFoundException)) { // Ne pas logguer l'erreur 404 deux fois
                 this.logger.error(`Erreur dans PATCH /preferences pour ${shortEndpoint}: ${error.message}`, error instanceof Error ? error.stack : undefined);
             }
            throw error;
        }
    }

    /**
     * Récupère les préférences de notification actuelles pour un abonnement donné.
     */
    @Get('preferences')
    // Valider le paramètre de requête 'endpoint' en utilisant le DTO
    // Utiliser un pipe spécifique pour la validation des Query DTOs
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
             // Retourne l'objet { notifyOnTicket: boolean, notifyOnEmail: boolean }
             return preferences;
         } catch(error) {
              if (!(error instanceof NotFoundException)) {
                  this.logger.error(`Erreur dans GET /preferences pour ${shortEndpoint}: ${error.message}`, error instanceof Error ? error.stack : undefined);
              }
              throw error; // Laisser NestJS gérer l'erreur HTTP
         }
    }

} // Fin NotificationsController