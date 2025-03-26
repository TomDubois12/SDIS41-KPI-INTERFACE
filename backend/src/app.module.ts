import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketModule } from './ticket/ticket.module';
import { ExcelModule } from './excel/excel.module';
import { CsvModule } from './csv/csv.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: 'SRV71\\CLARILOG',
      port: 1433, // Port par défaut de SQL Server
      username: 'sa',
      password: '6H_c>HtzVr1(6W-|',
      database: 'parc_db',
      options: {
        encrypt: false,
        enableArithAbort: true,
      },
      entities: [],
      synchronize: false, // À ne pas activer en production !
    }),
    TicketModule,
    ExcelModule,
    CsvModule,
  ],
})
export class AppModule {}
