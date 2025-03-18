// ticket.controller.tsx
import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';

@Controller('tickets')
export class TicketController {
    constructor(private readonly ticketService: TicketService) {}

    @Get('count-created')
    async getNbTicketsCreated(@Query('date') date: string) {
        try {
            const result = await this.ticketService.getNbTicketsCreated(date);
            return { count: result[0][''] };
        } catch (err) {
            console.error("Erreur dans la récupération : ", err);
            throw err;
        }
    }


    @Get('count-created-by-month-year')
    async getNbTicketsByMonthYear(
        @Query('month') month: number,
        @Query('year') year: number
    ) {
        try {
            const result = await this.ticketService.getNbTicketsByMonthYear(month, year);
            return { count: result[0][''] };
        } catch (err) {
            console.error("Erreur dans la récupération : ", err);
            throw err;
        }
    }


    @Get('count-created-by-year')
    async getNbTicketsByYear(
        @Query('year') year: number
    ) {
        try {
            const result = await this.ticketService.getNbTicketsByYear(year);
            return { count: result[0][''] };
        } catch (err) {
            console.error("Erreur dans la récupération : ", err);
            throw err;
        }
    }


    @Get('count-resolved')
    async getNbTicketsResolved(@Query('date') date: string) {
        try {
            const result = await this.ticketService.getNbTicketsResolved(date);
            return { count: result[0][''] };
        } catch (err) {
            console.error("Erreur dans la récupération : ", err);
            throw err;
        } 
    }


    @Get('count-resolved-by-month-year')
    async getNbTicketsResolvedByMonthYear(
        @Query('month') month: number,
        @Query('year') year: number
    ) {
        try {
            const result = await this.ticketService.getNbTicketsResolvedByMonthYear(month, year);
            return { count: result[0][''] };
        } catch (err) {
            console.error("Erreur dans la récupération : ", err);
            throw err;
        }
    }


    @Get('count-resolved-by-year')
    async getNbTicketsResolvedByYear(
        @Query('year') year: number
    ) {
        try {
            const result = await this.ticketService.getNbTicketsResolvedByYear(year);
            return { count: result[0][''] };
        } catch (err) {
            console.error("Erreur dans la récupération : ", err);
            throw err;
        }
    }


    @Get('tickets')
    async getTickets(@Query('date') date: string) {
        try {
            const result = await this.ticketService.getTickets(date);
            return result;
        } catch (err) {
            console.error("Erreur dans la récupération : ", err);
            throw err;
        }
    }


    @Get('ticket/:id')
    async getTicketById(@Param('id') id: number) {
        try {
        const ticket = await this.ticketService.getTicketById(id);
        return ticket;
        } catch (error) {
        if (error instanceof NotFoundException) {
            throw error;
        }
        throw new NotFoundException(`Ticket with ID ${id} not found`);
        }
    }


    @Get('tickets-by-operator')
    async getTicketsByOperator(@Query('date') date: string) {
        try {
            const result = await this.ticketService.getTicketsByOperator(date);
            return result;
        } catch (err) {
            console.error("Erreur dans la récupération : ", err);
            throw err;
        }
    }


    @Get('tickets-by-operator-by-month-year')
    async getTicketsByOperatorByMonthYear(
        @Query('month') month: number,
        @Query('year') year: number
    ) {
        try {
            const result = await this.ticketService.getTicketsByOperatorByMonthYear(month, year);
            return result;
        } catch (err) {
            console.error("Erreur dans la récupération : ", err);
            throw err;
        }
    }


    @Get('tickets-by-operator-by-year')
    async getTicketsByOperatorByYear(
        @Query('year') year: number
    ) {
        try {
            const result = await this.ticketService.getTicketsByOperatorByYear(year);
            return result;
        } catch (err) {
            console.error("Erreur dans la récupération : ", err);
            throw err;
        }
    }


    @Get('tickets-types')
    async getTicketsTypes(@Query('date') date: string) {
        try {
            const result = await this.ticketService.getTicketsTypes(date);
            return result;
        } catch (err) {
            console.error("Erreur dans la récupération : ", err);
            throw err;
        }
    }


    @Get('tickets-types-by-month-year')
    async getTicketsTypesByMonthYear(
        @Query('month') month: number,
        @Query('year') year: number
    ) {
        try {
            const result = await this.ticketService.getTicketsTypesByMonthYear(month, year);
            return result;
        } catch (err) {
            console.error("Erreur dans la récupération : ", err);
            throw err;
        }
    }


    @Get('tickets-types-by-year')
    async getTicketsTypesByYear(
        @Query('year') year: number
    ) {
        try {
            const result = await this.ticketService.getTicketsTypesByYear(year);
            return result;
        } catch (err) {
            console.error("Erreur dans la récupération : ", err);
            throw err;
        }
    }


}