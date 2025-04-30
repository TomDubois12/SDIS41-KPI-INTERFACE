import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { NotificationService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { TicketModule } from 'src/ticket/ticket.module';

/**
 * Module NestJS centralisant les fonctionnalités liées aux notifications Web Push.
 * Ce module configure l'accès à la base de données pour l'entité `Subscription`
 * via TypeOrm (sur une connexion nommée), importe `ConfigModule`, gère une dépendance
 * circulaire avec `TicketModule`, et déclare/fournit le contrôleur, le service
 * et le repository nécessaires. Il exporte `NotificationService` pour utilisation
 * par d'autres modules.
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([Subscription], 'push_notifications_connection'),
        ConfigModule,
        forwardRef(() => TicketModule),
    ],
    providers: [
        NotificationService,
        SubscriptionRepository,
    ],
    controllers: [NotificationsController],
    exports: [NotificationService],
})
export class NotificationsModule {}