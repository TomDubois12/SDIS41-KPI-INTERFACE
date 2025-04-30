import { Controller, Get } from '@nestjs/common';

import { EmailINPTService } from './email_inpt.service';

/**
 * Contrôleur gérant les requêtes HTTP relatives aux emails INPT.
 * Route de base : /emails_impt
 */
@Controller('emails_impt')
export class EmailINPTController {
    /**
     * Injecte le service nécessaire pour la logique métier des emails.
     * @param emailService Le service utilisé pour récupérer les données des emails.
     */
    constructor(private readonly emailService: EmailINPTService) {}

    /**
     * Gère les requêtes GET sur la route de base du contrôleur (/emails_impt).
     * Appelle la méthode getEmails du service EmailINPTService pour récupérer les données.
     * @returns Le résultat retourné par la méthode getEmails du service.
     */
    @Get()
    getEmails() {
        return this.emailService.getEmails();
    }
}