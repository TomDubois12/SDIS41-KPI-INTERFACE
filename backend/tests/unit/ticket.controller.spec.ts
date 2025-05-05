import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

import { TicketController } from '../../src/ticket/ticket.controller';
import { TicketService } from '../../src/ticket/ticket.service';

const mockTicketService = {
  getNbTicketsCreated: jest.fn(),
  getTicketById: jest.fn(),
};

describe('TicketController (Minimal)', () => {
  let controller: TicketController;
  let service: TicketService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        {
          provide: TicketService,
          useValue: mockTicketService,
        },
      ],
    }).compile();

    controller = module.get<TicketController>(TicketController);
    service = module.get<TicketService>(TicketService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNbTicketsCreated', () => {
    it('should call service and return formatted count', async () => {
      const testDate = '2025-04-29';
      const serviceResult = [{ count: 12 }];
      const expectedControllerResult = { count: 12 };

      mockTicketService.getNbTicketsCreated.mockResolvedValue(serviceResult);
      const result = await controller.getNbTicketsCreated(testDate);
      expect(result).toEqual(expectedControllerResult);
      expect(service.getNbTicketsCreated).toHaveBeenCalledTimes(1);
      expect(service.getNbTicketsCreated).toHaveBeenCalledWith(testDate);
    });

    it('should return count 0 if service returns empty array', async () => {
      const testDate = '2025-04-30';
      mockTicketService.getNbTicketsCreated.mockResolvedValue([]);
      await expect(controller.getNbTicketsCreated(testDate)).resolves.toEqual({ count: 0 });
      expect(service.getNbTicketsCreated).toHaveBeenCalledWith(testDate);
    });

    it('should throw InternalServerErrorException if service throws error', async () => {
      const testDate = '2025-04-30';
      const serviceError = new Error('Service Error');
      mockTicketService.getNbTicketsCreated.mockRejectedValue(serviceError);
      await expect(controller.getNbTicketsCreated(testDate)).rejects.toThrow(InternalServerErrorException);
      expect(service.getNbTicketsCreated).toHaveBeenCalledWith(testDate);
    });
  });

  describe('getTicketById', () => {
    it('should throw NotFoundException if service throws NotFoundException', async () => {
      const testId = 999;
      mockTicketService.getTicketById.mockRejectedValue(new NotFoundException('Not found'));
      await expect(controller.getTicketById(testId)).rejects.toThrow(NotFoundException);
      expect(service.getTicketById).toHaveBeenCalledTimes(1);
      expect(service.getTicketById).toHaveBeenCalledWith(testId);
    });

    it('should return ticket data if service returns data', async () => {
      const testId = 1;
      const mockTicketData = { TicketId: 1, Title: 'Found Ticket' };
      mockTicketService.getTicketById.mockResolvedValue(mockTicketData);

      await expect(controller.getTicketById(testId)).resolves.toEqual(mockTicketData);
      expect(service.getTicketById).toHaveBeenCalledWith(testId);
    });
  });
});