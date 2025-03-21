import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import Performance from '../../components/Performance';

// Mock du hook useTranslation
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

// Mock d'axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Performance Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('affiche le statut de performance correct basé sur les tickets résolus (inférieur à la moyenne)', async () => {
        // Configuration du mock pour renvoyer moins de tickets que la moyenne
        mockedAxios.get.mockResolvedValueOnce({ data: { count: 3 } });

        render(<Performance date="2025-03-19" />);

        // Vérifier que le composant affiche initialement un statut par défaut
        expect(screen.getByText(/Performance: ❌/i)).toBeInTheDocument();

        // Attendre que les effets asynchrones se terminent
        await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'http://localhost:3001/tickets/count-resolved?date=2025-03-19'
        );
        });

        // Vérifier que le statut a été mis à jour correctement
        expect(screen.getByText(/Performance: ❌/i)).toBeInTheDocument();
    });

    test('affiche le statut de performance correct basé sur les tickets résolus (supérieur à la moyenne)', async () => {
        // Configuration du mock pour renvoyer plus de tickets que la moyenne
        mockedAxios.get.mockResolvedValueOnce({ data: { count: 8 } });

        render(<Performance date="2025-03-19" />);

        // Attendre que les effets asynchrones se terminent
        await waitFor(() => {
        expect(screen.getByText(/Performance: ✅/i)).toBeInTheDocument();
        });
    });

    test('affiche un tooltip au survol', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { count: 3 } });

        render(<Performance date="2025-03-19" />);

        // Attendre que les effets asynchrones se terminent
        await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
        });

        // Vérifier que le tooltip n'est pas visible initialement
        expect(screen.queryByText(/Vous n'avez pas atteint/i)).not.toBeInTheDocument();

        // Simuler le survol
        fireEvent.mouseEnter(screen.getByText(/Performance: ❌/i).parentElement!);

        // Vérifier que le tooltip est maintenant visible
        expect(screen.getByText(/Vous n'avez pas atteint 6 tickets résolus aujourd'hui/i)).toBeInTheDocument();

        // Simuler la sortie du survol
        fireEvent.mouseLeave(screen.getByText(/Performance: ❌/i).parentElement!);

        // Vérifier que le tooltip n'est plus visible
        expect(screen.queryByText(/Vous n'avez pas atteint/i)).not.toBeInTheDocument();
    });

    test('met à jour les données quand la date change', async () => {
        // Premier rendu avec une date
        mockedAxios.get.mockResolvedValueOnce({ data: { count: 3 } });
        const { rerender } = render(<Performance date="2025-03-19" />);

        await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
            'http://localhost:3001/tickets/count-resolved?date=2025-03-19'
        );
        });

        // Réinitialiser le mock et effectuer un nouveau rendu avec une date différente
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
        // Simuler une erreur d'API
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
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