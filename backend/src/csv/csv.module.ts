import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { CsvService } from './csv.service';
import { CsvController } from './csv.controller';

/**
 * Module NestJS encapsulant les fonctionnalités liées à la gestion des fichiers CSV.
 * Configure l'upload de fichiers via Multer, déclare le CsvController
 * et fournit le CsvService.
 */
@Module({
    imports: [
        MulterModule.register({
            dest: './src/csv/uploads',
        }),
    ],
    controllers: [CsvController],
    providers: [CsvService],
})
export class CsvModule { }