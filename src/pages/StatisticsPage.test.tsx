import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { renderWithProviders, mockFetch } from '../test-utils';
import StatisticsPage from './StatisticsPage';
import { Statistics } from '../types/statistics';
import { monthPeriod, shiftMonth, startOfCurrentMonth } from '../utils/period';

const stats: Statistics = {
  from: '2026-03-01',
  to: '2026-03-31',
  workoutCount: 7,
  totalMinutes: 390,
  byCategory: [
    { categoryId: 5, categoryName: 'Taniec', categoryColor: '#9B59B6', workoutCount: 4, totalMinutes: 240 },
    { categoryId: 6, categoryName: 'Gimnastyka', categoryColor: '#E74C3C', workoutCount: 2, totalMinutes: 105 },
    { categoryId: 7, categoryName: 'Ogólnorozwojowy', categoryColor: '#10B981', workoutCount: 1, totalMinutes: 45 },
  ],
  planCompletion: {
    completed: 6,
    skipped: 2,
    cancelled: 3,
    unresolved: 4,
    completionBase: 12,
    completionRate: 50,
  },
};

const emptyMonth: Statistics = {
  from: '2026-02-01',
  to: '2026-02-28',
  workoutCount: 0,
  totalMinutes: 0,
  byCategory: [],
  planCompletion: {
    completed: 0,
    skipped: 0,
    cancelled: 0,
    unresolved: 0,
    completionBase: 0,
    completionRate: null,
  },
};

function CalendarStub() {
  const { state } = useLocation();
  return <div>Kalendarz na {(state as { month?: string } | null)?.month ?? 'bez miesiąca'}</div>;
}

const renderPage = () =>
  renderWithProviders(
    <Routes>
      <Route path="/statystyki" element={<StatisticsPage />} />
      <Route path="/kalendarz" element={<CalendarStub />} />
    </Routes>,
    { route: '/statystyki' },
  );

describe('StatisticsPage', () => {
  afterEach(() => jest.restoreAllMocks());

  test('pokazuje komplet danych z jednego żądania', async () => {
    const spy = mockFetch({ status: 200, body: stats });
    renderPage();

    expect(await screen.findByText('50%')).toBeInTheDocument();
    expect(screen.getByText('50% z 12 rozstrzygniętych treningów')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('6h 30min')).toBeInTheDocument();
    expect(screen.getByText('średnio 56 min na trening')).toBeInTheDocument();
    expect(screen.getByText('Taniec')).toBeInTheDocument();
    expect(screen.getByText('4h')).toBeInTheDocument();
    expect(screen.getByText('1h 45min')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('podpis okresu pochodzi z odpowiedzi, nie z wysłanego zakresu', async () => {
    mockFetch({ status: 200, body: stats });
    renderPage();

    expect(await screen.findByText('marzec 2026')).toBeInTheDocument();
  });

  test('anulowane są widoczne, ale opisane jako poza wskaźnikiem', async () => {
    mockFetch({ status: 200, body: stats });
    renderPage();

    expect(await screen.findByText(/anulowane/)).toHaveTextContent('poza wskaźnikiem');
  });

  test('przełączenie miesiąca wysyła nowy zakres', async () => {
    const spy = mockFetch({ status: 200, body: stats }, { status: 200, body: emptyMonth });
    renderPage();

    await screen.findByText('50%');
    await userEvent.click(screen.getByRole('button', { name: 'Poprzedni miesiąc' }));

    const previous = monthPeriod(shiftMonth(startOfCurrentMonth(), -1));
    const url = String(spy.mock.calls[1][0]);
    expect(url).toContain(`from=${previous.from}`);
    expect(url).toContain(`to=${previous.to}`);
  });

  test('brak rozstrzygniętych planów daje kreskę, nie zero procent', async () => {
    mockFetch({ status: 200, body: emptyMonth });
    renderPage();

    expect(await screen.findByText('—')).toBeInTheDocument();
    expect(screen.getByText('brak rozstrzygniętych treningów w tym okresie')).toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
    expect(screen.getByText('W tym okresie nie ma jeszcze żadnych treningów ani planów.')).toBeInTheDocument();
  });

  test('okres z samymi anulowanymi też nie pokazuje procentu', async () => {
    mockFetch({
      status: 200,
      body: {
        ...emptyMonth,
        planCompletion: { ...emptyMonth.planCompletion, cancelled: 3 },
      },
    });
    renderPage();

    expect(await screen.findByText('wszystkie plany z tego okresu zostały anulowane')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  test('nierozstrzygnięte prowadzą do kalendarza na właściwym miesiącu', async () => {
    mockFetch({ status: 200, body: stats });
    renderPage();

    expect(await screen.findByText(/4 treningi czekają na rozstrzygnięcie/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Otwórz marzec 2026 w kalendarzu/ }));

    expect(screen.getByText('Kalendarz na 2026-03')).toBeInTheDocument();
  });

  test('błąd żądania pokazuje komunikat z API', async () => {
    mockFetch({ status: 500, body: { message: 'Nie udało się policzyć statystyk' } });
    renderPage();

    expect(await screen.findByText('Nie udało się policzyć statystyk')).toBeInTheDocument();
  });
});
