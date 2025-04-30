import { Controller, Post, UseInterceptors, UploadedFile, Get, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';

import { CsvService } from './csv.service';

/**
 * Contrôleur responsable de la gestion des opérations sur les fichiers CSV.
 * Fournit des points d'accès (endpoints) pour le téléversement et la récupération des données CSV converties.
 * Route de base : /csv
 */
@Controller('csv')
export class CsvController {
    private readonly logger = new Logger(CsvController.name);

    /**
     * Injecte les dépendances nécessaires.
     * @param csvService Service contenant la logique métier pour la manipulation des CSV.
     */
    constructor(private readonly csvService: CsvService) { }

    /**
     * Gère le téléversement (upload) d'un fichier CSV via une requête POST.
     * Le fichier est intercepté, traité par CsvService pour conversion en JSON,
     * et le contenu JSON résultant est retourné.
     *
     * Route : POST /csv/upload
     * Attend un champ 'file' dans la requête multipart/form-data.
     *
     * @param file Le fichier CSV téléversé, géré par Multer via FileInterceptor.
     * @returns Une promesse résolue avec les données JSON converties.
     * @throws {BadRequestException} Si aucun fichier n'est téléversé.
     * @throws {InternalServerErrorException} Si la conversion ou la lecture du fichier échoue.
     */
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadCsv(@UploadedFile() file: Express.Multer.File): Promise<any> {
        if (!file) {
            this.logger.warn('Upload attempt failed: No file provided.');
            throw new BadRequestException('No file uploaded.');
        }

        this.logger.log(`Received file: ${file.originalname}, size: ${file.size} bytes, temp path: ${file.path}`);
        const tempFilePath = file.path;
        const outputJsonPath = path.resolve(__dirname, 'output_csv.json');

        try {
            this.logger.log(`Starting CSV to JSON conversion for ${file.originalname}...`);
            await this.csvService.convertCsvToJson(tempFilePath, outputJsonPath);
            this.logger.log(`Conversion successful. Reading JSON output from ${outputJsonPath}`);

            if (fs.existsSync(outputJsonPath)) {
                const jsonData = JSON.parse(fs.readFileSync(outputJsonPath, 'utf-8'));
                return jsonData;
            } else {
                this.logger.error(`Output file ${outputJsonPath} not found after conversion attempt.`);
                throw new InternalServerErrorException('CSV conversion failed to produce output file.');
            }
        } catch (error) {
            this.logger.error(`Error processing uploaded CSV file ${file.originalname}: ${error.message}`, error.stack);
            if (error instanceof Error) {
                throw new InternalServerErrorException(`Failed to process CSV file: ${error.message}`);
            } else {
                throw new InternalServerErrorException(`Failed to process CSV file due to an unknown error.`);
            }
        }
    }

    /**
     * Récupère les données JSON précédemment générées (ou stockées).
     * Route : GET /csv/data
     *
     * Note : Ce point d'accès lit actuellement depuis './output.json' (relatif au CWD),
     * ce qui diffère du fichier 'output_csv.json' utilisé par le point d'accès d'upload.
     * Cela peut être intentionnel ou une incohérence.
     *
     * @returns Les données JSON parsées sous forme d'objet ou de tableau, ou un tableau vide si le fichier n'existe pas.
     * @throws {InternalServerErrorException} Si le fichier de données existe mais ne peut pas être parsé.
     */
    @Get('data')
    getData(): any {
        const dataFilePath = path.resolve(process.cwd(), 'output.json');
        this.logger.log(`Attempting to retrieve data from: ${dataFilePath}`);

        if (fs.existsSync(dataFilePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
                return data;
            } catch (error) {
                this.logger.error(`Error parsing data file ${dataFilePath}: ${error.message}`, error.stack);
                if (error instanceof Error) {
                    throw new InternalServerErrorException(`Failed to parse data file: ${error.message}`);
                } else {
                    throw new InternalServerErrorException(`Failed to parse data file due to an unknown error.`);
                }
            }
        } else {
            this.logger.warn(`Data file not found: ${dataFilePath}. Returning empty array.`);
            return [];
        }
    }
}