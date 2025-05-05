import axios from 'axios';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as reactRouter from 'react-router-dom';

import TicketCount from '../../components/TicketCount';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: jest.fn().mockReturnValue({
        search: '?date=2025-03-20'
    }),
    useNavigate: jest.fn().mockReturnValue(jest.fn())
}));

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
        jest.clearAllMocks();
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

        expect(screen.getByText('Chargement...')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
        });

        expect(screen.getByText(/Nombre de nouveaux tickets créés dans la journée :/)).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText(/Nombre de tickets résolus dans la journée :/)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        expect(screen.getByText('20/03/2025')).toBeInTheDocument();

        expect(screen.getByText('Tableau des tickets créés dans la journée')).toBeInTheDocument();
        expect(screen.getByText('Problème d\'impression')).toBeInTheDocument();
        expect(screen.getByText('Accès réseau')).toBeInTheDocument();

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

        await waitFor(() => {
            expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Problème d\'impression'));

        expect(mockNavigate).toHaveBeenCalledWith('/clarilog_detail?id=1');
    });

    it('devrait naviguer vers le calendrier mensuel quand on clique sur le bouton', async () => {
        const mockNavigate = jest.fn();
        mockedUseNavigate.mockReturnValue(mockNavigate);

        const RealDate = Date;
        const mockDate = new Date(2025, 2, 20);

        jest.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());

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

        await waitFor(() => {
            expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Voir les statistiques mensuelles'));

        expect(mockNavigate).toHaveBeenCalledWith('/clarilog_mensuel?month=3&year=2025');

        // @ts-ignore - Nous ignorons intentionnellement l'erreur TypeScript ici
        Date = RealDate;
        jest.restoreAllMocks();
    });

    it('devrait mettre à jour les données périodiquement', async () => {
        jest.useFakeTimers();
        render(
            <BrowserRouter>
                <TicketCount />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
        });

        expect(mockedAxios.get).toHaveBeenCalledTimes(3);

        mockedAxios.get.mockClear();
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes('/tickets/count-created')) {
                return Promise.resolve({ data: { count: 7 } });
            } else if (url.includes('/tickets/count-resolved')) {
                return Promise.resolve({ data: { count: 4 } });
            } else if (url.includes('/tickets/tickets')) {
                return Promise.resolve({
                    data: [
                        ...mockTickets,
                        {
                            TicketId: 3,
                            Title: 'Nouveau ticket',
                            CallerName: 'DOMAIN\\pierre.martin',
                            HeureDeCréation: '11:30',
                            ResolutionDate: null
                        }
                    ]
                });
            }
            return Promise.reject(new Error('URL non prise en charge'));
        });

        jest.advanceTimersByTime(10000);

        await waitFor(() => {
            expect(mockedAxios.get).toHaveBeenCalledTimes(3);
        });

        jest.useRealTimers();
    });
});