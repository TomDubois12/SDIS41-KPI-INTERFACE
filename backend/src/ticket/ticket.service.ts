// src/ticket.service.ts (Version Sécurisée)

import { Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common'; // forwardRef si toujours nécessaire pour NotificationService
import { DataSource } from 'typeorm';
import { NotificationService } from '../notifications/notifications.service'; // Garder si toujours injecté
import { getDataSourceToken } from '@nestjs/typeorm';

@Injectable()
export class TicketService {
    private readonly logger = new Logger(TicketService.name);
    // Garder l'injection de la DataSource comme avant
    // Supposons que l'injection de NotificationService n'est plus nécessaire ici après les refactorings précédents
    constructor(
        @Inject(getDataSourceToken('parc_db_connection'))
        private readonly dataSource: DataSource,
        // Retirer l'injection si NotificationService n'est plus utilisé DANS CE service
        // @Inject(forwardRef(() => NotificationService))
        // private readonly notificationService: NotificationService,
    ) {}

    // --- MÉTHODES AVEC REQUÊTES PARAMÉTRÉES ET ALIAS 'count' ---

    // le nombre de tickets qui ont été créés à la date spécifiée
    async getNbTicketsCreated(date: string): Promise<{ count: number }[]> { // Type de retour précisé
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
        // Passer la date comme paramètre dans un tableau
        return this.dataSource.query(query, [date]);
    }


    // le nombre de tickets créés par mois et année spécifiés
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
        // Passer mois et année comme paramètres
        return this.dataSource.query(query, [month, year]);
    }


    // le nombre de tickets créés dans une année spécifiée
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


    // le nombre de tickets résolus à la date spécifiée
    async getNbTicketsResolved(date: string): Promise<{ count: number }[]> {
        const query = `
            SELECT COUNT(*) AS count
            FROM [parc_db].[dbo].[SD_Tickets]
            WHERE CAST(ResolutionDate AS DATE) = @0;`;
        return this.dataSource.query(query, [date]);
    }


    // le nombre de tickets résolus par mois et année spécifiés
    async getNbTicketsResolvedByMonthYear(month: number, year: number): Promise<{ count: number }[]> {
        const query = `
            SELECT COUNT(*) AS count
            FROM [parc_db].[dbo].[SD_Tickets]
            WHERE MONTH(ResolutionDate) = @0 AND YEAR(ResolutionDate) = @1;`;
        return this.dataSource.query(query, [month, year]);
    }


    // le nombre de tickets résolus dans année spécifiée
    async getNbTicketsResolvedByYear(year: number): Promise<{ count: number }[]> {
        const query = `
            SELECT COUNT(*) AS count
            FROM [parc_db].[dbo].[SD_Tickets]
            WHERE YEAR(ResolutionDate) = @0;`;
        return this.dataSource.query(query, [year]);
    }


    // liste des tickets créés à une date donnée (SANS la logique de notification)
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
             // Pas de boucle de notification ici
             return tickets;
        } catch (error) {
             this.logger.error('[getTickets] Service: Error fetching tickets:', error instanceof Error ? error.stack : error);
             throw error; // Renvoyer l'erreur pour une gestion centralisée
        }
    }


    // Détails d'un ticket par ID
    async getTicketById(id: number): Promise<any> {
        // S'assurer que l'ID est bien un nombre pour éviter injection via conversion implicite
        if (isNaN(id)) {
             throw new NotFoundException(`Ticket ID invalid: ${id}`);
        }
        const idParam = Number(id); // Assurer le type Number

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
            // Si ce n'est pas une NotFoundException lancée par nous, logguer l'erreur interne
            if (!(error instanceof NotFoundException)) {
                this.logger.error(`[getTicketById] Service: Erreur pour ID ${idParam}:`, error instanceof Error ? error.stack : error);
            }
            // Renvoyer l'erreur (NotFound ou autre)
            throw error;
        }
    }


    // Tickets par opérateur pour une date
    async getTicketsByOperator(date: string): Promise<any> {
        const query = `
            SELECT o.operator_helpdesk_login AS operator, COUNT(DISTINCT t.TicketId) AS ticketCount
            FROM [parc_db].[dbo].[operator] o
            LEFT JOIN [parc_db].[dbo].[SD_Tickets] t ON o.id_operator = t.AssignedToId
            WHERE CAST(t.SentOn AS DATE) = @0
            GROUP BY o.operator_helpdesk_login;`;
        return this.dataSource.query(query, [date]);
    }


    // Tickets par opérateur pour mois/année
    async getTicketsByOperatorByMonthYear(month: number, year: number): Promise<any> {
        const query = `
            SELECT o.operator_helpdesk_login AS operator, COUNT(DISTINCT t.TicketId) AS ticketCount
            FROM [parc_db].[dbo].[operator] o
            LEFT JOIN [parc_db].[dbo].[SD_Tickets] t ON o.id_operator = t.AssignedToId
            WHERE MONTH(t.SentOn) = @0 AND YEAR(t.SentOn) = @1
            GROUP BY o.operator_helpdesk_login;`;
        return this.dataSource.query(query, [month, year]);
    }


    // Tickets par opérateur pour année
    async getTicketsByOperatorByYear(year: number): Promise<any> {
        const query = `
            SELECT o.operator_helpdesk_login AS operator, COUNT(DISTINCT t.TicketId) AS ticketCount
            FROM [parc_db].[dbo].[operator] o
            LEFT JOIN [parc_db].[dbo].[SD_Tickets] t ON o.id_operator = t.AssignedToId
            WHERE YEAR(t.SentOn) = @0
            GROUP BY o.operator_helpdesk_login;`;
        return this.dataSource.query(query, [year]);
    }


    // Types de tickets pour une date
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


    // Types de tickets pour mois/année
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


    // Types de tickets pour année
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

} // Fin classe TicketService