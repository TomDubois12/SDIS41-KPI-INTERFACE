import { Module } from '@nestjs/common';
import { EmailOnduleurService } from './email_onduleur.service';
import { EmailOnduleurController } from './email_onduleur.controller';

@Module({
    providers: [EmailOnduleurService],
    controllers: [EmailOnduleurController],
})
export class EmailOnduleurModule {}