import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query, InternalServerErrorException, Logger } from '@nestjs/common';

import { TicketService } from './ticket.service';

/**
 * Contrôleur gérant les requêtes HTTP relatives aux données des tickets (probablement Clarilog).
 * Expose des points d'accès pour récupérer des listes de tickets, des détails,
 * et diverses statistiques (comptages, regroupements) selon différents critères temporels.
 * Route de base : /tickets
 */
@Controller('tickets')
export class TicketController {
    private readonly logger = new Logger(TicketController.name);
    /**
     * Injecte le service TicketService pour accéder à la logique métier et aux données des tickets.
     * @param ticketService Le service gérant l'accès aux données des tickets.
     */
    constructor(private readonly ticketService: TicketService) {}

    /**
     * Récupère le nombre total de tickets créés pour une date spécifique.
     * Route : GET /tickets/count-created?date=YYYY-MM-DD
     * @param date La date au format 'YYYY-MM-DD'.
     * @returns Un objet contenant le nombre de tickets créés `{ count: number }`. Retourne 0 si erreur ou aucun résultat.
     * @throws {InternalServerErrorException} Si une erreur serveur survient.
     */
    @Get('count-created')
    async getNbTicketsCreated(@Query('date') date: string) {
        try {
            const result = await this.ticketService.getNbTicketsCreated(date);
            if (result && result.length > 0 && result[0].count !== undefined) {
                return { count: result[0].count };
            }
            return { count: 0 };
        } catch (err) {
            this.logger.error(`Erreur dans GET /count-created (date: ${date}):`, err.stack || err);
            throw new InternalServerErrorException('Erreur serveur lors du comptage des tickets créés.');
        }
    }

    /**
     * Récupère le nombre total de tickets créés pour un mois et une année spécifiques.
     * Route : GET /tickets/count-created-by-month-year?month=M&year=YYYY
     * @param month Le mois (numérique, 1-12).
     * @param year L'année (numérique).
     * @returns Un objet contenant le nombre de tickets créés `{ count: number }`. Retourne 0 si erreur ou aucun résultat.
     * @throws {InternalServerErrorException} Si une erreur serveur survient.
     */
    @Get('count-created-by-month-year')
    async getNbTicketsByMonthYear(
        @Query('month', ParseIntPipe) month: number,
        @Query('year', ParseIntPipe) year: number
    ) {
        try {
            const result = await this.ticketService.getNbTicketsByMonthYear(month, year);
            if (result && result.length > 0 && result[0].count !== undefined) {
                return { count: result[0].count };
            }
            this.logger.warn(`getNbTicketsByMonthYear (${month}/${year}) a retourné un résultat inattendu: ${JSON.stringify(result)}`);
            return { count: 0 };
        } catch (err) {
            this.logger.error(`Erreur dans GET /count-created-by-month-year (${month}/${year}):`, err.stack || err);
            throw new InternalServerErrorException('Erreur serveur lors du comptage des tickets créés.');
        }
    }

    /**
     * Récupère le nombre total de tickets créés pour une année spécifique.
     * Route : GET /tickets/count-created-by-year?year=YYYY
     * @param year L'année (numérique).
     * @returns Un objet contenant le nombre de tickets créés `{ count: number }`. Retourne 0 si erreur ou aucun résultat.
     * @throws {InternalServerErrorException} Si une erreur serveur survient.
     */
    @Get('count-created-by-year')
    async getNbTicketsByYear(
        @Query('year', ParseIntPipe) year: number
    ) {
        try {
            const result = await this.ticketService.getNbTicketsByYear(year);
            if (result && result.length > 0 && result[0].count !== undefined) {
                return { count: result[0].count };
            }
            this.logger.warn(`getNbTicketsByYear (${year}) a retourné un résultat inattendu: ${JSON.stringify(result)}`);
            return { count: 0 };
        } catch (err) {
            this.logger.error(`Erreur dans GET /count-created-by-year (${year}):`, err.stack || err);
            throw new InternalServerErrorException('Erreur serveur lors du comptage des tickets créés.');
        }
    }

    /**
     * Récupère le nombre total de tickets résolus pour une date spécifique.
     * Route : GET /tickets/count-resolved?date=YYYY-MM-DD
     * @param date La date au format 'YYYY-MM-DD'.
     * @returns Un objet contenant le nombre de tickets résolus `{ count: number }`. Retourne 0 si erreur ou aucun résultat.
     * @throws {InternalServerErrorException} Si une erreur serveur survient.
     */
    @Get('count-resolved')
    async getNbTicketsResolved(@Query('date') date: string) {
        try {
            const result = await this.ticketService.getNbTicketsResolved(date);
            if (result && result.length > 0 && result[0].count !== undefined) {
                return { count: result[0].count };
            }
            this.logger.warn(`getNbTicketsResolved (${date}) a retourné un résultat inattendu: ${JSON.stringify(result)}`);
            return { count: 0 };
        } catch (err) {
            this.logger.error(`Erreur dans GET /count-resolved (${date}):`, err.stack || err);
            throw new InternalServerErrorException('Erreur serveur lors du comptage des tickets résolus.');
        }
    }

