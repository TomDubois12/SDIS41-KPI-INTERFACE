import { Module } from '@nestjs/common';
import { EmailService } from './email_onduleur.service';
import { EmailController } from './email_onduleur.controller';

@Module({
    providers: [EmailService],
    controllers: [EmailController],
})
export class EmailModule {}