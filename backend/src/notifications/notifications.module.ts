import { Module } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionRepository } from './repositories/subscription.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Subscription])], // Importez le module TypeOrm pour l'entité Subscription
    providers: [NotificationService, SubscriptionRepository], // Ajoutez SubscriptionRepository aux providers
    controllers: [NotificationsController],
    exports: [NotificationService],
})
export class NotificationsModule {}