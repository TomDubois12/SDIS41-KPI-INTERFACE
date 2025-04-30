import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { CsvService } from './csv.service';
import { CsvController } from './csv.controller';

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