import { Test, TestingModule } from '@nestjs/testing';
import { TicketService } from '../../src/ticket/ticket.service';
import { DataSource } from 'typeorm';

describe('TicketService', () => {
    let service: TicketService;
    let dataSource: DataSource;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
        providers: [
            TicketService,
            {
            provide: DataSource,
            useValue: {
                query: jest.fn(),
            },
            },
        ],
        }).compile();

        service = module.get<TicketService>(TicketService);
        dataSource = module.get<DataSource>(DataSource);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should get number of tickets created on a specific date', async () => {
        const mockResult = [{ count: 10 }];
        jest.spyOn(dataSource, 'query').mockResolvedValue(mockResult);

        const result = await service.getNbTicketsCreated('2025-03-20');
        expect(result).toEqual(mockResult);
        expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining("CAST(t.SentOn AS DATE) = '2025-03-20'"),
        );
    });

    it('should get number of tickets created by month and year', async () => {
        const mockResult = [{ count: 30 }];
        jest.spyOn(dataSource, 'query').mockResolvedValue(mockResult);

        const result = await service.getNbTicketsByMonthYear(3, 2025);
        expect(result).toEqual(mockResult);
        expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('MONTH(t.SentOn) = 3 AND YEAR(t.SentOn) = 2025'),
        );
    });

    it('should get number of tickets resolved on a specific date', async () => {
        const mockResult = [{ count: 5 }];
        jest.spyOn(dataSource, 'query').mockResolvedValue(mockResult);

        const result = await service.getNbTicketsResolved('2025-03-20');
        expect(result).toEqual(mockResult);
        expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining("CAST(ResolutionDate AS DATE) = '2025-03-20'"),
        );
    });
});
