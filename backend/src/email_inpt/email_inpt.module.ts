import { Module, forwardRef } from '@nestjs/common';

import { EmailINPTService } from './email_inpt.service';
import { EmailINPTController } from './email_inpt.controller';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Module NestJS encapsulant les fonctionnalités relatives aux emails INPT.
 * Ce module déclare le contrôleur (`EmailINPTController`) et le service (`EmailINPTService`) associés.
 * Il gère également une dépendance circulaire avec le `NotificationsModule` en utilisant `forwardRef`.
 */
@Module({
    imports: [
        forwardRef(() => NotificationsModule),
    ],
    providers: [EmailINPTService],
    controllers: [EmailINPTController],
})
export class EmailINPTModule {}