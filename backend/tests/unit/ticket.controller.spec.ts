import { Test, TestingModule } from '@nestjs/testing';
import { TicketController } from '../../src/ticket/ticket.controller';
import { TicketService } from '../../src/ticket/ticket.service';
import { NotFoundException } from '@nestjs/common';

describe('TicketController', () => {
    let ticketController: TicketController;
    let ticketService: TicketService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
        controllers: [TicketController],
        providers: [
            {
            provide: TicketService,
            useValue: {
                getNbTicketsCreated: jest.fn().mockResolvedValue([{ '': 5 }]),
                getNbTicketsByMonthYear: jest.fn().mockResolvedValue([{ '': 10 }]),
                getNbTicketsByYear: jest.fn().mockResolvedValue([{ '': 50 }]),
                getNbTicketsResolved: jest.fn().mockResolvedValue([{ '': 2 }]),
                getNbTicketsResolvedByMonthYear: jest.fn().mockResolvedValue([{ '': 4 }]),
                getNbTicketsResolvedByYear: jest.fn().mockResolvedValue([{ '': 20 }]),
                getTickets: jest.fn().mockResolvedValue([{ id: 1, name: 'Test Ticket' }]),
                getTicketById: jest.fn().mockImplementation(id => {
                if (id === 1) return Promise.resolve({ id: 1, name: 'Test Ticket' });
                throw new NotFoundException();
                }),
                getTicketsByOperator: jest.fn().mockResolvedValue([{ operator: 'A', count: 3 }]),
            },
            },
        ],
        }).compile();

        ticketController = module.get<TicketController>(TicketController);
        ticketService = module.get<TicketService>(TicketService);
    });

    it('should be defined', () => {
        expect(ticketController).toBeDefined();
    });

    it('should return count of created tickets', async () => {
        await expect(ticketController.getNbTicketsCreated('2025-01-01')).resolves.toEqual({ count: 5 });
        expect(ticketService.getNbTicketsCreated).toHaveBeenCalledWith('2025-01-01');
    });

    it('should return count of created tickets by month and year', async () => {
        await expect(ticketController.getNbTicketsByMonthYear(1, 2025)).resolves.toEqual({ count: 10 });
        expect(ticketService.getNbTicketsByMonthYear).toHaveBeenCalledWith(1, 2025);
    });

    it('should return count of created tickets by year', async () => {
        await expect(ticketController.getNbTicketsByYear(2025)).resolves.toEqual({ count: 50 });
        expect(ticketService.getNbTicketsByYear).toHaveBeenCalledWith(2025);
    });

    it('should return ticket by ID if found', async () => {
        await expect(ticketController.getTicketById(1)).resolves.toEqual({ id: 1, name: 'Test Ticket' });
        expect(ticketService.getTicketById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if ticket ID not found', async () => {
        await expect(ticketController.getTicketById(999)).rejects.toThrow(NotFoundException);
        expect(ticketService.getTicketById).toHaveBeenCalledWith(999);
    });

    it('should return tickets list', async () => {
        await expect(ticketController.getTickets('2025-01-01')).resolves.toEqual([{ id: 1, name: 'Test Ticket' }]);
        expect(ticketService.getTickets).toHaveBeenCalledWith('2025-01-01');
    });
});