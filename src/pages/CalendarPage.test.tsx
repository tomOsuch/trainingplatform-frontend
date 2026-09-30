import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Outlet, Route, Routes } from 'react-router-dom';
import { renderWithProviders, mockFetch, sampleCategories } from '../test-utils';
import CalendarPage from './CalendarPage';
import { TrainingPlan } from '../types/workout';
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
};

const dane = (plans: TrainingPlan[] = [planOdTrenera]) => [
  { status: 200, body: plans },
  { status: 200, body: [] },
  { status: 200, body: sampleCategories },
  { status: 200, body: [] },
];

const renderAsCoach = (onForbidden = jest.fn()) =>
  renderWithProviders(
    <Routes>
      <Route element={<Outlet context={{ athleteId: 12, onForbidden }} />}>
        <Route path="/kalendarz" element={<CalendarPage />} />
      </Route>
    </Routes>,
    { route: '/kalendarz' },
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

      await screen.findByTitle('Interwały · od trenera: Jan Kowalski');
      expect(String(spy.mock.calls[0][0])).toContain('/coach/athletes/12/training-plans');
      expect(String(spy.mock.calls[1][0])).toContain('/coach/athletes/12/workout-logs');
      expect(screen.queryByRole('link', { name: 'Szablony' })).not.toBeInTheDocument();
    });

    test('plan otwiera się bez zmiany stanu, edycji i usuwania, z informacją o autorze', async () => {
      mockFetch(...dane());
      renderAsCoach();

      await userEvent.click(await screen.findByTitle('Interwały · od trenera: Jan Kowalski'));

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
  });
});
