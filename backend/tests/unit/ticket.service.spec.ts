import { Test, TestingModule } from '@nestjs/testing';
import { TicketService } from '../../src/ticket/ticket.service'; // Ajuster chemin
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

// Créer un mock simple pour DataSource qui expose une fonction 'query' mockée par Jest
const mockDataSource = {
  query: jest.fn(),
};

describe('TicketService (Minimal)', () => {
  let service: TicketService;
  let dataSource: DataSource;

  beforeEach(async () => {
    // Réinitialiser le mock avant chaque test
    mockDataSource.query.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        {
          // Fournir le mock en utilisant le TOKEN spécifique de la connexion
          provide: getDataSourceToken('parc_db_connection'),
          useValue: mockDataSource,
        },
        // Pas besoin de mocker NotificationService si elle a été retirée des dépendances de TicketService
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
    // Obtenir une référence au mock injecté (même si c'est le même objet)
    dataSource = module.get<DataSource>(getDataSourceToken('parc_db_connection'));
  });

  it('should be defined', () => {
    // Vérifie si le service a pu être créé et injecté
    expect(service).toBeDefined();
  });

  describe('getNbTicketsCreated', () => {
    it('should call dataSource.query with correct parameters and return result', async () => {
      const testDate = '2025-04-29';
      const expectedResultFromDb = [{ count: 15 }]; // Simuler le retour de la BDD avec l'alias 'count'
      // Configurer le mock pour retourner cette valeur quand query est appelée
      mockDataSource.query.mockResolvedValue(expectedResultFromDb);

      // Appeler la méthode du service
      const result = await service.getNbTicketsCreated(testDate);

      // Vérifier que le résultat retourné par le service est bien celui du mock
      expect(result).toEqual(expectedResultFromDb);

      // Vérifier que dataSource.query a été appelée une fois
      expect(dataSource.query).toHaveBeenCalledTimes(1);

      // Vérifier que dataSource.query a été appelée AVEC les paramètres attendus
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('CAST(t.SentOn AS DATE) = @0'), // Vérifier une partie de la requête SQL
        [testDate] // Vérifier le tableau de paramètres
      );
    });

     it('should throw error if query fails', async () => {
         const testDate = '2025-04-29';
         const dbError = new Error('Database Query Failed');
         mockDataSource.query.mockRejectedValue(dbError); // Simuler une erreur de la BDD

         // S'attendre à ce que l'appel rejette avec la même erreur
         await expect(service.getNbTicketsCreated(testDate)).rejects.toThrow(dbError);
          expect(dataSource.query).toHaveBeenCalledWith(expect.any(String), [testDate]);
     });
  });

  // Vous pouvez ajouter un test minimal pour une autre méthode, par exemple getTicketById (cas non trouvé)
  describe('getTicketById', () => {
      it('should throw NotFoundException if ticket is not found', async () => {
          const testId = 999;
          mockDataSource.query.mockResolvedValueOnce([]); // Simuler la requête principale ne retournant rien

          await expect(service.getTicketById(testId)).rejects.toThrow(NotFoundException);

          // Vérifier que la requête principale a été appelée avec les bons paramètres
          expect(dataSource.query).toHaveBeenCalledWith(
              expect.stringContaining('WHERE t.TicketId = @0'),
              [testId]
          );
      });
  });

});