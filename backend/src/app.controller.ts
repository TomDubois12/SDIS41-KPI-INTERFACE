import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

/**
 * Contrôleur racine (root) de l'application.
 * Gère les requêtes envoyées à la base de l'URL de l'API.
 */
@Controller()
export class AppController {
    /**
     * Injecte AppService pour accéder à la logique de base de l'application.
     * @param appService Le service principal de l'application.
     */
    constructor(private readonly appService: AppService) {}

    /**
     * Gère les requêtes GET sur la route racine ('/').
     * Retourne un simple message de salutation fourni par AppService.
     * @returns Une chaîne de caractères de salutation (ex: 'Hello World!').
     */
    @Get()
    getHello(): string {
        return this.appService.getHello();
    }
}