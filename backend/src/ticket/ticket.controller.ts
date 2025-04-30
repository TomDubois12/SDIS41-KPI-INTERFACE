import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query, InternalServerErrorException, Logger } from '@nestjs/common';

import { TicketService } from './ticket.service';

@Controller('tickets')
export class TicketController {
    private readonly logger = new Logger(TicketController.name);
    constructor(private readonly ticketService: TicketService) { }

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