import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import TicketCount from '../../components/TicketCount';
import { BrowserRouter } from 'react-router-dom';
import { TranslationProvider } from "../../context/TranslationContext";

jest.mock('axios');

describe('TicketCount', () => {
    let mockedAxios;

    beforeEach(() => {
        mockedAxios = axios as jest.Mocked<typeof axios>;
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const renderWithRouter = () => {
        render(
            <TranslationProvider>
                <BrowserRouter>
                    <TicketCount />
                </BrowserRouter>
            </TranslationProvider>
        );
    };

    it('fetches and updates ticket counts periodically', async () => {
        const mockTickets = [{ id: 1, title: 'Ticket 1' }, { id: 2, title: 'Ticket 2' }];
        const originalMock = jest.fn().mockImplementation((url) => {
            if (url.includes('/tickets/count-created')) {
                return Promise.resolve({ data: { count: 5 } });
            } else if (url.includes('/tickets/count-resolved')) {
                return Promise.resolve({ data: { count: 3 } });
            } else if (url.includes('/tickets/tickets')) {
                return Promise.resolve({ data: mockTickets });
            }
            return Promise.reject(new Error('Invalid URL'));
        });

        mockedAxios.get.mockImplementation(originalMock);

        renderWithRouter();

        // Wait for initial data load
        await waitFor(() => {
            expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
        });

        // Ensure initial data is displayed
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        // Modify mock response to simulate data update
        const updatedMock = jest.fn().mockImplementation((url) => {
            if (url.includes('/tickets/count-created')) {
                return Promise.resolve({ data: { count: 7 } });
            } else if (url.includes('/tickets/count-resolved')) {
                return Promise.resolve({ data: { count: 4 } });
            } else if (url.includes('/tickets/tickets')) {
                return Promise.resolve({ data: mockTickets });
            }
            return Promise.reject(new Error('Invalid URL'));
        });

        mockedAxios.get.mockImplementation(updatedMock);

        // Advance timers to trigger interval
        jest.advanceTimersByTime(60000);

        // Wait for updated data to load
        await waitFor(() => {
            expect(screen.getByText('7')).toBeInTheDocument();
            expect(screen.getByText('4')).toBeInTheDocument();
        });
    });
});
