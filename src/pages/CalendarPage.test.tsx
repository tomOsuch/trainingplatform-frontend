import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Outlet, Route, Routes } from 'react-router-dom';
import { renderWithProviders, mockFetch, sampleCategories } from '../test-utils';
import CalendarPage from './CalendarPage';
import { TrainingPlan } from '../types/workout';
import { Athlete } from '../types/cooperation';
import { toISODate } from '../utils/calendar';

const dzis = toISODate(new Date());

const planOdTrenera: TrainingPlan = {
  id: 8,
  title: 'Interwały',
  categoryId: 1,
  categoryName: 'Taniec',
  categoryColor: '#9B59B6',
  categoryIconName: 'music',
  plannedDate: dzis,
  plannedTime: null,
  durationMin: 60,
  notes: null,
  status: 'PLANNED',
  createdByCoach: true,
  createdByName: 'Jan Kowalski',
  createdById: 7,
};

const dane = (plans: TrainingPlan[] = [planOdTrenera]) => [
  { status: 200, body: plans },
  { status: 200, body: [] },
  { status: 200, body: sampleCategories },
  { status: 200, body: [] },
];

const AUTHOR_ID = 7;

const athleteRow: Athlete = {
  id: 12,
  firstName: 'Anna',
  lastName: 'Nowak',
  email: 'anna@example.com',
  cooperationSince: '2026-09-05T10:00:00',
};

const renderAsCoach = (onForbidden = jest.fn(), viewerId = 99) =>
  renderWithProviders(
    <Routes>
      <Route element={<Outlet context={{ athleteId: 12, onForbidden }} />}>
        <Route path="/kalendarz" element={<CalendarPage />} />
      </Route>
    </Routes>,
    { route: '/kalendarz', user: { userId: viewerId, email: 'trener@example.com', role: 'USER', coach: true } },
  );

