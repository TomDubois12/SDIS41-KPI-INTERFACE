import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { ConfigModule } from '@nestjs/config';
import { TicketModule } from 'src/ticket/ticket.module';

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