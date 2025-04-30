import { Controller, Post, Body, UsePipes, ValidationPipe, Get, Patch, NotFoundException, HttpCode, HttpStatus, Logger, Query } from '@nestjs/common';

import { NotificationService, CurrentPreferences } from './notifications.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { GetPreferencesDto } from './dto/get-preferences.dto';
import { UnsubscribeDto } from './dto/unsubscribe.dto';

@Controller('notifications')
export class NotificationsController {
    private readonly logger = new Logger(NotificationsController.name);
    constructor(private readonly notificationService: NotificationService) { }

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

    @Post('unsubscribe')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    async unsubscribe(@Body() unsubscribeDto: UnsubscribeDto) {
        const shortEndpoint = unsubscribeDto.endpoint.substring(0, 40) + '...';
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

    @Get('vapid-public-key')
    getVapidPublicKey(): { publicKey: string } {
        const key = this.notificationService.getPublicKey();
        if (!key) {
            this.logger.error('Clé publique VAPID non disponible !');
            throw new Error('VAPID public key is not configured on the server.');
        }
        return { publicKey: key };
    }

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