describe('CalendarPage', () => {
  afterEach(() => jest.restoreAllMocks());

  test('plan od trenera jest oznaczony także we własnym kalendarzu', async () => {
    mockFetch(...dane());
    renderWithProviders(<CalendarPage />);

    expect(await screen.findByTitle('Interwały · od trenera: Jan Kowalski')).toBeInTheDocument();
  });

  describe('w trybie podglądu', () => {
    test('pyta o plany i wpisy podopiecznego i nie prowadzi do własnych szablonów', async () => {
      const spy = mockFetch(...dane());
      renderAsCoach();

      await screen.findByTitle('Interwały');
      expect(String(spy.mock.calls[0][0])).toContain('/coach/athletes/12/training-plans');
      expect(String(spy.mock.calls[1][0])).toContain('/coach/athletes/12/workout-logs');
      expect(screen.queryByRole('link', { name: 'Szablony' })).not.toBeInTheDocument();
    });

    test('plan innego trenera otwiera się bez zmiany stanu, edycji i usuwania, z informacją o autorze', async () => {
      mockFetch(...dane());
      renderAsCoach();

      await userEvent.click(await screen.findByTitle('Interwały'));

      const okno = screen.getByRole('dialog', { name: 'Interwały' });
      expect(within(okno).getByText('Ułożony przez trenera: Jan Kowalski')).toBeInTheDocument();
      expect(within(okno).queryByRole('combobox')).not.toBeInTheDocument();
      expect(within(okno).queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
      expect(within(okno).queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
    });

    test('nowy plan trafia na konto podopiecznego', async () => {
      const spy = mockFetch(
        ...dane([]),
        { status: 201, body: planOdTrenera },
        { status: 200, body: [planOdTrenera] },
        { status: 200, body: [] },
      );
      renderAsCoach();

      await userEvent.click(await screen.findByRole('button', { name: '+ Dodaj trening' }));
      await screen.findByRole('option', { name: 'Taniec' });
      await userEvent.type(screen.getByLabelText(/^Tytuł/), 'Rozciąganie');
      await userEvent.selectOptions(screen.getByLabelText(/^Kategoria/), '1');
      await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => expect(spy).toHaveBeenCalledTimes(7));
      const [url, options] = spy.mock.calls[4];
      expect(String(url)).toContain('/coach/athletes/12/training-plans');
      expect(options!.method).toBe('POST');
    });

    test('403 wyprowadza z trybu', async () => {
      const onForbidden = jest.fn();
      mockFetch(
        { status: 403, body: { message: 'Brak uprawnień' } },
        { status: 200, body: [] },
        { status: 200, body: sampleCategories },
        { status: 200, body: [] },
      );
      renderAsCoach(onForbidden);

      await waitFor(() => expect(onForbidden).toHaveBeenCalled());
    });

    test('403 przy zapisie planu też wyprowadza z trybu', async () => {
      const onForbidden = jest.fn();
      mockFetch(...dane([]), { status: 403, body: { message: 'Brak uprawnień' } });
      renderAsCoach(onForbidden);

      await userEvent.click(await screen.findByRole('button', { name: '+ Dodaj trening' }));
      await screen.findByRole('option', { name: 'Taniec' });
      await userEvent.type(screen.getByLabelText(/^Tytuł/), 'Rozciąganie');
      await userEvent.selectOptions(screen.getByLabelText(/^Kategoria/), '1');
      await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => expect(onForbidden).toHaveBeenCalled());
      expect(screen.queryByText('Brak uprawnień')).not.toBeInTheDocument();
    });

    test('plan oglądającego trenera ma „Edytuj", ale nadal bez zmiany stanu i usuwania', async () => {
      mockFetch(...dane());
      renderAsCoach(jest.fn(), AUTHOR_ID);

      await userEvent.click(await screen.findByTitle('Interwały · ułożony przez Ciebie'));

      const okno = screen.getByRole('dialog', { name: 'Interwały' });
      expect(within(okno).getByRole('button', { name: 'Edytuj' })).toBeInTheDocument();
      expect(within(okno).queryByRole('combobox')).not.toBeInTheDocument();
      expect(within(okno).queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
    });

    test('edycja własnego planu trafia do przestrzeni trenera, a formularz nie pozwala go usunąć', async () => {
      const spy = mockFetch(
        ...dane(),
        { status: 200, body: { ...planOdTrenera, title: 'Interwały 8×400' } },
        { status: 200, body: [planOdTrenera] },
        { status: 200, body: [] },
      );
      renderAsCoach(jest.fn(), AUTHOR_ID);

      await userEvent.click(await screen.findByTitle('Interwały · ułożony przez Ciebie'));
      await userEvent.click(screen.getByRole('button', { name: 'Edytuj' }));

      expect(screen.getByRole('dialog', { name: 'Edytuj trening' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Usuń trening' })).not.toBeInTheDocument();

      await userEvent.clear(screen.getByLabelText(/^Tytuł/));
      await userEvent.type(screen.getByLabelText(/^Tytuł/), 'Interwały 8×400');
      await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => expect(spy).toHaveBeenCalledTimes(7));
      const [url, options] = spy.mock.calls[4];
      expect(String(url)).toContain('/coach/athletes/12/training-plans/8');
      expect(options!.method).toBe('PUT');
    });

    test('403 przy edycji, gdy współpraca trwa: zostaje w trybie i pokazuje odmowę serwera', async () => {
      const onForbidden = jest.fn();
      const message = 'Ten plan ułożył ktoś inny — możesz go tylko obejrzeć';
      const spy = mockFetch(
        ...dane(),
        { status: 403, body: { message } },
        { status: 200, body: [athleteRow] }, // podopieczny nadal na liście — odmowa dotyczy planu, nie dostępu
      );
      renderAsCoach(onForbidden, AUTHOR_ID);

      await userEvent.click(await screen.findByTitle('Interwały · ułożony przez Ciebie'));
      await userEvent.click(screen.getByRole('button', { name: 'Edytuj' }));
      await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(String(spy.mock.calls[5][0])).toContain('/coach/athletes');
      expect(onForbidden).not.toHaveBeenCalled();
    });

    test('403 przy edycji po zakończeniu współpracy wyprowadza z trybu', async () => {
      const onForbidden = jest.fn();
      mockFetch(
        ...dane(),
        { status: 403, body: { message: 'Brak uprawnień' } },
        { status: 200, body: [] }, // podopiecznego nie ma już na liście
      );
      renderAsCoach(onForbidden, AUTHOR_ID);

      await userEvent.click(await screen.findByTitle('Interwały · ułożony przez Ciebie'));
      await userEvent.click(screen.getByRole('button', { name: 'Edytuj' }));
      await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => expect(onForbidden).toHaveBeenCalled());
      expect(screen.queryByText('Brak uprawnień')).not.toBeInTheDocument();
    });
  });
});
