import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Fonction d'amorçage (bootstrap) de l'application NestJS.
 * Crée une instance de l'application en utilisant le module racine `AppModule`,
 * active la politique CORS (Cross-Origin Resource Sharing) pour autoriser
 * les requêtes provenant d'origines différentes (typiquement le frontend),
 * et démarre l'écoute du serveur sur le port spécifié (3001).
 */
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    await app.listen(3001); // Définit le port d'écoute de l'API
}
bootstrap();