import { Controller, Get } from '@nestjs/common';
import { EmailOnduleurService } from './email_onduleur.service';

@Controller('emails_onduleurs')
export class EmailOnduleurController {
    constructor(private readonly emailService: EmailOnduleurService) {}

    @Get()
    getEmails() {
        return this.emailService.getEmails();
    }
}