import { Module, forwardRef } from '@nestjs/common';

import { EmailINPTService } from './email_inpt.service';
import { EmailINPTController } from './email_inpt.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        forwardRef(() => NotificationsModule),
    ],
    providers: [EmailINPTService],
    controllers: [EmailINPTController],
})
export class EmailINPTModule { }