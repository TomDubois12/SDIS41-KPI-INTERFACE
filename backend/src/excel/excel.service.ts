import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Workbook } from 'exceljs';
import * as path from 'path';
import { Response } from 'express';

/**
 * Service responsable de la génération de fichiers Excel, notamment des rapports de performance SIC.
 * Utilise un template Excel prédéfini pour structurer et remplir les données.
 */
@Injectable()
export class ExcelService {

    /**
     * Génère un rapport de performance SIC au format Excel à partir des données fournies
     * et d'un template prédéfini.
     * Le fichier Excel généré est directement écrit dans le flux de la réponse HTTP.
     *
     * @param data Un objet contenant les métriques à insérer dans le rapport
     * (countTicketCreated, resolutionRate, etc.).
     * @param res L'objet Response d'Express, utilisé pour envoyer le fichier Excel généré au client.
     * @throws {HttpException} Si le template ou la feuille de calcul est introuvable,
     * ou si une autre erreur survient lors de la génération.
     */
    async generateReport(data: {
        countTicketCreated: number;
        resolutionRate: string;
        telephonyAvailability: string;
        maintenanceMinutes: string;
        upMeanTimeMPLS: string;
        upMeanTimeESX: string;
    }, res: Response) {
        try {
            const templatePath = path.join(process.cwd(), './src/templates/template-rapport-sic.xlsx');
            const workbook = new Workbook();
            await workbook.xlsx.readFile(templatePath);
            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) {
                throw new HttpException('Feuille de calcul introuvable dans le template', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'BB463F' },
                };
                cell.font = {
                    color: { argb: 'FFFFFFFF' },
                    bold: true,
                };
            });
            headerRow.commit();
            for (let rowNumber = 2; rowNumber <= 25; rowNumber++) {
                const row = worksheet.getRow(rowNumber);
                const fillColor = rowNumber % 2 === 0 ? 'F6F8F9' : 'FFFFFF';
                for (let col = 1; col <= 5; col++) {
                    const cell = row.getCell(col);
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: fillColor },
                    };
                }
                row.commit();
            }
            worksheet.getCell('B6').value = data.countTicketCreated || 0;
            worksheet.getCell('B7').value = data.resolutionRate ? `${data.resolutionRate}%` : '0%';
            worksheet.getCell('B9').value = data.upMeanTimeMPLS;
            worksheet.getCell('B10').value = data.telephonyAvailability;
            worksheet.getCell('B11').value = data.upMeanTimeESX;
            if (data.maintenanceMinutes) {
                worksheet.getCell('D10').value = data.maintenanceMinutes + " minutes";
            }
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Indicateur_de_la_performance_SIC.xlsx');

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error('Erreur lors de la génération du rapport:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Erreur lors de la génération du rapport Excel', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}