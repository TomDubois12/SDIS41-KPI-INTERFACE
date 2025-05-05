import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { TicketController } from '../../src/ticket/ticket.controller';
import { TicketService } from '../../src/ticket/ticket.service';

const mockDataSource = {
  query: jest.fn(),
};

describe('TicketController <-> TicketService (Integration)', () => {
  let controller: TicketController;
  let service: TicketService;

  beforeEach(async () => {
    mockDataSource.query.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        TicketService,
        {
          provide: getDataSourceToken('parc_db_connection'),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<TicketController>(TicketController);
    service = module.get<TicketService>(TicketService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getNbTicketsCreated', () => {
    it('should call service.getNbTicketsCreated and return formatted count', async () => {
      const date = '2025-04-29';
      const dbResult = [{ count: 8 }];
      const expectedControllerResult = { count: 8 };

      mockDataSource.query.mockResolvedValue(dbResult);

      const result = await controller.getNbTicketsCreated(date);
      expect(result).toEqual(expectedControllerResult);
      expect(mockDataSource.query).toHaveBeenCalledTimes(1);
      expect(mockDataSource.query).toHaveBeenCalledWith(expect.any(String), [date]);
    });

    it('should return { count: 0 } if service returns empty data', async () => {
      const date = '2025-04-29';
      mockDataSource.query.mockResolvedValue([]);

      const result = await controller.getNbTicketsCreated(date);
      expect(result).toEqual({ count: 0 });
      expect(mockDataSource.query).toHaveBeenCalledWith(expect.any(String), [date]);
    });
  });

  describe('getTicketById', () => {
    it('should call service.getTicketById and return ticket if found', async () => {
      const id = 1;
      const mockTicketData = [{ TicketId: id, Title: 'Found Ticket' }];
      const mockResolutionTime = [{ Minutes: 5, Secondes: 0 }];

      mockDataSource.query
        .mockResolvedValueOnce(mockTicketData)
        .mockResolvedValueOnce(mockResolutionTime);

      const expectedControllerResult = { ...mockTicketData[0], resolutionTime: mockResolutionTime[0] };

      const result = await controller.getTicketById(id);
      expect(result).toEqual(expectedControllerResult);
      expect(mockDataSource.query).toHaveBeenCalledTimes(2);
      expect(mockDataSource.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE t.TicketId = @0'), [id]);
      expect(mockDataSource.query).toHaveBeenNthCalledWith(2, expect.stringContaining('WHERE t.TicketId = @0'), [id]);
    });

    it('should throw NotFoundException if service cannot find ticket', async () => {
      const id = 999;
      mockDataSource.query.mockResolvedValueOnce([]);
      await expect(controller.getTicketById(id)).rejects.toThrow(NotFoundException);
      expect(mockDataSource.query).toHaveBeenCalledTimes(1);
      expect(mockDataSource.query).toHaveBeenCalledWith(expect.stringContaining('WHERE t.TicketId = @0'), [id]);
    });
  });
});