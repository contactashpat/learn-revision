import { screen, waitFor } from '@testing-library/react';
import TechniqueExplorerPage from '../TechniqueExplorerPage';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('TechniqueExplorerPage', () => {
  it('renders techniques and navigation buttons', async () => {
    renderWithProviders(<TechniqueExplorerPage />);

    screen.getByRole('heading', { name: /Technique Explorer/i });

    await waitFor(() => {
      screen.getByRole('heading', { name: /mnemonic it/i });
    });

    const practiceButtons = screen.getAllByRole('button', { name: /start practice/i });
    expect(practiceButtons.length).toBeGreaterThan(0);
  });
});