    /**
     * Récupère le nombre total de tickets résolus pour un mois et une année spécifiques.
     * Route : GET /tickets/count-resolved-by-month-year?month=M&year=YYYY
     * @param month Le mois (numérique, 1-12).
     * @param year L'année (numérique).
     * @returns Un objet contenant le nombre de tickets résolus `{ count: number }`. Retourne 0 si erreur ou aucun résultat.
     * @throws {InternalServerErrorException} Si une erreur serveur survient.
     */
    @Get('count-resolved-by-month-year')
    async getNbTicketsResolvedByMonthYear(
        @Query('month', ParseIntPipe) month: number,
        @Query('year', ParseIntPipe) year: number
    ) {
        try {
            const result = await this.ticketService.getNbTicketsResolvedByMonthYear(month, year);
            if (result && result.length > 0 && result[0].count !== undefined) {
                return { count: result[0].count };
            }
            this.logger.warn(`getNbTicketsResolvedByMonthYear (${month}/${year}) a retourné un résultat inattendu: ${JSON.stringify(result)}`);
            return { count: 0 };
        } catch (err) {
            this.logger.error(`Erreur dans GET /count-resolved-by-month-year (${month}/${year}):`, err.stack || err);
            throw new InternalServerErrorException('Erreur serveur lors du comptage des tickets résolus.');
        }
    }

    /**
     * Récupère le nombre total de tickets résolus pour une année spécifique.
     * Route : GET /tickets/count-resolved-by-year?year=YYYY
     * @param year L'année (numérique).
     * @returns Un objet contenant le nombre de tickets résolus `{ count: number }`. Retourne 0 si erreur ou aucun résultat.
     * @throws {InternalServerErrorException} Si une erreur serveur survient.
     */
    @Get('count-resolved-by-year')
    async getNbTicketsResolvedByYear(
        @Query('year', ParseIntPipe) year: number
    ) {
        try {
            const result = await this.ticketService.getNbTicketsResolvedByYear(year);
            if (result && result.length > 0 && result[0].count !== undefined) {
                return { count: result[0].count };
            }
            this.logger.warn(`getNbTicketsResolvedByYear (${year}) a retourné un résultat inattendu: ${JSON.stringify(result)}`);
            return { count: 0 };
        } catch (err) {
            this.logger.error(`Erreur dans GET /count-resolved-by-year (${year}):`, err.stack || err);
            throw new InternalServerErrorException('Erreur serveur lors du comptage des tickets résolus.');
        }
    }

    /**
     * Récupère la liste des tickets pour une date spécifique.
     * Route : GET /tickets/tickets?date=YYYY-MM-DD
     * @param date La date au format 'YYYY-MM-DD'.
     * @returns Un tableau contenant les données des tickets pour cette date.
     * @throws {InternalServerErrorException} Si une erreur serveur survient.
     */
    @Get('tickets')
    async getTickets(@Query('date') date: string) {
        try {
            const result = await this.ticketService.getTickets(date);
            return result;
        } catch (err) {
            this.logger.error(`Erreur dans GET /tickets (date: ${date}):`, err.stack || err);
            throw new InternalServerErrorException('Erreur serveur lors de la récupération des tickets.');
        }
    }

    /**
     * Récupère les détails d'un ticket spécifique par son ID.
     * Route : GET /tickets/ticket/:id
     * @param id L'ID numérique du ticket.
     * @returns L'objet contenant les détails du ticket.
     * @throws {NotFoundException} Si le ticket avec l'ID spécifié n'est pas trouvé.
     * @throws {InternalServerErrorException} Si une autre erreur serveur survient.
     */
    @Get('ticket/:id')
    async getTicketById(@Param('id', ParseIntPipe) id: number) {
        try {
            const ticket = await this.ticketService.getTicketById(id);
            return ticket;
        } catch (error) {
            if (!(error instanceof NotFoundException)) {
                this.logger.error(`Erreur dans GET /ticket/${id}:`, error.stack || error);
                throw new InternalServerErrorException('Erreur serveur lors de la récupération du détail du ticket.');
            }
            throw error;
        }
    }

    /**
     * Récupère le nombre de tickets groupés par opérateur pour une date spécifique.
     * Route : GET /tickets/tickets-by-operator?date=YYYY-MM-DD
     * @param date La date au format 'YYYY-MM-DD'.
     * @returns Un tableau d'objets, chacun représentant un opérateur et son nombre de tickets.
     * @throws {InternalServerErrorException} Si une erreur serveur survient.
     */
    @Get('tickets-by-operator')
    async getTicketsByOperator(@Query('date') date: string) {
        try {
            const result = await this.ticketService.getTicketsByOperator(date);
            return result;
        } catch (err) {
            this.logger.error(`Erreur dans GET /tickets-by-operator (date: ${date}):`, err.stack || err);
            throw new InternalServerErrorException('Erreur serveur lors de la récupération des tickets par opérateur.');
        }
    }

