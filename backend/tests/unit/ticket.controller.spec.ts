import { Test, TestingModule } from '@nestjs/testing';
import { TicketController } from '../../src/ticket/ticket.controller'; // Ajuster chemin
import { TicketService } from '../../src/ticket/ticket.service'; // Ajuster chemin
import { NotFoundException, InternalServerErrorException, ParseIntPipe } from '@nestjs/common';

// Créer un objet mock simple pour TicketService
const mockTicketService = {
  getNbTicketsCreated: jest.fn(),
  getTicketById: jest.fn(),
  // Ajoutez d'autres méthodes ici si vous les testez
};

describe('TicketController (Minimal)', () => {
  let controller: TicketController;
  let service: TicketService; // Pour vérifier les appels au mock

  beforeEach(async () => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        {
          provide: TicketService,
          useValue: mockTicketService, // Fournir le mock
        },
      ],
    }).compile();

    controller = module.get<TicketController>(TicketController);
    service = module.get<TicketService>(TicketService); // Récupérer le mock injecté
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNbTicketsCreated', () => {
    it('should call service and return formatted count', async () => {
      const testDate = '2025-04-29';
      const serviceResult = [{ count: 12 }]; // Ce que le service retourne (après query + alias)
      const expectedControllerResult = { count: 12 }; // Ce que le contrôleur doit retourner

      // Configurer le mock pour retourner la valeur simulée
      mockTicketService.getNbTicketsCreated.mockResolvedValue(serviceResult);

      // Appeler la méthode du contrôleur
      const result = await controller.getNbTicketsCreated(testDate);

      // Vérifier que le contrôleur retourne le résultat formaté attendu
      expect(result).toEqual(expectedControllerResult);

      // Vérifier que la méthode du service a été appelée correctement
      expect(service.getNbTicketsCreated).toHaveBeenCalledTimes(1);
      expect(service.getNbTicketsCreated).toHaveBeenCalledWith(testDate);
    });

     it('should return count 0 if service returns empty array', async () => {
         const testDate = '2025-04-30';
         mockTicketService.getNbTicketsCreated.mockResolvedValue([]); // Service ne trouve rien
         await expect(controller.getNbTicketsCreated(testDate)).resolves.toEqual({ count: 0 });
         expect(service.getNbTicketsCreated).toHaveBeenCalledWith(testDate);
     });

     it('should throw InternalServerErrorException if service throws error', async () => {
         const testDate = '2025-04-30';
         const serviceError = new Error('Service Error');
         mockTicketService.getNbTicketsCreated.mockRejectedValue(serviceError); // Simuler erreur service
         await expect(controller.getNbTicketsCreated(testDate)).rejects.toThrow(InternalServerErrorException);
         expect(service.getNbTicketsCreated).toHaveBeenCalledWith(testDate);
     });
  });

  describe('getTicketById', () => {
    it('should throw NotFoundException if service throws NotFoundException', async () => {
      const testId = 999;
      // Configurer le mock pour lancer l'erreur attendue
      mockTicketService.getTicketById.mockRejectedValue(new NotFoundException('Not found'));

      // S'attendre à ce que l'appel au contrôleur rejette avec la même exception
      await expect(controller.getTicketById(testId)).rejects.toThrow(NotFoundException);

      // Vérifier que le service a été appelé
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