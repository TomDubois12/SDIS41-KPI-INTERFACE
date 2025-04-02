import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadCleanupService {
    private uploadDir = '/src/csv/uploads';

    async deleteOldFiles() {
        const now = Date.now();
        const files = fs.readdirSync(this.getUploadPath());

        for (const file of files) {
            const filePath = path.join(this.getUploadPath(), file);
            try {
                const stats = fs.statSync(filePath);

                if (stats.isFile() && (now - stats.mtimeMs) > 24 * 60 * 60 * 1000) { // 1 jour
                    fs.unlinkSync(filePath);
                    console.log(`Fichier supprimé: ${filePath}`);
                }
            } catch (error) {
                console.error(`Erreur avec le fichier ${filePath}:`, error);
            }
        }
    }

    private getUploadPath(): string {
        return path.join(process.cwd(), this.uploadDir);
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleCron() {
        console.log('Début de la suppression des anciens fichiers...');
        try {
            await this.deleteOldFiles();
        } catch (error) {
            console.error('Erreur lors de la suppression des fichiers:', error);
        }
        console.log('Suppression terminée.');
    }
}