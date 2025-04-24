// src/email_onduleur/email_onduleur.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { EmailOnduleurService } from './email_onduleur.service';
import { EmailOnduleurController } from './email_onduleur.controller';
import { NotificationsModule } from '../notifications/notifications.module'; // <-- Importer NotificationsModule

@Module({
    imports: [
        forwardRef(() => NotificationsModule), // <-- AJOUTER CECI (avec forwardRef par sécurité)
    ],
    providers: [EmailOnduleurService],
    controllers: [EmailOnduleurController],
})
export class EmailOnduleurModule {}