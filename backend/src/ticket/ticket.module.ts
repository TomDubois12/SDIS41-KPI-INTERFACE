import { forwardRef, Module } from '@nestjs/common';

import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { NotificationsModule } from '../notifications/notifications.module'; // Assurez-vous que ce chemin est correct

/**
 * Module NestJS encapsulant les fonctionnalités relatives aux tickets (probablement Clarilog).
 * Ce module déclare le contrôleur (`TicketController`) et le service (`TicketService`) associés.
 * Il gère une dépendance circulaire avec le `NotificationsModule` en utilisant `forwardRef`.
 * Il exporte `TicketService` pour permettre son injection dans d'autres modules (comme NotificationsModule).
 */
@Module({
    imports: [
        forwardRef(() => NotificationsModule),
    ],
    providers: [TicketService],
    controllers: [TicketController],
    exports: [TicketService],
})
export class TicketModule {}