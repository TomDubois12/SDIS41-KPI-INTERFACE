import { Module } from '@nestjs/common';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketModule } from './ticket/ticket.module';
import { ExcelModule } from './excel/excel.module';
import { CsvModule } from './csv/csv.module';
import { UtilsModule } from './utils/utils.module';
import { EmailOnduleurModule } from './email_onduleur/email_onduleur.module';
import { EmailINPTModule } from './email_inpt/email_inpt.module';
import { ImapPollingModule } from './imap-polling/imap-polling.module';
import { NotificationsModule } from './notifications/notifications.module';
import { Subscription } from './notifications/entities/subscription.entity';


@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        TypeOrmModule.forRootAsync({
            name: 'parc_db_connection',
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'mssql',
                host: configService.get<string>('CLARILOG_DATABASE_HOST') as string,
                port: configService.get<number>('CLARILOG_DATABASE_PORT') as number,
                username: configService.get<string>('CLARILOG_DATABASE_USERNAME') as string,
                password: configService.get<string>('CLARILOG_DATABASE_PASSWORD') as string,
                database: configService.get<string>('CLARILOG_DATABASE_DATABASE') as string,
                options: {
                    encrypt: false,
                    enableArithAbort: true,
                },
                entities: [],
                synchronize: false,
            }),
            inject: [ConfigService],
        }),

        TypeOrmModule.forRootAsync({
            name: 'push_notifications_connection',
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'mysql',
                host: configService.get<string>('NOTIFICATIONS_DATABASE_HOST') as string,
                port: configService.get<number>('NOTIFICATIONS_DATABASE_PORT') as number,
                username: configService.get<string>('NOTIFICATIONS_DATABASE_USERNAME') as string,
                password: configService.get<string>('NOTIFICATIONS_DATABASE_PASSWORD') as string,
                database: configService.get<string>('NOTIFICATIONS_DATABASE_DATABASE') as string,
                entities: [Subscription],
                synchronize: false,
            }),
            inject: [ConfigService],
        }),
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot(),
        TicketModule,
        NotificationsModule,
        ExcelModule,
        CsvModule,
        UtilsModule,
        ImapPollingModule,
        EmailOnduleurModule,
        EmailINPTModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: 'parc_db_connection',
            useFactory: (dataSource: DataSource) => dataSource,
            inject: [getDataSourceToken('parc_db_connection')]
        }
    ],
    exports: ['parc_db_connection']
})
export class AppModule { }