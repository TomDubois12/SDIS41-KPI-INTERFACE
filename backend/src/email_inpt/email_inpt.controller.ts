import { Controller, Get } from '@nestjs/common';
import { EmailINPTService } from './email_inpt.service';

@Controller('emails_impt')
export class EmailINPTController {
    constructor(private readonly emailService: EmailINPTService) {}

    @Get()
    getEmails() {
        return this.emailService.getEmails();
    }
}