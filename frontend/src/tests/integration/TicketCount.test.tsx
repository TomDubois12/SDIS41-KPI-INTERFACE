import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import * as reactRouter from 'react-router-dom';
import TicketCount from '../../components/TicketCount';

// Mock des modules nécessaires
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock des hooks de react-router-dom
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: jest.fn().mockReturnValue({
        search: '?date=2025-03-20'
    }),
    useNavigate: jest.fn().mockReturnValue(jest.fn())
}));

// Utilisez directement la référence typée pour le mock
const mockedUseNavigate = reactRouter.useNavigate as jest.Mock;

jest.mock('../../hooks/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
        const translations: { [key: string]: string } = {
            'Global.Chargement': 'Chargement...',
            'TicketCount.NbTicketsCreesJour': 'Nombre de nouveaux tickets créés dans la journée',
            'TicketCount.NbTicketsResolusJour': 'Nombre de tickets résolus dans la journée',
            'TicketCount.TitleTableau': 'Tableau des tickets créés dans la journée',
            'TicketCount.ID': 'ID du ticket',
            'TicketCount.TitreDemande': 'Titre de la demande',
            'TicketCount.Demandeur': 'Demandeur',
            'TicketCount.Heure': 'Heure',
            'Calendar.GoToMonth': 'Voir les statistiques mensuelles'
        };
        return translations[key] || key;
        }
    })
}));

describe('TicketCount Component', () => {
    const mockTickets = [
        {
        TicketId: 1,
        Title: 'Problème d\'impression',
        CallerName: 'DOMAIN\\john.doe',
        HeureDeCréation: '09:30',
        ResolutionDate: null
        },
        {
        TicketId: 2,
        Title: 'Accès réseau',
        CallerName: 'DOMAIN\\marie.dupont',
        HeureDeCréation: '10:15',
        ResolutionDate: '11:45'
        }
    ];

    beforeEach(() => {
        // Reset des mocks
        jest.clearAllMocks();
        
        // Mock des réponses API
        mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/tickets/count-created')) {
            return Promise.resolve({ data: { count: 5 } });
        } else if (url.includes('/tickets/count-resolved')) {
            return Promise.resolve({ data: { count: 3 } });
        } else if (url.includes('/tickets/tickets')) {
            return Promise.resolve({ data: mockTickets });
        }
        return Promise.reject(new Error('URL non prise en charge'));
        });
    });

    it('devrait afficher les données des tickets après chargement', async () => {
        render(
        <BrowserRouter>
            <TicketCount />
        </BrowserRouter>
        );

        // Vérifier l'état de chargement initial
        expect(screen.getByText('Chargement...')).toBeInTheDocument();

        // Attendre que les données soient chargées
        await waitFor(() => {
        expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
        });

        // Vérifier que les compteurs sont affichés
        expect(screen.getByText(/Nombre de nouveaux tickets créés dans la journée :/)).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText(/Nombre de tickets résolus dans la journée :/)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        // Vérifier que la date est affichée correctement
        expect(screen.getByText('20/03/2025')).toBeInTheDocument();

        // Vérifier que le tableau de tickets est affiché
        expect(screen.getByText('Tableau des tickets créés dans la journée')).toBeInTheDocument();
        expect(screen.getByText('Problème d\'impression')).toBeInTheDocument();
        expect(screen.getByText('Accès réseau')).toBeInTheDocument();
        
        // Vérifier la transformation des noms utilisateurs
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Marie Dupont')).toBeInTheDocument();
    });

    it('devrait naviguer vers la page détail quand on clique sur un ticket', async () => {
        const mockNavigate = jest.fn();
        mockedUseNavigate.mockReturnValue(mockNavigate);

        render(
        <BrowserRouter>
            <TicketCount />
        </BrowserRouter>
        );

        // Attendre que les données soient chargées
        await waitFor(() => {
        expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
        });

        // Cliquer sur un ticket
        fireEvent.click(screen.getByText('Problème d\'impression'));

        // Vérifier que la navigation a été appelée avec le bon ID
        expect(mockNavigate).toHaveBeenCalledWith('/clarilog_detail?id=1');
    });

    it('devrait naviguer vers le calendrier mensuel quand on clique sur le bouton', async () => {
        const mockNavigate = jest.fn();
        mockedUseNavigate.mockReturnValue(mockNavigate);

        // Approche sans utiliser global pour mocker la date
        // Au lieu de mocker le constructeur Date, on mock uniquement la méthode utilisée dans le composant
        const RealDate = Date;
        const mockDate = new Date(2025, 2, 20); // Mars 20, 2025
        
        // Mock partiel de Date sans utiliser global
        jest.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());
        
        // Mock du constructeur pour les nouvelles instances
        // @ts-ignore - Nous ignorons intentionnellement l'erreur TypeScript ici
        Date = class extends RealDate {
        constructor() {
            super();
            return mockDate;
        }
        };

        render(
        <BrowserRouter>
            <TicketCount />
        </BrowserRouter>
        );

        // Attendre que les données soient chargées
        await waitFor(() => {
        expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
        });

        // Cliquer sur le bouton de calendrier
        fireEvent.click(screen.getByText('Voir les statistiques mensuelles'));

        // Vérifier que la navigation a été appelée avec le bon URL
        expect(mockNavigate).toHaveBeenCalledWith('/clarilog_mensuel?month=3&year=2025');
        
        // Restaurer Date
        // @ts-ignore - Nous ignorons intentionnellement l'erreur TypeScript ici
        Date = RealDate;
        jest.restoreAllMocks();
    });

    it('devrait mettre à jour les données périodiquement', async () => {
        // Configuration pour tester les rafraîchissements
        jest.useFakeTimers();

        render(
        <BrowserRouter>
            <TicketCount />
        </BrowserRouter>
        );

        // Attendre le chargement initial
        await waitFor(() => {
        expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
        });

        // Vérifier l'appel API initial
        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
        
        // Simuler un changement de données pour le prochain appel
        mockedAxios.get.mockClear();
        mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/tickets/count-created')) {
            return Promise.resolve({ data: { count: 7 } }); // Valeur mise à jour
        } else if (url.includes('/tickets/count-resolved')) {
            return Promise.resolve({ data: { count: 4 } }); // Valeur mise à jour
        } else if (url.includes('/tickets/tickets')) {
            return Promise.resolve({ data: [
            ...mockTickets,
            {
                TicketId: 3,
                Title: 'Nouveau ticket',
                CallerName: 'DOMAIN\\pierre.martin',
                HeureDeCréation: '11:30',
                ResolutionDate: null
            }
            ]});
        }
        return Promise.reject(new Error('URL non prise en charge'));
        });

        // Avancer le temps pour déclencher la mise à jour
        jest.advanceTimersByTime(10000);
        
        // Vérifier que les APIs ont été appelées pour le rafraîchissement
        await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
        });

        // Restaurer les timers réels
        jest.useRealTimers();
    });
});