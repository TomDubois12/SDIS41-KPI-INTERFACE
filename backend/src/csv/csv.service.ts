import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as fastCsv from 'fast-csv';

@Injectable()
export class CsvService {
    async convertCsvToJson(filePath: string, outputFile: string): Promise<void> {
        return new Promise((resolve, reject) => {
            let timeRange: any = null;
            let summarySection = false;
            const summaryRows: any[] = [];
            const dataRows: any[] = [];
            let headerFound = false;
            let upMeanTime = 'N/A'; // Initialize upMeanTime with a default value

            fs.createReadStream(filePath)
                .pipe(fastCsv.parse({ headers: false, delimiter: ';', ignoreEmpty: true }))
                .on('data', (row) => {
                    // Nettoyage des valeurs
                    let values: string[] = Object.values(row).map(val =>
                        typeof val === 'string' ? val.trim() : ''
                    );
                    // Ignorer les lignes complètement vides
                    if (values.every(val => val === '')) return;

                    // Avant d'atteindre la section des données principales
                    if (!headerFound) {
                        // Détection de la ligne de plage de temps (MPLS)
                        if (values[0] === 'MPLS' && !timeRange) {
                            timeRange = {
                                hostgroup: values[0] || '',
                                up_percent: values[1] || '',
                                up_mean_time: values[2] || '',
                                up_alert: values[3] || '',
                            };
                            return;
                        }
                        // Détection de l'en-tête du tableau principal
                        if (values[0] === 'Hosts') {
                            headerFound = true;
                            return;
                        }
                        // Détection et traitement de la section récapitulative
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

                            // Extract 'Mean Time' for 'UP' status
                            if (values[0] === 'UP') {
                                upMeanTime = values[2] || 'N/A'; // Assign value or 'N/A' if undefined
                            }
                            return;
                        }
                        // Sinon, on ignore la ligne
                        return;
                    } else {
                        // Section des données principales : on s'attend à 12 colonnes
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
                        upMeanTime: upMeanTime, // Add upMeanTime to the output
                    };
                    fs.writeFileSync(outputFile, JSON.stringify(finalOutput, null, 2));
                    resolve();
                })
                .on('error', (error) => reject(error));
        });
    }
}