import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Outlet, Route, Routes } from 'react-router-dom';
import { renderWithProviders, mockFetch, sampleCategories } from '../test-utils';
import WorkoutLogPage from './WorkoutLogPage';
import { TrainingPlan, WorkoutLog } from '../types/workout';

const wpis: WorkoutLog = {
  id: 5,
  title: 'Bieg poranny',
  categoryId: 1,
  categoryName: 'Taniec',
  categoryColor: '#9B59B6',
  categoryIconName: 'music',
  planId: null,
  performedDate: '2026-09-10',
  performedTime: null,
  durationMin: 45,
  intensity: 7,
  notes: null,
};

const planBezWpisu: TrainingPlan = {
  id: 8,
  title: 'Interwały',
  categoryId: 1,
  categoryName: 'Taniec',
  categoryColor: '#9B59B6',
  categoryIconName: 'music',
  plannedDate: '2026-09-12',
  plannedTime: null,
  durationMin: 60,
  notes: null,
  status: 'COMPLETED',
  createdByCoach: false,
  createdByName: null,
};

const dane = () => [
  { status: 200, body: [wpis] },
  { status: 200, body: [planBezWpisu] },
  { status: 200, body: sampleCategories },
];

const renderAsCoach = (onForbidden = jest.fn()) =>
  renderWithProviders(
    <Routes>
      <Route element={<Outlet context={{ athleteId: 12, onForbidden }} />}>
        <Route path="/dziennik" element={<WorkoutLogPage />} />
      </Route>
    </Routes>,
    { route: '/dziennik' },
  );

describe('WorkoutLogPage w trybie podglądu', () => {
  afterEach(() => jest.restoreAllMocks());

  test('pyta o dziennik i plany podopiecznego, nie własne', async () => {
    const spy = mockFetch(...dane());
    renderAsCoach();

    await screen.findByText('Bieg poranny');
    expect(String(spy.mock.calls[0][0])).toContain('/coach/athletes/12/workout-logs');
    expect(String(spy.mock.calls[1][0])).toContain('/coach/athletes/12/training-plans');
  });

  test('nie ma dodawania ani uzupełniania wpisów', async () => {
    mockFetch(...dane());
    renderAsCoach();

    await screen.findByText('Interwały');
    expect(screen.queryByRole('button', { name: '+ Dodaj wpis' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Uzupełnij szczegóły' })).not.toBeInTheDocument();
  });

  test('wpis podopiecznego otwiera się bez edycji i usuwania', async () => {
    mockFetch(...dane());
    renderAsCoach();

    await userEvent.click(await screen.findByText('Bieg poranny'));

    const okno = screen.getByRole('dialog');
    expect(within(okno).queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
    expect(within(okno).queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
  });

  test('403 wyprowadza z trybu', async () => {
    const onForbidden = jest.fn();
    mockFetch(
      { status: 403, body: { message: 'Brak uprawnień' } },
      { status: 200, body: [] },
      { status: 200, body: sampleCategories },
    );
    renderAsCoach(onForbidden);

    await waitFor(() => expect(onForbidden).toHaveBeenCalled());
  });
});
