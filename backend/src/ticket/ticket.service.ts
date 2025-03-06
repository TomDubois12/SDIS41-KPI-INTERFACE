import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TicketService {
    constructor(private dataSource: DataSource) {}

    async getNbTicketsCreated(date: string): Promise<any> {
        return this.dataSource.query(
            `SELECT COUNT(*) 
            FROM [parc_db].[dbo].[SD_Tickets] 
            WHERE CAST(SentOn AS DATE) = '${date}';`,
        );
    }

    async getNbTicketsResolved(date: string): Promise<any> {
        return this.dataSource.query(
            `SELECT COUNT(*)
            FROM [parc_db].[dbo].[SD_Tickets]
            WHERE CAST(ResolutionDate AS DATE) = '${date}'
            AND CAST(SentOn AS DATE) = '${date}';`,
        );
    }
    
    async getTickets(date: string): Promise<any> {
        return this.dataSource.query(
            `SELECT t.TicketId, 
                t.Title, 
                CASE 
                    WHEN t.CallerId = -2 THEN 'Envoyé depuis un mail'
                    ELSE u.[user_park_helpdesk_login] 
                END AS CallerName,
                CONVERT(VARCHAR, t.SentOn, 108) AS HeureDeCréation
            FROM [parc_db].[dbo].[SD_Tickets] t
            LEFT JOIN [user_park] u ON t.CallerId = u.id_user_park
            WHERE CAST(t.SentOn AS DATE) = '${date}';`,
        );
    }
}