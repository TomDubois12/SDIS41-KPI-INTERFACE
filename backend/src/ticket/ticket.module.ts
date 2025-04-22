import { forwardRef, Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { NotificationsModule } from '../notifications/notifications.module';
//import { TypeOrmModule } from '@nestjs/typeorm'; // Importez TypeOrmModule
//import { Subscription } from '../notifications/entities/subscription.entity'; // Importez l'entité

@Module({
    imports: [
        forwardRef(() => NotificationsModule),       
        //TypeOrmModule.forFeature([Subscription], 'push_notifications_connection'), // Importez TypeOrmModule.forFeature
    ],
    providers: [TicketService],
    controllers: [TicketController],
    exports: [TicketService],
})
export class TicketModule {}