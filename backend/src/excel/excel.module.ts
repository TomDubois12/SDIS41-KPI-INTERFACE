import { Module } from '@nestjs/common';

import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';

/**
 * Module NestJS encapsulant les fonctionnalités relatives à la génération de fichiers Excel.
 * Ce module déclare le contrôleur (`ExcelController`) et le service (`ExcelService`) associés.
 */
@Module({
    controllers: [ExcelController],
    providers: [ExcelService],
})
export class ExcelModule {}