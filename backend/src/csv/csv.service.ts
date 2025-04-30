import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as fastCsv from 'fast-csv';

/**
 * Service responsable des tâches de traitement des fichiers CSV.
 * Fournit des fonctionnalités pour convertir un format CSV spécifique en une sortie JSON structurée.
 */
@Injectable()
export class CsvService {

    /**
     * Lit un fichier CSV à partir du chemin spécifié, le parse selon une structure
     * particulière (identifiant la plage de temps, le résumé et les lignes de données
     * basées sur des marqueurs et des positions de colonnes), et écrit les données
     * extraites dans un fichier JSON structuré au chemin de sortie spécifié.
     *
     * Le parsing suppose un délimiteur ';' et des marqueurs de ligne spécifiques comme 'MPLS', 'Hosts', 'Status'.
     *
     * @param filePath Le chemin absolu ou relatif vers le fichier CSV d'entrée.
     * @param outputFile Le chemin absolu ou relatif où le fichier JSON de sortie doit être écrit.
     * @returns Une Promise qui se résout lorsque le processus de conversion et d'écriture est terminé,
     * ou qui rejette si une erreur survient lors de la lecture, du parsing ou de l'écriture du fichier.
     */
    async convertCsvToJson(filePath: string, outputFile: string): Promise<void> {
        return new Promise((resolve, reject) => {
            let timeRange: any = null;
            let summarySection = false;
            const summaryRows: any[] = [];
            const dataRows: any[] = [];
            let headerFound = false;
            let upMeanTime = 'N/A';

            fs.createReadStream(filePath)
                .pipe(fastCsv.parse({ headers: false, delimiter: ';', ignoreEmpty: true }))
                .on('data', (row) => {
                    let values: string[] = Object.values(row).map(val =>
                        typeof val === 'string' ? val.trim() : ''
                    );
                    if (values.every(val => val === '')) return;
                    if (!headerFound) {
                        if (values[0] === 'MPLS' && !timeRange) {
                            timeRange = {
                                hostgroup: values[0] || '',
                                up_percent: values[1] || '',
                                up_mean_time: values[2] || '',
                                up_alert: values[3] || '',
                            };
                            return;
                        }
                        if (values[0] === 'Hosts') {
                            headerFound = true;
                            return;
                        }
                        if (values[0] === 'Status' || summarySection) {
                            summarySection = true;
                            summaryRows.push({
                                hostgroup: values[0] || '',
                                up_percent: values[1] || '',
                                up_mean_time: values[2] || '',
                                up_alert: values[3] || '',
                                down_percent: values[4] || '',
                                down_mean_time: values[5] || '',
                                down_alert: values[6] || '',
                                unreachable_percent: values[7] || '',
                                unreachable_mean_time: values[8] || '',
                                unreachable_alert: values[9] || '',
                                scheduled_downtime: values[10] || '',
                                undetermined_percent: values[11] || '',
                            });
                            if (values[0] === 'UP') {
                                upMeanTime = values[2] || 'N/A';
                            }
                            return;
                        }
                        return;
                    } else {
                        if (values.length < 12) return;
                        if (values.length > 12) {
                            values = values.slice(0, 12);
                        }
                        dataRows.push({
                            hostgroup: values[0],
                            up_percent: values[1],
                            up_mean_time: values[2],
                            up_alert: values[3],
                            down_percent: values[4],
                            down_mean_time: values[5],
                            down_alert: values[6],
                            unreachable_percent: values[7],
                            unreachable_mean_time: values[8],
                            unreachable_alert: values[9],
                            scheduled_downtime: values[10],
                            undetermined_percent: values[11],
                        });
                    }
                })
                .on('end', () => {
                    const finalOutput = {
                        timeRange,
                        summary: summaryRows,
                        data: dataRows,
                        upMeanTime: upMeanTime,
                    };
                    fs.writeFileSync(outputFile, JSON.stringify(finalOutput, null, 2));
                    resolve();
                })
                .on('error', (error) => reject(error));
        });
    }
}