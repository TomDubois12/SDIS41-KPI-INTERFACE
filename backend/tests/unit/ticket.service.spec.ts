import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { TicketService } from '../../src/ticket/ticket.service';

const mockDataSource = {
  query: jest.fn(),
};

describe('TicketService (Minimal)', () => {
  let service: TicketService;
  let dataSource: DataSource;

  beforeEach(async () => {
    mockDataSource.query.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        {
          provide: getDataSourceToken('parc_db_connection'),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
    dataSource = module.get<DataSource>(getDataSourceToken('parc_db_connection'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNbTicketsCreated', () => {
    it('should call dataSource.query with correct parameters and return result', async () => {
      const testDate = '2025-04-29';
      const expectedResultFromDb = [{ count: 15 }];
      mockDataSource.query.mockResolvedValue(expectedResultFromDb);

      const result = await service.getNbTicketsCreated(testDate);
      expect(result).toEqual(expectedResultFromDb);
      expect(dataSource.query).toHaveBeenCalledTimes(1);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('CAST(t.SentOn AS DATE) = @0'),
        [testDate]
      );
    });

    it('should throw error if query fails', async () => {
      const testDate = '2025-04-29';
      const dbError = new Error('Database Query Failed');
      mockDataSource.query.mockRejectedValue(dbError);
      await expect(service.getNbTicketsCreated(testDate)).rejects.toThrow(dbError);
      expect(dataSource.query).toHaveBeenCalledWith(expect.any(String), [testDate]);
    });
  });

  describe('getTicketById', () => {
    it('should throw NotFoundException if ticket is not found', async () => {
      const testId = 999;
      mockDataSource.query.mockResolvedValueOnce([]);
      await expect(service.getTicketById(testId)).rejects.toThrow(NotFoundException);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE t.TicketId = @0'),
        [testId]
      );
    });
  });
});