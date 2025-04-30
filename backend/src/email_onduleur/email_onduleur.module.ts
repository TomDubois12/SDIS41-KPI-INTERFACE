import { Module, forwardRef } from '@nestjs/common';

import { EmailOnduleurService } from './email_onduleur.service';
import { EmailOnduleurController } from './email_onduleur.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        forwardRef(() => NotificationsModule),
    ],
    providers: [EmailOnduleurService],
    controllers: [EmailOnduleurController],
})
export class EmailOnduleurModule { }