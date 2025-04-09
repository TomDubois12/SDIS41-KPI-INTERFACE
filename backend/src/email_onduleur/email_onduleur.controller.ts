import { Controller, Get } from '@nestjs/common';
import { EmailService } from './email_onduleur.service';

@Controller('emails')
export class EmailController {
    constructor(private readonly emailService: EmailService) {}

    @Get()
    getEmails() {
        return this.emailService.getEmails();
    }
}