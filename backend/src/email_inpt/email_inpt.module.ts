// src/email_inpt/email_inpt.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { EmailINPTService } from './email_inpt.service';
import { EmailINPTController } from './email_inpt.controller';
import { NotificationsModule } from '../notifications/notifications.module'; // <-- Importer NotificationsModule

@Module({
    imports: [
        forwardRef(() => NotificationsModule), // <-- AJOUTER CET IMPORT (avec forwardRef par sécurité)
    ],
    providers: [EmailINPTService],
    controllers: [EmailINPTController],
})
export class EmailINPTModule {}