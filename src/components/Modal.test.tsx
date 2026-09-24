import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import Modal from './Modal';

function Harness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Otwórz
      </button>
      {open && (
        <Modal title="Okno testowe" onClose={() => setOpen(false)}>
          <button type="button">Akcja</button>
        </Modal>
      )}
    </>
  );
}

describe('Modal', () => {
  test('otwarcie przenosi focus do okna', async () => {
    renderWithProviders(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Otwórz' }));

    expect(screen.getByRole('dialog', { name: 'Okno testowe' })).toHaveFocus();
  });

  test('zamknięcie oddaje focus przyciskowi, który okno otworzył', async () => {
    renderWithProviders(<Harness />);

    const opener = screen.getByRole('button', { name: 'Otwórz' });
    await userEvent.click(opener);
    await userEvent.click(screen.getByRole('button', { name: 'Zamknij' }));

    expect(opener).toHaveFocus();
  });

  test('Tab krąży w oknie, zamiast z niego wychodzić', async () => {
    renderWithProviders(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Otwórz' }));

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Zamknij' })).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Akcja' })).toHaveFocus();

    // z ostatniego elementu wracamy na pierwszy, a nie na "Otwórz" w tle
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Zamknij' })).toHaveFocus();
  });

  test('Escape zamyka okno', async () => {
    renderWithProviders(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Otwórz' }));
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
