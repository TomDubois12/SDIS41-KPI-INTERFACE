import { Module, forwardRef } from '@nestjs/common';

import { EmailOnduleurService } from './email_onduleur.service';
import { EmailOnduleurController } from './email_onduleur.controller';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Module NestJS encapsulant les fonctionnalités relatives aux emails des onduleurs.
 * Ce module déclare le contrôleur (`EmailOnduleurController`) et le service (`EmailOnduleurService`) associés.
 * Il gère également une dépendance circulaire avec le `NotificationsModule` en utilisant `forwardRef`.
 */
@Module({
    imports: [
        forwardRef(() => NotificationsModule),
    ],
    providers: [EmailOnduleurService],
    controllers: [EmailOnduleurController],
})
export class EmailOnduleurModule {}