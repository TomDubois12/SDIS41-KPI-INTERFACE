import { Test, TestingModule } from '@nestjs/testing';
import { TicketController } from '../../src/ticket/ticket.controller';
import { TicketService } from '../../src/ticket/ticket.service';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException, InternalServerErrorException, ParseIntPipe } from '@nestjs/common';

// Créer un mock pour la DataSource que TicketService utilisera
const mockDataSource = {
  query: jest.fn(),
};

describe('TicketController <-> TicketService (Integration)', () => {
  let controller: TicketController;
  let service: TicketService; // Référence au vrai service instancié par le module de test

  beforeEach(async () => {
    mockDataSource.query.mockClear(); // Reset mock

    const module: TestingModule = await Test.createTestingModule({
      // On déclare le contrôleur ET le service réels
      controllers: [TicketController],
      providers: [
        TicketService, // Le vrai service sera instancié
        {
          // On fournit le mock pour la dépendance DataSource du service
          provide: getDataSourceToken('parc_db_connection'),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<TicketController>(TicketController);
    service = module.get<TicketService>(TicketService); // Récupérer l'instance réelle du service
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined(); // Vérifier aussi que le service est créé
  });

  describe('getNbTicketsCreated', () => {
    it('should call service.getNbTicketsCreated and return formatted count', async () => {
      const date = '2025-04-29';
      const dbResult = [{ count: 8 }]; // Ce que la BDD (mockée) retourne
      const expectedControllerResult = { count: 8 }; // Ce que le contrôleur doit retourner

      // Configurer le mock de la query appelée par le service
      mockDataSource.query.mockResolvedValue(dbResult);

      // Appeler la méthode du contrôleur
      const result = await controller.getNbTicketsCreated(date);

      // Vérifier le retour du contrôleur
      expect(result).toEqual(expectedControllerResult);

      // Vérifier que le service a bien appelé la query
      expect(mockDataSource.query).toHaveBeenCalledTimes(1);
      expect(mockDataSource.query).toHaveBeenCalledWith(expect.any(String), [date]);
    });

    it('should return { count: 0 } if service returns empty data', async () => {
        const date = '2025-04-29';
        mockDataSource.query.mockResolvedValue([]); // Simuler retour vide de la BDD

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

        // Configurer les mocks pour les deux appels query faits par le service
        mockDataSource.query
            .mockResolvedValueOnce(mockTicketData)
            .mockResolvedValueOnce(mockResolutionTime);

        const expectedControllerResult = { ...mockTicketData[0], resolutionTime: mockResolutionTime[0] };

        // Appeler le contrôleur (en utilisant le pipe implicitement)
        const result = await controller.getTicketById(id);

        // Vérifier le résultat retourné par le contrôleur
        expect(result).toEqual(expectedControllerResult);

        // Vérifier les appels à la BDD faits par le service
        expect(mockDataSource.query).toHaveBeenCalledTimes(2);
        expect(mockDataSource.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE t.TicketId = @0'), [id]);
        expect(mockDataSource.query).toHaveBeenNthCalledWith(2, expect.stringContaining('WHERE t.TicketId = @0'), [id]);
    });

    it('should throw NotFoundException if service cannot find ticket', async () => {
        const id = 999;
        // Simuler la première query ne retournant rien
        mockDataSource.query.mockResolvedValueOnce([]);

        // S'attendre à ce que l'appel au contrôleur rejette avec NotFoundException
        await expect(controller.getTicketById(id)).rejects.toThrow(NotFoundException);

        // Vérifier que seule la première query a été appelée
        expect(mockDataSource.query).toHaveBeenCalledTimes(1);
         expect(mockDataSource.query).toHaveBeenCalledWith(expect.stringContaining('WHERE t.TicketId = @0'), [id]);
    });
  });

  // Ajouter d'autres tests d'intégration Controller <-> Service pour d'autres endpoints...

});