import { Controller, Post, UseInterceptors, UploadedFile, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvService } from './csv.service';
import * as fs from 'fs';
import { Express } from 'express'; // Importez Express pour le type File

@Controller('csv')
export class CsvController {
    constructor(private readonly csvService: CsvService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadCsv(@UploadedFile() file: Express.Multer.File): Promise<any> {
        const filePath = file.path;
        const outputFile = './src/csv/output_csv.json';
        await this.csvService.convertCsvToJson(filePath, outputFile);
        if (fs.existsSync(outputFile)) {
        const data = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
        return data; // Return the entire parsed data
        }
        return null;
    }

    @Get('data')
    getData(): any {
        const outputFile = './output.json';
        if (fs.existsSync(outputFile)) {
        return JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
        }
        return [];
    }
}