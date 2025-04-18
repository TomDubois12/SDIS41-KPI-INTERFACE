import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
    imports: [NotificationsModule],
    providers: [TicketService],
    controllers: [TicketController],
})
export class TicketModule {}
