import axios from 'axios';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import Performance from '../../components/Performance';

jest.mock('../../hooks/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: { [key: string]: string } = {
                "Performance.Atteint": "Vous avez atteint",
                "Performance.PasAtteint": "Vous n'avez pas atteint",
                "Performance.Suite": "tickets résolus aujourd'hui"
            };
            return translations[key] || key;
        }
    })
}));

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Performance Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('affiche le statut de performance correct basé sur les tickets résolus (inférieur à la moyenne)', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { count: 3 } });
        render(<Performance date="2025-03-19" />);
        expect(screen.getByText(/Performance: ❌/i)).toBeInTheDocument();
        await waitFor(() => {
            expect(mockedAxios.get).toHaveBeenCalledWith(
                'http://localhost:3001/tickets/count-resolved?date=2025-03-19'
            );
        });
        expect(screen.getByText(/Performance: ❌/i)).toBeInTheDocument();
    });

    test('affiche le statut de performance correct basé sur les tickets résolus (supérieur à la moyenne)', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { count: 8 } });
        render(<Performance date="2025-03-19" />);
        await waitFor(() => {
            expect(screen.getByText(/Performance: ✅/i)).toBeInTheDocument();
        });
    });

    test('affiche un tooltip au survol', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { count: 3 } });
        render(<Performance date="2025-03-19" />);
        await waitFor(() => {
            expect(mockedAxios.get).toHaveBeenCalled();
        });
        expect(screen.queryByText(/Vous n'avez pas atteint/i)).not.toBeInTheDocument();
        fireEvent.mouseEnter(screen.getByText(/Performance: ❌/i).parentElement!);
        expect(screen.getByText(/Vous n'avez pas atteint 6 tickets résolus aujourd'hui/i)).toBeInTheDocument();
        fireEvent.mouseLeave(screen.getByText(/Performance: ❌/i).parentElement!);
        expect(screen.queryByText(/Vous n'avez pas atteint/i)).not.toBeInTheDocument();
    });

    test('met à jour les données quand la date change', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { count: 3 } });
        const { rerender } = render(<Performance date="2025-03-19" />);
        await waitFor(() => {
            expect(mockedAxios.get).toHaveBeenCalledWith(
                'http://localhost:3001/tickets/count-resolved?date=2025-03-19'
            );
        });
        mockedAxios.get.mockResolvedValueOnce({ data: { count: 7 } });
        rerender(<Performance date="2025-03-20" />);
        await waitFor(() => {
            expect(mockedAxios.get).toHaveBeenCalledWith(
                'http://localhost:3001/tickets/count-resolved?date=2025-03-20'
            );
            expect(screen.getByText(/Performance: ✅/i)).toBeInTheDocument();
        });
    });

    test('gère les erreurs de requête API', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
        render(<Performance date="2025-03-19" />);
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Erreur lors de la récupération du nombre de tickets résolus :",
                expect.any(Error)
            );
            expect(screen.getByText(/Performance: ❌/i)).toBeInTheDocument();
        });
        consoleErrorSpy.mockRestore();
    });
});