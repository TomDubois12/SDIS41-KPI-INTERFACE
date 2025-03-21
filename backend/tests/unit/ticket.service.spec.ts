import { Test, TestingModule } from '@nestjs/testing';
import { TicketService } from '../../src/ticket/ticket.service';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('TicketService', () => {
    let service: TicketService;
    let dataSourceMock: Partial<DataSource>;

    beforeEach(async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {})
        dataSourceMock = {
        query: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
        providers: [
            TicketService,
            { provide: DataSource, useValue: dataSourceMock },
        ],
        }).compile();

        service = module.get<TicketService>(TicketService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getNbTicketsCreated', () => {
        it('should return the number of tickets created on a specific date', async () => {
        const date = '2025-03-20';
        const mockResult = [{ count: 5 }];
        (dataSourceMock.query as jest.Mock).mockResolvedValue(mockResult);

        const result = await service.getNbTicketsCreated(date);
        expect(result).toEqual(mockResult);
        expect(dataSourceMock.query).toHaveBeenCalledWith(expect.stringContaining(date));
        });
    });

    describe('getNbTicketsByMonthYear', () => {
        it('should return the number of tickets created in a specific month and year', async () => {
        const month = 3;
        const year = 2025;
        const mockResult = [{ count: 50 }];
        (dataSourceMock.query as jest.Mock).mockResolvedValue(mockResult);

        const result = await service.getNbTicketsByMonthYear(month, year);
        expect(result).toEqual(mockResult);
        expect(dataSourceMock.query).toHaveBeenCalledWith(expect.stringContaining(`MONTH(t.SentOn) = ${month}`));
        expect(dataSourceMock.query).toHaveBeenCalledWith(expect.stringContaining(`YEAR(t.SentOn) = ${year}`));
        });
    });

    describe('getTicketById', () => {
        it('should return a ticket when found', async () => {
        const id = 1;
        const mockTicket = [{ TicketId: id, Title: 'Test Ticket', CallerName: 'User1' }];
        const mockResolutionTime = [{ Minutes: 10, Secondes: 30 }];
        
        (dataSourceMock.query as jest.Mock)
            .mockResolvedValueOnce(mockTicket)
            .mockResolvedValueOnce(mockResolutionTime);

        const result = await service.getTicketById(id);
        expect(result).toEqual({ ...mockTicket[0], resolutionTime: mockResolutionTime[0] });
        });

        it('should throw NotFoundException when ticket is not found', async () => {
        const id = 99;
        (dataSourceMock.query as jest.Mock).mockResolvedValueOnce([]);

        await expect(service.getTicketById(id)).rejects.toThrow(NotFoundException);
        });
    });

    describe('getNbTicketsResolved', () => {
        it('should return the number of resolved tickets on a specific date', async () => {
        const date = '2025-03-20';
        const mockResult = [{ count: 10 }];
        (dataSourceMock.query as jest.Mock).mockResolvedValue(mockResult);

        const result = await service.getNbTicketsResolved(date);
        expect(result).toEqual(mockResult);
        });
    });
});
