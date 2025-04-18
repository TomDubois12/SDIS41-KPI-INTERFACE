import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationService: NotificationService) {}

    @Post('subscribe')
    @UsePipes(new ValidationPipe()) // Utilisez ValidationPipe pour valider le DTO
    async subscribe(@Body() subscriptionDto: SubscribeDto) {
        try {
        const savedSubscription = await this.notificationService.subscribeUser(
            subscriptionDto.endpoint,
            subscriptionDto.keys.p256dh,
            subscriptionDto.keys.auth,
            null, // Pour l'instant, pas de gestion d'utilisateur
        );
        return { success: true, subscriptionId: savedSubscription.id };
        } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'abonnement :', error);
        return { success: false, error: error.message };
        }
    }
}