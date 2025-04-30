import { Injectable } from '@nestjs/common';

/**
 * Service racine de l'application.
 * Contient généralement une logique de base ou des méthodes d'exemple.
 */
@Injectable()
export class AppService {
    /**
     * Retourne un simple message de salutation statique.
     * @returns La chaîne de caractères 'Hello SDIS41!'.
     */
    getHello(): string {
        return 'Hello SDIS41!';
    }
}