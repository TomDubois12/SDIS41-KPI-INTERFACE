import { Module } from '@nestjs/common';
import { EmailINPTService } from './email_inpt.service';
import { EmailINPTController } from './email_inpt.controller';

@Module({
    providers: [EmailINPTService],
    controllers: [EmailINPTController],
})
export class EmailINPTModule {}