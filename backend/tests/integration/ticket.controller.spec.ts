import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TicketController } from '../../src/ticket/ticket.controller';
import { TicketService } from '../../src/ticket/ticket.service';

describe('TicketController (e2e)', () => {
    let app: INestApplication;
    let ticketService: TicketService;

    const mockTicketService = {
        getNbTicketsCreated: jest.fn().mockResolvedValue([{ '': 10 }]),
        getNbTicketsByMonthYear: jest.fn().mockResolvedValue([{ '': 20 }]),
        getNbTicketsByYear: jest.fn().mockResolvedValue([{ '': 30 }]),
        getNbTicketsResolved: jest.fn().mockResolvedValue([{ '': 5 }]),
        getNbTicketsResolvedByMonthYear: jest.fn().mockResolvedValue([{ '': 15 }]),
        getNbTicketsResolvedByYear: jest.fn().mockResolvedValue([{ '': 25 }]),
        getTickets: jest.fn().mockResolvedValue([{ id: 1, title: 'Test Ticket' }]),
        getTicketById: jest.fn().mockResolvedValue({ id: 1, title: 'Test Ticket' }),
        getTicketsByOperator: jest.fn().mockResolvedValue([{ operator: 'Alice', count: 3 }]),
        getTicketsByOperatorByMonthYear: jest.fn().mockResolvedValue([{ operator: 'Bob', count: 5 }]),
        getTicketsByOperatorByYear: jest.fn().mockResolvedValue([{ operator: 'Charlie', count: 8 }]),
        getTicketsTypes: jest.fn().mockResolvedValue([{ type: 'Bug', count: 12 }]),
        getTicketsTypesByMonthYear: jest.fn().mockResolvedValue([{ type: 'Feature', count: 7 }]),
        getTicketsTypesByYear: jest.fn().mockResolvedValue([{ type: 'Support', count: 9 }]),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [TicketController],
        providers: [{ provide: TicketService, useValue: mockTicketService }],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
        ticketService = moduleFixture.get<TicketService>(TicketService);
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /tickets/count-created should return count of created tickets', async () => {
        const response = await request(app.getHttpServer()).get('/tickets/count-created?date=2024-03-01');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ count: 10 });
    });

    it('GET /tickets/count-created-by-month-year should return count of tickets by month & year', async () => {
        const response = await request(app.getHttpServer()).get('/tickets/count-created-by-month-year?month=3&year=2024');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ count: 20 });
    });

    it('GET /tickets/count-created-by-year should return count of tickets by year', async () => {
        const response = await request(app.getHttpServer()).get('/tickets/count-created-by-year?year=2024');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ count: 30 });
    });

    it('GET /tickets/ticket/:id should return a ticket by id', async () => {
        const response = await request(app.getHttpServer()).get('/tickets/ticket/1');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ id: 1, title: 'Test Ticket' });
    });

    it('GET /tickets/ticket/:id should return 404 for non-existing ticket', async () => {
        jest.spyOn(ticketService, 'getTicketById').mockRejectedValueOnce(new Error('Not Found'));
        const response = await request(app.getHttpServer()).get('/tickets/ticket/999');
        expect(response.status).toBe(404);
    });

    it('GET /tickets/tickets should return all tickets', async () => {
        const response = await request(app.getHttpServer()).get('/tickets/tickets?date=2024-03-01');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ id: 1, title: 'Test Ticket' }]);
    });

    it('GET /tickets/tickets-by-operator should return tickets by operator', async () => {
        const response = await request(app.getHttpServer()).get('/tickets/tickets-by-operator?date=2024-03-01');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ operator: 'Alice', count: 3 }]);
    });

    it('GET /tickets/tickets-types should return ticket types', async () => {
        const response = await request(app.getHttpServer()).get('/tickets/tickets-types?date=2024-03-01');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ type: 'Bug', count: 12 }]);
    });
});
