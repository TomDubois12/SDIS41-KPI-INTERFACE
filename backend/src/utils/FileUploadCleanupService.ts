import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service responsable du nettoyage périodique des anciens fichiers
 * dans le répertoire d'upload spécifié.
 * Utilise une tâche planifiée (Cron) pour s'exécuter automatiquement.
 */
@Injectable()
export class FileUploadCleanupService {
    private uploadDir = '/src/csv/uploads';

    /**
     * Supprime les fichiers du répertoire d'upload qui sont plus anciens
     * qu'un seuil défini (actuellement 24 heures) en se basant sur leur
     * date de dernière modification.
     * Utilise des opérations synchrones du module 'fs'.
     * @returns {Promise<void>} Une promesse résolue une fois le nettoyage terminé.
     */
    async deleteOldFiles(): Promise<void> {
        const now = Date.now();
        const directoryPath = this.getUploadPath();
        if (!fs.existsSync(directoryPath)) {
            console.warn(`Le répertoire de nettoyage ${directoryPath} n'existe pas.`);
            return;
        }

        const files = fs.readdirSync(directoryPath);

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            try {
                const stats = fs.statSync(filePath);

                if (stats.isFile() && (now - stats.mtimeMs) > 24 * 60 * 60 * 1000) {
                    fs.unlinkSync(filePath);
                    console.log(`Fichier ancien supprimé: ${filePath}`);
                }
            } catch (error) {
                console.error(`Erreur lors du traitement/suppression du fichier ${filePath}:`, error);
            }
        }
    }

    /**
     * Construit et retourne le chemin absolu vers le répertoire d'upload.
     * @private
     * @returns {string} Le chemin absolu du répertoire d'upload.
     */
    private getUploadPath(): string {
        return path.join(process.cwd(), this.uploadDir);
    }

    /**
     * Tâche planifiée (Cron Job) exécutée automatiquement tous les jours à minuit.
     * Déclenche le processus de suppression des anciens fichiers d'upload.
     * @returns {Promise<void>}
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleCron(): Promise<void> {
        console.log('Début de la tâche planifiée de suppression des anciens fichiers...');
        try {
            await this.deleteOldFiles();
        } catch (error) {
            console.error('Erreur inattendue durant la tâche de nettoyage des fichiers:', error);
        }
        console.log('Tâche planifiée de suppression terminée.');
    }
}