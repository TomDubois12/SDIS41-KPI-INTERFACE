import { Controller, Get } from '@nestjs/common';

import { EmailOnduleurService } from './email_onduleur.service';

/**
 * Contrôleur gérant les requêtes HTTP relatives aux emails des onduleurs.
 * Route de base : /emails_onduleurs
 */
@Controller('emails_onduleurs')
export class EmailOnduleurController {
    /**
     * Injecte le service nécessaire pour la logique métier des emails d'onduleur.
     * @param emailService Le service utilisé pour récupérer les données des emails d'onduleur.
     */
    constructor(private readonly emailService: EmailOnduleurService) {}

    /**
     * Gère les requêtes GET sur la route de base du contrôleur (/emails_onduleurs).
     * Appelle la méthode getEmails du service EmailOnduleurService pour récupérer les données.
     * @returns Le résultat retourné par la méthode getEmails du service.
     */
    @Get()
    getEmails() {
        return this.emailService.getEmails();
    }
}