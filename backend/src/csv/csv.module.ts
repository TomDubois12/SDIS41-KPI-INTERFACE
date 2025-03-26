import { Module } from '@nestjs/common';
import { CsvService } from './csv.service';
import { CsvController } from './csv.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
    imports: [
        MulterModule.register({
            dest: './src/csv/uploads', // Dossier de destination des fichiers
        }),
    ],
    controllers: [CsvController],
    providers: [CsvService],
})
export class CsvModule { }