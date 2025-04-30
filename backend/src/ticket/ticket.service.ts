import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TicketService {
    private readonly logger = new Logger(TicketService.name);
    constructor(
        @Inject(getDataSourceToken('parc_db_connection'))
        private readonly dataSource: DataSource,
    ) { }

    async getNbTicketsCreated(date: string): Promise<{ count: number }[]> {
        const query = `
            SELECT COUNT(DISTINCT t.TicketId) AS count
            FROM [parc_db].[dbo].[SD_Tickets] t
            WHERE CAST(t.SentOn AS DATE) = @0
                AND t.DeletedOn IS NULL
                AND NOT EXISTS (
                    SELECT 1
                    FROM [parc_db].[dbo].[SD_TicketHistory] h
                    WHERE h.TicketId = t.TicketId
                    AND h.TicketStatus IN (3, 6, 11)
                );`;
        return this.dataSource.query(query, [date]);
    }

    async getNbTicketsByMonthYear(month: number, year: number): Promise<{ count: number }[]> {
        const query = `
            SELECT COUNT(DISTINCT t.TicketId) AS count
            FROM [parc_db].[dbo].[SD_Tickets] t
            WHERE MONTH(t.SentOn) = @0 AND YEAR(t.SentOn) = @1
                AND t.DeletedOn IS NULL
                AND NOT EXISTS (
                    SELECT 1
                    FROM [parc_db].[dbo].[SD_TicketHistory] h
                    WHERE h.TicketId = t.TicketId
                    AND h.TicketStatus IN (3, 6, 11)
                );`;
        return this.dataSource.query(query, [month, year]);
    }

    async getNbTicketsByYear(year: number): Promise<{ count: number }[]> {
        const query = `
            SELECT COUNT(DISTINCT t.TicketId) AS count
            FROM [parc_db].[dbo].[SD_Tickets] t
            WHERE YEAR(t.SentOn) = @0
                AND t.DeletedOn IS NULL
                AND NOT EXISTS (
                    SELECT 1
                    FROM [parc_db].[dbo].[SD_TicketHistory] h
                    WHERE h.TicketId = t.TicketId
                    AND h.TicketStatus IN (3, 6, 11)
                );`;
        return this.dataSource.query(query, [year]);
    }

    async getNbTicketsResolved(date: string): Promise<{ count: number }[]> {
        const query = `
            SELECT COUNT(*) AS count
            FROM [parc_db].[dbo].[SD_Tickets]
            WHERE CAST(ResolutionDate AS DATE) = @0;`;
        return this.dataSource.query(query, [date]);
    }

    async getNbTicketsResolvedByMonthYear(month: number, year: number): Promise<{ count: number }[]> {
        const query = `
            SELECT COUNT(*) AS count
            FROM [parc_db].[dbo].[SD_Tickets]
            WHERE MONTH(ResolutionDate) = @0 AND YEAR(ResolutionDate) = @1;`;
        return this.dataSource.query(query, [month, year]);
    }

    async getNbTicketsResolvedByYear(year: number): Promise<{ count: number }[]> {
        const query = `
            SELECT COUNT(*) AS count
            FROM [parc_db].[dbo].[SD_Tickets]
            WHERE YEAR(ResolutionDate) = @0;`;
        return this.dataSource.query(query, [year]);
    }

    async getTickets(date: string): Promise<any[]> {
        this.logger.log(`[getTickets] Service: Date reçue : ${date}`);
        const query = `
            SELECT
                t.TicketId,
                t.Title,
                CASE
                    WHEN t.CallerId = -2 THEN 'Envoyé depuis un mail'
                    ELSE u.[user_park_helpdesk_login]
                END AS CallerName,
                CONVERT(VARCHAR, t.SentOn, 108) AS HeureDeCréation,
                t.ResolutionDate,
                CAST(t.SentOn AS DATE) AS SentOnDateRaw
            FROM [parc_db].[dbo].[SD_Tickets] t
            LEFT JOIN [user_park] u ON t.CallerId = u.id_user_park
            WHERE CAST(t.SentOn AS DATE) = @0;`;
        try {
            const tickets = await this.dataSource.query(query, [date]);
            this.logger.log(`[getTickets] Service: Nombre de tickets récupérés : ${tickets ? tickets.length : 0}`);
            return tickets;
        } catch (error) {
            this.logger.error('[getTickets] Service: Error fetching tickets:', error instanceof Error ? error.stack : error);
            throw error;
        }
    }

    async getTicketById(id: number): Promise<any> {
        if (isNaN(id)) {
            throw new NotFoundException(`Ticket ID invalid: ${id}`);
        }
        const idParam = Number(id);

        this.logger.debug(`[getTicketById] Service: Recherche ticket ID: ${idParam}`);
        const queryMain = `
            SELECT
                t.TicketId,
                CASE WHEN t.CallerId = -2 THEN 'Envoyé depuis un mail' ELSE u.[user_park_helpdesk_login] END AS CallerName,
                t.SentOn, t.Title, ts.StatusString AS TicketStatus, tc.TicketClassLabel AS Category,
                t.AssignedToId, op.operator_helpdesk_login AS AssignedToName,
                t.ResolutionDate, t.DescriptionText
            FROM [parc_db].[dbo].[SD_Tickets] t
            LEFT JOIN [user_park] u ON t.CallerId = u.id_user_park
            LEFT JOIN [parc_db].[dbo].[SD_TicketStatusStrings] ts ON t.TicketStatus = ts.TicketStatus AND ts.Language = 'fr'
            LEFT JOIN [parc_db].[dbo].[SD_TicketClasses] tc ON t.Category = tc.TicketClassId
            LEFT JOIN [parc_db].[dbo].[operator] op ON t.AssignedToId = op.id_operator
            WHERE t.TicketId = @0;`;

        const queryResolutionTime = `
            SELECT
                FLOOR(SUM(w.Duration * 60) / COUNT(DISTINCT t.TicketId)) AS Minutes,
                CAST((SUM(w.Duration * 60) / COUNT(DISTINCT t.TicketId) - FLOOR(SUM(w.Duration * 60) / COUNT(DISTINCT t.TicketId))) * 60 AS INT) AS Secondes
            FROM [parc_db].[dbo].[SD_Tickets] t
            JOIN [parc_db].[dbo].[SD_Planning] w ON t.TicketId = w.TicketId
            WHERE t.TicketId = @0;`;
        try {
            const result = await this.dataSource.query(queryMain, [idParam]);
            if (!result || result.length === 0) {
                throw new NotFoundException(`Ticket with ID ${idParam} not found`);
            }
            const ticket = result[0];
            const resolutionTimeResult = await this.dataSource.query(queryResolutionTime, [idParam]);
            ticket.resolutionTime = resolutionTimeResult[0] || { Minutes: 0, Secondes: 0 };
            this.logger.debug(`[getTicketById] Service: Ticket ID: ${idParam} trouvé.`);
            return ticket;
        } catch (error) {
            if (!(error instanceof NotFoundException)) {
                this.logger.error(`[getTicketById] Service: Erreur pour ID ${idParam}:`, error instanceof Error ? error.stack : error);
            }
            throw error;
        }
    }

    async getTicketsByOperator(date: string): Promise<any> {
        const query = `
            SELECT o.operator_helpdesk_login AS operator, COUNT(DISTINCT t.TicketId) AS ticketCount
            FROM [parc_db].[dbo].[operator] o
            LEFT JOIN [parc_db].[dbo].[SD_Tickets] t ON o.id_operator = t.AssignedToId
            WHERE CAST(t.SentOn AS DATE) = @0
            GROUP BY o.operator_helpdesk_login;`;
        return this.dataSource.query(query, [date]);
    }

    async getTicketsByOperatorByMonthYear(month: number, year: number): Promise<any> {
        const query = `
            SELECT o.operator_helpdesk_login AS operator, COUNT(DISTINCT t.TicketId) AS ticketCount
            FROM [parc_db].[dbo].[operator] o
            LEFT JOIN [parc_db].[dbo].[SD_Tickets] t ON o.id_operator = t.AssignedToId
            WHERE MONTH(t.SentOn) = @0 AND YEAR(t.SentOn) = @1
            GROUP BY o.operator_helpdesk_login;`;
        return this.dataSource.query(query, [month, year]);
    }

    async getTicketsByOperatorByYear(year: number): Promise<any> {
        const query = `
            SELECT o.operator_helpdesk_login AS operator, COUNT(DISTINCT t.TicketId) AS ticketCount
            FROM [parc_db].[dbo].[operator] o
            LEFT JOIN [parc_db].[dbo].[SD_Tickets] t ON o.id_operator = t.AssignedToId
            WHERE YEAR(t.SentOn) = @0
            GROUP BY o.operator_helpdesk_login;`;
        return this.dataSource.query(query, [year]);
    }

    async getTicketsTypes(date: string): Promise<any> {
        const query = `
            SELECT tc.TicketClassLabel, COUNT(t.TicketId) AS NombreTickets
            FROM [parc_db].[dbo].[SD_Tickets] t
            LEFT JOIN [parc_db].[dbo].[SD_TicketClasses] tc ON t.Category = tc.TicketClassId
            WHERE CAST(t.SentOn AS DATE) = @0
                AND t.DeletedOn IS NULL
                AND NOT EXISTS (
                    SELECT 1
                    FROM [parc_db].[dbo].[SD_TicketHistory] h
                    WHERE h.TicketId = t.TicketId
                    AND h.TicketStatus IN (3, 6, 11)
                )
            GROUP BY tc.TicketClassLabel;
        `;
        return this.dataSource.query(query, [date]);
    }

    async getTicketsTypesByMonthYear(month: number, year: number): Promise<any> {
        const query = `
            SELECT tc.TicketClassLabel, COUNT(t.TicketId) AS NombreTickets
            FROM [parc_db].[dbo].[SD_Tickets] t
            LEFT JOIN [parc_db].[dbo].[SD_TicketClasses] tc ON t.Category = tc.TicketClassId
            WHERE MONTH(t.SentOn) = @0 AND YEAR(t.SentOn) = @1
                AND t.DeletedOn IS NULL
                AND NOT EXISTS (
                    SELECT 1
                    FROM [parc_db].[dbo].[SD_TicketHistory] h
                    WHERE h.TicketId = t.TicketId
                    AND h.TicketStatus IN (3, 6, 11)
                )
            GROUP BY tc.TicketClassLabel;
        `;
        return this.dataSource.query(query, [month, year]);
    }

    async getTicketsTypesByYear(year: number): Promise<any> {
        const query = `
            SELECT tc.TicketClassLabel, COUNT(t.TicketId) AS NombreTickets
            FROM [parc_db].[dbo].[SD_Tickets] t
            LEFT JOIN [parc_db].[dbo].[SD_TicketClasses] tc ON t.Category = tc.TicketClassId
            WHERE YEAR(t.SentOn) = @0
                AND t.DeletedOn IS NULL
                AND NOT EXISTS (
                    SELECT 1
                    FROM [parc_db].[dbo].[SD_TicketHistory] h
                    WHERE h.TicketId = t.TicketId
                    AND h.TicketStatus IN (3, 6, 11)
                )
            GROUP BY tc.TicketClassLabel;
        `;
        return this.dataSource.query(query, [year]);
    }
}