import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, mockFetch } from '../test-utils';
import GoalDetailsPage from './GoalDetailsPage';
import { GoalDetails } from '../types/goal';

const details: GoalDetails = {
  id: 4,
  title: '20 treningów gimnastyki',
  description: 'Regularność ważniejsza niż długość',
  categoryId: 2,
  categoryName: 'Gimnastyka',
  categoryColor: '#E74C3C',
  metric: 'SESSIONS',
  targetValue: 20,
  currentValue: 12,
  startDate: '2026-09-01',
  endDate: null,
  targetReached: false,
  achievedAt: null,
  achievedValue: null,
  entries: [
    { id: 91, title: 'Poranna sesja', performedDate: '2026-09-05', durationMin: 45, categoryName: 'Gimnastyka', categoryColor: '#E74C3C' },
    { id: 90, title: null, performedDate: '2026-09-03', durationMin: null, categoryName: 'Gimnastyka', categoryColor: '#E74C3C' },
  ],
};

const renderPage = () =>
  renderWithProviders(
    <Routes>
      <Route path="/cele/:id" element={<GoalDetailsPage />} />
    </Routes>,
    { route: '/cele/4' },
  );

describe('GoalDetailsPage', () => {
  afterEach(() => jest.restoreAllMocks());

  test('pokazuje cel i listę wliczonych treningów', async () => {
    mockFetch({ status: 200, body: details }, { status: 200, body: [] });
    renderPage();

    expect(await screen.findByText('20 treningów gimnastyki')).toBeInTheDocument();
    expect(screen.getByText('12 / 20 sesji')).toBeInTheDocument();
    expect(screen.getByText('Poranna sesja')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
    expect(screen.getByText(/2 treningi/)).toBeInTheDocument();
  });

  test('cel bez wliczonych treningów ma stan pusty', async () => {
    mockFetch({ status: 200, body: { ...details, entries: [] } }, { status: 200, body: [] });
    renderPage();

    expect(await screen.findByText('Żaden trening nie wliczył się jeszcze do tego celu.')).toBeInTheDocument();
  });

    test('cel z osiągniętym progiem zachęca do zamknięcia i wysyła PATCH', async () => {
    const closed = { ...details, currentValue: 20, targetReached: false, achievedAt: '2026-09-07T08:00:00', achievedValue: 20 };
    const spy = mockFetch(
      { status: 200, body: { ...details, currentValue: 20, targetReached: true } },
      { status: 200, body: [] },
      { status: 200, body: closed },
      { status: 200, body: closed },
    );
    renderPage();

    expect(await screen.findByText('Wartość docelowa osiągnięta. Możesz zamknąć ten cel.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Oznacz jako osiągnięty' }));

    const patch = spy.mock.calls.find(([url]) => String(url).includes('/goals/4/status'));
    expect(patch?.[1]?.method).toBe('PATCH');
    expect(patch?.[1]?.body).toBe(JSON.stringify({ status: 'ACHIEVED' }));

    expect(await screen.findByText(/postęp zamknięty/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Przywróć cel' })).toBeInTheDocument();
  });

  test('cel osiągnięty nie ma edycji, ma przywrócenie i informację o zamrożeniu', async () => {
    const spy = mockFetch(
      { status: 200, body: { ...details, achievedAt: '2026-09-04T10:12:00', achievedValue: 18 } },
      { status: 200, body: [] },
      { status: 200, body: details },
      { status: 200, body: details },
    );
    renderPage();

    expect(await screen.findByText('18 / 20 sesji')).toBeInTheDocument();
    expect(screen.getByText(/postęp zamknięty/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Przywróć cel' }));

    const patch = spy.mock.calls.find(([url]) => String(url).includes('/goals/4/status'));
    expect(patch?.[1]?.body).toBe(JSON.stringify({ status: 'ACTIVE' }));

    expect(await screen.findByRole('button', { name: 'Edytuj' })).toBeInTheDocument();
    expect(screen.getByText('12 / 20 sesji')).toBeInTheDocument();
  });

  test('klik we wpis dociąga pełny trening i otwiera szczegóły', async () => {
    const spy = mockFetch(
      { status: 200, body: details },
      { status: 200, body: [] },
      {
        status: 200,
        body: {
          id: 91,
          title: 'Poranna sesja',
          categoryId: 2,
          categoryName: 'Gimnastyka',
          categoryColor: '#E74C3C',
          planId: null,
          performedDate: '2026-09-05',
          performedTime: null,
          durationMin: 45,
          intensity: 6,
          notes: null,
        },
      },
    );
    renderPage();

    await userEvent.click(await screen.findByText('Poranna sesja'));

    expect(spy.mock.calls.some(([url]) => String(url).includes('/workout-logs/91'))).toBe(true);
    expect(await screen.findByText('Wpis z 05.09.2026')).toBeInTheDocument();
  });

  test('cudzy cel daje neutralny komunikat bez ujawniania, że istnieje', async () => {
    mockFetch({ status: 403, body: { message: 'Brak dostępu do zasobu' } }, { status: 200, body: [] });
    renderPage();

    expect(await screen.findByText('Nie znaleziono celu.')).toBeInTheDocument();
    expect(screen.queryByText('Brak dostępu do zasobu')).not.toBeInTheDocument();
  });
});
