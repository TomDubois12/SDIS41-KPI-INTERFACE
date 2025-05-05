import { Module } from '@nestjs/common';

import { FileUploadCleanupService } from './FileUploadCleanupService';

/**
 * Module NestJS regroupant divers services utilitaires transverses à l'application.
 * Actuellement, il fournit et exporte le service de nettoyage des fichiers uploadés.
 */
@Module({
    providers: [FileUploadCleanupService],
    exports: [FileUploadCleanupService],
})
export class UtilsModule {}