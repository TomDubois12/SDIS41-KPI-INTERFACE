import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';

import { ExcelService } from './excel.service';

/**
 * Contrôleur gérant les requêtes HTTP liées à la génération de fichiers Excel.
 * Route de base : /api/excel
 */
@Controller('api/excel')
export class ExcelController {
    /**
     * Injecte le service nécessaire pour la logique métier de génération Excel.
     * @param excelService Le service utilisé pour créer les fichiers Excel.
     */
    constructor(private readonly excelService: ExcelService) {}

    /**
     * Gère les requêtes POST pour générer un rapport Excel basé sur les données fournies.
     * Route : POST /api/excel/generate-report
     * Attend un corps de requête (`@Body`) contenant les indicateurs nécessaires au rapport.
     * Délègue la génération du fichier et l'envoi de la réponse HTTP au `ExcelService`
     * en injectant l'objet `Response` (`@Res`).
     *
     * @param data Les données d'entrée pour la génération du rapport.
     * @param res L'objet Response d'Express, utilisé par le service pour envoyer le fichier généré.
     * @returns Le résultat de l'appel à `excelService.generateReport`, qui est censé gérer la réponse.
     */
    @Post('generate-report')
    async generateReport(
        @Body() data: {
            countTicketCreated: number;
            resolutionRate: string;
            telephonyAvailability: string;
            maintenanceMinutes: string;
            upMeanTimeMPLS: string;
            upMeanTimeESX: string;
        },
        @Res() res: Response,
    ) {
        return this.excelService.generateReport(data, res);
    }
}