import { forwardRef, Module } from '@nestjs/common';

import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        forwardRef(() => NotificationsModule),
    ],
    providers: [TicketService],
    controllers: [TicketController],
    exports: [TicketService],
})
export class TicketModule { }