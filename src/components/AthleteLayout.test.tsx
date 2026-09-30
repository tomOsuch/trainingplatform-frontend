import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { renderWithProviders, mockFetch } from '../test-utils';
import AthleteLayout from './AthleteLayout';
import { Athlete } from '../types/cooperation';

const anna: Athlete = {
  id: 12,
  firstName: 'Anna',
  lastName: 'Nowak',
  email: 'anna@example.com',
  cooperationSince: '2026-09-05T10:00:00.000000',
};

function CooperationStub() {
  const state = useLocation().state as { lostAccess?: string } | null;
  return (
    <div>
      <h1>Ekran współpracy</h1>
      {state?.lostAccess && <p>{state.lostAccess}</p>}
    </div>
  );
}

const renderAt = (path: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/podopieczni/:athleteId" element={<AthleteLayout />}>
        <Route path="statystyki" element={<p>Treść zakładki</p>} />
      </Route>
      <Route path="/wspolpraca" element={<CooperationStub />} />
    </Routes>,
    { route: path },
  );

describe('AthleteLayout', () => {
  afterEach(() => jest.restoreAllMocks());

  test('pokazuje pasek trybu z imieniem podopiecznego i treść zakładki', async () => {
    mockFetch({ status: 200, body: [anna] });
    renderAt('/podopieczni/12/statystyki');

    expect(await screen.findByText('Anna Nowak')).toBeInTheDocument();
    expect(screen.getByText('Treść zakładki')).toBeInTheDocument();
  });

  test('osoba spoza listy podopiecznych wyrzuca z trybu z wyjaśnieniem', async () => {
    mockFetch({ status: 200, body: [anna] });
    renderAt('/podopieczni/999/statystyki');

    expect(await screen.findByText('Nie masz już dostępu do danych tej osoby.')).toBeInTheDocument();
    expect(screen.queryByText('Treść zakładki')).not.toBeInTheDocument();
  });

  test('awaria pobrania listy wyrzuca z trybu, zamiast zostawić pusty ekran', async () => {
    mockFetch({ status: 500, body: { message: 'Błąd serwera' } });
    renderAt('/podopieczni/12/statystyki');

    expect(await screen.findByText('Nie udało się otworzyć danych podopiecznego.')).toBeInTheDocument();
  });

  test('nieprawidłowy identyfikator w adresie nie wysyła żądania', async () => {
    const spy = mockFetch();
    renderAt('/podopieczni/abc/statystyki');

    expect(await screen.findByRole('heading', { name: 'Ekran współpracy' })).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  test('przycisk powrotu prowadzi do własnych danych bez komunikatu o utracie dostępu', async () => {
    mockFetch({ status: 200, body: [anna] });
    renderAt('/podopieczni/12/statystyki');

    await userEvent.click(await screen.findByRole('button', { name: '← Wróć do swoich danych' }));

    expect(screen.getByRole('heading', { name: 'Ekran współpracy' })).toBeInTheDocument();
    expect(screen.queryByText(/Nie masz już dostępu/)).not.toBeInTheDocument();
  });
});
