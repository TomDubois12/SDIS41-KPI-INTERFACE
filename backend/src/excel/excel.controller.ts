import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';

import { ExcelService } from './excel.service'

@Controller('api/excel')
export class ExcelController {
    constructor(private readonly excelService: ExcelService) { }

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