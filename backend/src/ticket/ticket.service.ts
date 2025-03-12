import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TicketService {
    constructor(private dataSource: DataSource) {}

    // le nombre de tickets qui ont été créés à la date spécifiée
    async getNbTicketsCreated(date: string): Promise<any> {
        return this.dataSource.query(
            `SELECT COUNT(DISTINCT t.TicketId)
            FROM [parc_db].[dbo].[SD_Tickets] t
            WHERE CAST(t.SentOn AS DATE) = '${date}'
            AND t.DeletedOn IS NULL
            AND NOT EXISTS (
                SELECT 1
                FROM [parc_db].[dbo].[SD_TicketHistory] h
                WHERE h.TicketId = t.TicketId
                AND h.TicketStatus IN (3, 6, 11)
            );`
        );
    }


    // le nombre de tickets qui ont été créés par mois et année spécifiés
    async getNbTicketsByMonthYear(month: number, year: number): Promise<any> {
        return this.dataSource.query(
            `SELECT COUNT(DISTINCT t.TicketId)
            FROM [parc_db].[dbo].[SD_Tickets] t
            WHERE MONTH(t.SentOn) = ${month} AND YEAR(t.SentOn) = ${year}
            AND t.DeletedOn IS NULL
            AND NOT EXISTS (
                SELECT 1
                FROM [parc_db].[dbo].[SD_TicketHistory] h
                WHERE h.TicketId = t.TicketId
                AND h.TicketStatus IN (3, 6, 11)
            );`
        );
    }

    
    // le nombre de tickets qui ont été créés dans une année spécifiés
    async getNbTicketsByYear(year: number): Promise<any> {
        return this.dataSource.query(
            `SELECT COUNT(DISTINCT t.TicketId)
            FROM [parc_db].[dbo].[SD_Tickets] t
            WHERE YEAR(t.SentOn) = '${year}'
            AND t.DeletedOn IS NULL
            AND NOT EXISTS (
                SELECT 1
                FROM [parc_db].[dbo].[SD_TicketHistory] h
                WHERE h.TicketId = t.TicketId
                AND h.TicketStatus IN (3, 6, 11)
            );`
        );
    }


    // le nombre de tickets qui ont été résolus à la date spécifiée
    async getNbTicketsResolved(date: string): Promise<any> {
        return this.dataSource.query(
            `SELECT COUNT(*)
            FROM [parc_db].[dbo].[SD_Tickets]
            WHERE CAST(ResolutionDate AS DATE) = '${date}'
            ;`,
        );
    }


    // le nombre de tickets qui ont été résolus par mois et année spécifiés
    async getNbTicketsResolvedByMonthYear(month: number, year: number): Promise<any> {
        return this.dataSource.query(
            `SELECT COUNT(*)
            FROM [parc_db].[dbo].[SD_Tickets]
            WHERE MONTH(ResolutionDate) = ${month} AND YEAR(ResolutionDate) = ${year};`
        );
    }


    // le nombre de tickets qui ont été résolus dans année spécifiés
    async getNbTicketsResolvedByYear(year: number): Promise<any> {
        return this.dataSource.query(
            `SELECT COUNT(*)
            FROM [parc_db].[dbo].[SD_Tickets]
            WHERE YEAR(ResolutionDate) = ${year};`
        );
    }
    

    // liste des tickets créés à une date donnée, avec leur titre, le nom de l'utilisateur qui les a créés et l'heure de création
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


    async getTicketsByOperator(date: string): Promise<any> {
        return this.dataSource.query(
            `SELECT o.operator_helpdesk_login AS operator, 
            COUNT(DISTINCT t.TicketId) AS ticketCount
            FROM [parc_db].[dbo].[operator] o
            LEFT JOIN [parc_db].[dbo].[SD_Tickets] t ON o.id_operator = t.AssignedToId
            WHERE CAST(t.SentOn AS DATE) = '${date}'
            GROUP BY o.operator_helpdesk_login;`
        );
    }


    async getTicketsByOperatorByMonthYear(month: number, year: number): Promise<any> {
        return this.dataSource.query(
            `SELECT o.operator_helpdesk_login AS operator, 
                    COUNT(DISTINCT t.TicketId) AS ticketCount
            FROM [parc_db].[dbo].[operator] o
            LEFT JOIN [parc_db].[dbo].[SD_Tickets] t ON o.id_operator = t.AssignedToId
            WHERE MONTH(t.SentOn) = ${month} AND YEAR(t.SentOn) = ${year}
            GROUP BY o.operator_helpdesk_login;`
        );
    }


    async getTicketsByOperatorByYear(year: number): Promise<any> {
        return this.dataSource.query(
            `SELECT o.operator_helpdesk_login AS operator, 
                    COUNT(DISTINCT t.TicketId) AS ticketCount
            FROM [parc_db].[dbo].[operator] o
            LEFT JOIN [parc_db].[dbo].[SD_Tickets] t ON o.id_operator = t.AssignedToId
            WHERE YEAR(t.SentOn) = ${year}
            GROUP BY o.operator_helpdesk_login;`
        );
    }


    async getTicketsTypes(date: string): Promise<any> {
        return this.dataSource.query(
            `SELECT tc.TicketClassLabel, COUNT(*) AS NombreTickets
            FROM [parc_db].[dbo].[SD_Tickets] t
            LEFT JOIN [parc_db].[dbo].[SD_TicketClasses] tc ON t.Category = tc.TicketClassId
            WHERE CAST(t.SentOn AS DATE) = '${date}'
            GROUP BY tc.TicketClassLabel;`
        );
    }


    async getTicketsTypesByMonthYear(month: number, year: number): Promise<any> {
        return this.dataSource.query(
            `SELECT tc.TicketClassLabel, COUNT(*) AS NombreTickets
            FROM [parc_db].[dbo].[SD_Tickets] t
            LEFT JOIN [parc_db].[dbo].[SD_TicketClasses] tc ON t.Category = tc.TicketClassId
            WHERE MONTH(t.SentOn) = ${month} AND YEAR(t.SentOn) = ${year}
            GROUP BY tc.TicketClassLabel;`
        );
    }


    async getTicketsTypesByYear(year: number): Promise<any> {
        return this.dataSource.query(
            `SELECT tc.TicketClassLabel, COUNT(*) AS NombreTickets
            FROM [parc_db].[dbo].[SD_Tickets] t
            LEFT JOIN [parc_db].[dbo].[SD_TicketClasses] tc ON t.Category = tc.TicketClassId
            WHERE YEAR(t.SentOn) = ${year}
            GROUP BY tc.TicketClassLabel;`
        );
    }
    
}