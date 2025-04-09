import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketModule } from './ticket/ticket.module';
import { ExcelModule } from './excel/excel.module';
import { CsvModule } from './csv/csv.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UtilsModule } from './utils/utils.module';
import { EmailModule } from './email_onduleur/email_onduleur.module';


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
    ScheduleModule.forRoot(),
    UtilsModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