    /**
     * Récupère le nombre de tickets groupés par opérateur pour un mois et une année spécifiques.
     * Route : GET /tickets/tickets-by-operator-by-month-year?month=M&year=YYYY
     * @param month Le mois (numérique, 1-12).
     * @param year L'année (numérique).
     * @returns Un tableau d'objets, chacun représentant un opérateur et son nombre de tickets.
     * @throws {InternalServerErrorException} Si une erreur serveur survient.
     */
    @Get('tickets-by-operator-by-month-year')
    async getTicketsByOperatorByMonthYear(
        @Query('month', ParseIntPipe) month: number,
        @Query('year', ParseIntPipe) year: number
    ) {
        try {
            const result = await this.ticketService.getTicketsByOperatorByMonthYear(month, year);
            return result;
        } catch (err) {
            this.logger.error(`Erreur GET /tickets-by-operator-by-month-year (${month}/${year}):`, err.stack || err);
            throw new InternalServerErrorException('Erreur serveur lors de la récupération des tickets par opérateur.');
        }
    }

    /**
     * Récupère le nombre de tickets groupés par opérateur pour une année spécifique.
     * Route : GET /tickets/tickets-by-operator-by-year?year=YYYY
     * @param year L'année (numérique).
     * @returns Un tableau d'objets, chacun représentant un opérateur et son nombre de tickets.
     * @throws {InternalServerErrorException} Si une erreur serveur survient.
     */
    @Get('tickets-by-operator-by-year')
    async getTicketsByOperatorByYear(
        @Query('year', ParseIntPipe) year: number
    ) {
        try {
            const result = await this.ticketService.getTicketsByOperatorByYear(year);
            return result;
        } catch (err) {
            this.logger.error(`Erreur GET /tickets-by-operator-by-year (${year}):`, err.stack || err);
            throw new InternalServerErrorException('Erreur serveur lors de la récupération des tickets par opérateur.');
        }
    }

    /**
     * Récupère le nombre de tickets groupés par type (classe) pour une date spécifique.
     * Route : GET /tickets/tickets-types?date=YYYY-MM-DD
     * @param date La date au format 'YYYY-MM-DD'.
     * @returns Un tableau d'objets, chacun représentant un type de ticket et son nombre.
     * @throws {InternalServerErrorException} Si une erreur serveur survient.
     */
    @Get('tickets-types')
    async getTicketsTypes(@Query('date') date: string) {
        try {
            const result = await this.ticketService.getTicketsTypes(date);
            return result;
        } catch (err) {
            this.logger.error(`Erreur GET /tickets-types (date: ${date}):`, err.stack || err);
            throw new InternalServerErrorException('Erreur serveur lors de la récupération des types de tickets.');
        }
    }

    /**
     * Récupère le nombre de tickets groupés par type (classe) pour un mois et une année spécifiques.
     * Route : GET /tickets/tickets-types-by-month-year?month=M&year=YYYY
     * @param month Le mois (numérique, 1-12).
     * @param year L'année (numérique).
     * @returns Un tableau d'objets, chacun représentant un type de ticket et son nombre.
     * @throws {InternalServerErrorException} Si une erreur serveur survient.
     */
    @Get('tickets-types-by-month-year')
    async getTicketsTypesByMonthYear(
        @Query('month', ParseIntPipe) month: number,
        @Query('year', ParseIntPipe) year: number
    ) {
        try {
            const result = await this.ticketService.getTicketsTypesByMonthYear(month, year);
            return result;
        } catch (err) {
            this.logger.error(`Erreur GET /tickets-types-by-month-year (${month}/${year}):`, err.stack || err);
            throw new InternalServerErrorException('Erreur serveur lors de la récupération des types de tickets.');
        }
    }

    /**
     * Récupère le nombre de tickets groupés par type (classe) pour une année spécifique.
     * Route : GET /tickets/tickets-types-by-year?year=YYYY
     * @param year L'année (numérique).
     * @returns Un tableau d'objets, chacun représentant un type de ticket et son nombre.
     * @throws {InternalServerErrorException} Si une erreur serveur survient.
     */
    @Get('tickets-types-by-year')
    async getTicketsTypesByYear(
        @Query('year', ParseIntPipe) year: number
    ) {
        try {
            const result = await this.ticketService.getTicketsTypesByYear(year);
            return result;
        } catch (err) {
            this.logger.error(`Erreur GET /tickets-types-by-year (${year}):`, err.stack || err);
            throw new InternalServerErrorException('Erreur serveur lors de la récupération des types de tickets.');
        }
    }
}