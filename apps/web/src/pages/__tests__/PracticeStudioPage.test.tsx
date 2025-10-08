import { screen, waitFor, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PracticeStudioPage from '../PracticeStudioPage';

const renderWithRoute = (initialEntry: string) => {
  const queryClient = new QueryClient();
  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/practice/:technique" element={<PracticeStudioPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  };
};

describe('PracticeStudioPage', () => {
  it('submits mnemonic practice form and shows results', async () => {
    const { user } = renderWithRoute('/practice/mnemonic_it');

    await waitFor(() => screen.getByRole('heading', { name: /Mnemonic practice/i }));

    await user.type(screen.getByLabelText(/Term to remember/i), 'energia');
    await user.type(screen.getByLabelText(/Definition/i), 'capacità di compiere lavoro');

    await user.click(screen.getByRole('button', { name: /Create mnemonic/i }));

    await waitFor(() => screen.getByRole('heading', { name: /Mnemonic generated/i }));
    screen.getByText(/energia risplende/i);
  });

  it('handles flashcards practice flow', async () => {
    const { user } = renderWithRoute('/practice/flashcards_index_it');

    await waitFor(() => screen.getByRole('heading', { name: /Flashcards practice/i }));

    await user.type(screen.getByLabelText(/Topic/i), 'Energia');
    await user.type(screen.getByLabelText(/Term #1/i), 'Energia potenziale');
    await user.type(screen.getByLabelText(/Definition #1/i), 'Energia immagazzinata');

    await user.click(screen.getByRole('button', { name: /Create flashcards/i }));

    await waitFor(() => screen.getByRole('heading', { name: /Flashcards generated/i }));
    screen.getByText(/Energia immagazzinata/i);
  });
});
