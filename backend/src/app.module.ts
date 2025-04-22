import { Module } from '@nestjs/common';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketModule } from './ticket/ticket.module';
import { ExcelModule } from './excel/excel.module';
import { CsvModule } from './csv/csv.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UtilsModule } from './utils/utils.module';
import { EmailOnduleurModule } from './email_onduleur/email_onduleur.module';
import { EmailINPTModule } from './email_inpt/email_inpt.module';
import { NotificationsModule } from './notifications/notifications.module';
import { Subscription } from './notifications/entities/subscription.entity';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { ConfigModule } from '@nestjs/config';
dotenv.config();

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'mssql',
            name: 'parc_db_connection',
            host: 'SRV71\\CLARILOG',
            port: 1433,
            username: 'sa',
            password: '6H_c>HtzVr1(6W-|',
            database: 'parc_db',
            options: {
                encrypt: false,
                enableArithAbort: true,
            },
            entities: [],
            synchronize: false,
        }),
        TypeOrmModule.forRoot({ // Connexion pour push_notifications (MySQL)
            type: 'mysql', // <-- Change to 'mysql'
            name: 'push_notifications_connection',
            host: 'ST428', // <-- Change to your MySQL host
            port: 3306,      // <-- MySQL default port
            username: 'root',      // <-- Change to your MySQL username
            password: 'BqBoUixq8bCzTfgvrX1e5ZWRE', // <-- Your MySQL password
            database: 'push_notifications',
            entities: [Subscription], // Spécifiez l'entité Subscription ici
            synchronize: false,
        }),
        ConfigModule.forRoot({
            isGlobal: true, // Makes the ConfigService available everywhere
            envFilePath: '.env', // Explicitly specify the path to your .env file (optional if it's in the root)
        }),
        TicketModule,
        NotificationsModule,
        ExcelModule,
        CsvModule,
        ScheduleModule.forRoot(),
        UtilsModule,
        EmailOnduleurModule,
        EmailINPTModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: 'parc_db_connection',
            useFactory: (dataSource: DataSource) => dataSource,
            inject: [getDataSourceToken('parc_db_connection')] // <-- Corrected inject
        }
    ],
    exports: ['parc_db_connection']
})
export class AppModule {}