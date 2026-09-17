import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { renderWithProviders, mockFetch } from '../test-utils';
import StatisticsPage from './StatisticsPage';
import { Statistics, WeeklyStatistics } from '../types/statistics';
import { monthPeriod, shiftMonth, startOfCurrentMonth } from '../utils/period';

const stats: Statistics = {
  from: '2026-03-01',
  to: '2026-03-31',
  workoutCount: 7,
  totalMinutes: 390,
  byCategory: [
    { categoryId: 5, categoryName: 'Taniec', categoryColor: '#9B59B6', categoryIconName: 'music', workoutCount: 4, totalMinutes: 240 },
    {
      categoryId: 6,
      categoryName: 'Gimnastyka',
      categoryColor: '#E74C3C',
      categoryIconName: 'person-standing',
      workoutCount: 2,
      totalMinutes: 105,
    },
    {
      categoryId: 7,
      categoryName: 'Ogólnorozwojowy',
      categoryColor: '#10B981',
      categoryIconName: 'dumbbell',
      workoutCount: 1,
      totalMinutes: 45,
    },
  ],
  planCompletion: {
    completed: 6,
    skipped: 2,
    cancelled: 3,
    unresolved: 4,
    completionBase: 12,
    completionRate: 50,
  },
  intensity: { average: 8.5, ratedCount: 5, totalCount: 7 },
  plannedCount: 5,
  adHocCount: 2,
};

// Sumy tygodni zgadzają się z workoutCount i totalMinutes z /statistics - atrapa
// niezgodna z niezmiennikiem testowałaby sytuację, której serwer nie potrafi wyprodukować.
const weekly: WeeklyStatistics = {
  from: '2026-03-01',
  to: '2026-03-31',
  workoutCount: 7,
  totalMinutes: 390,
  weeks: [
    { weekStart: '2026-02-23', weekEnd: '2026-03-01', partial: true, workoutCount: 1, totalMinutes: 45 },
    { weekStart: '2026-03-02', weekEnd: '2026-03-08', partial: false, workoutCount: 4, totalMinutes: 240 },
    { weekStart: '2026-03-09', weekEnd: '2026-03-15', partial: false, workoutCount: 0, totalMinutes: 0 },
    { weekStart: '2026-03-16', weekEnd: '2026-03-22', partial: false, workoutCount: 2, totalMinutes: 105 },
    { weekStart: '2026-03-23', weekEnd: '2026-03-29', partial: false, workoutCount: 0, totalMinutes: 0 },
    { weekStart: '2026-03-30', weekEnd: '2026-04-05', partial: true, workoutCount: 0, totalMinutes: 0 },
  ],
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
  intensity: { average: null, ratedCount: 0, totalCount: 0 },
  plannedCount: 0,
  adHocCount: 0,
};

const emptyWeekly: WeeklyStatistics = { from: '2026-02-01', to: '2026-02-28', workoutCount: 0, totalMinutes: 0, weeks: [] };

const okres = (s: Statistics = stats, w: WeeklyStatistics = weekly) => [
  { status: 200, body: s },
  { status: 200, body: w },
];

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

  test('pokazuje komplet danych ze statystyk i wykresu', async () => {
    const spy = mockFetch(...okres());
    renderPage();

    expect(await screen.findByText('50%')).toBeInTheDocument();
    expect(screen.getByText('50% z 12 rozstrzygniętych treningów')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('6h 30min')).toBeInTheDocument();
    expect(screen.getByText('średnio 56 min na trening')).toBeInTheDocument();
    expect(screen.getByText('Taniec')).toBeInTheDocument();
    expect(screen.getByText('4h')).toBeInTheDocument();
    expect(screen.getByText('1h 45min')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('podpis okresu pochodzi z odpowiedzi, nie z wysłanego zakresu', async () => {
    mockFetch(...okres());
    renderPage();

    expect(await screen.findByText('marzec 2026')).toBeInTheDocument();
  });

  test('anulowane są widoczne, ale opisane jako poza wskaźnikiem', async () => {
    mockFetch(...okres());
    renderPage();

    expect(await screen.findByText(/anulowane/)).toHaveTextContent('poza wskaźnikiem');
  });

  test('wykres tygodniowy idzie osobnym żądaniem na ten sam okres', async () => {
    const spy = mockFetch(...okres());
    renderPage();

    await screen.findByText('50%');
    expect(screen.getByRole('list', { name: 'Aktywność tygodniowa' })).toBeInTheDocument();

    const current = monthPeriod(startOfCurrentMonth());
    const url = String(spy.mock.calls[1][0]);
    expect(url).toContain('/statistics/weekly');
    expect(url).toContain(`from=${current.from}`);
    expect(url).toContain(`to=${current.to}`);
  });

  test('awaria wykresu nie zabiera z ekranu reszty statystyk', async () => {
    mockFetch({ status: 200, body: stats }, { status: 500, body: { message: 'Nie udało się policzyć wykresu' } });
    renderPage();

    expect(await screen.findByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Nie udało się pobrać wykresu aktywności.')).toBeInTheDocument();
  });

  test('przełączenie miesiąca wysyła nowy zakres', async () => {
    const spy = mockFetch(...okres(), ...okres(emptyMonth, emptyWeekly));
    renderPage();

    await screen.findByText('50%');
    await userEvent.click(screen.getByRole('button', { name: 'Poprzedni miesiąc' }));

    const previous = monthPeriod(shiftMonth(startOfCurrentMonth(), -1));
    const url = String(spy.mock.calls[2][0]);
    expect(url).toContain(`from=${previous.from}`);
    expect(url).toContain(`to=${previous.to}`);
  });

  test('brak rozstrzygniętych planów daje kreskę, nie zero procent', async () => {
    mockFetch(...okres(emptyMonth, emptyWeekly));
    renderPage();

    expect(await screen.findByText('—')).toBeInTheDocument();
    expect(screen.getByText('brak rozstrzygniętych treningów w tym okresie')).toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
    expect(screen.getByText('W tym okresie nie ma jeszcze żadnych treningów ani planów.')).toBeInTheDocument();
  });

  test('okres z samymi anulowanymi też nie pokazuje procentu', async () => {
    mockFetch(...okres({ ...emptyMonth, planCompletion: { ...emptyMonth.planCompletion, cancelled: 3 } }, emptyWeekly));
    renderPage();

    expect(await screen.findByText('wszystkie plany z tego okresu zostały anulowane')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  test('nierozstrzygnięte prowadzą do kalendarza na właściwym miesiącu', async () => {
    mockFetch(...okres());
    renderPage();

    expect(await screen.findByText(/4 treningi czekają na rozstrzygnięcie/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Otwórz marzec 2026 w kalendarzu/ }));

    expect(screen.getByText('Kalendarz na 2026-03')).toBeInTheDocument();
  });

  test('błąd żądania pokazuje komunikat z API', async () => {
    mockFetch({ status: 500, body: { message: 'Nie udało się policzyć statystyk' } }, { status: 200, body: weekly });
    renderPage();

    expect(await screen.findByText('Nie udało się policzyć statystyk')).toBeInTheDocument();
  });

  test('średnia intensywność idzie z licznikiem pokrycia', async () => {
    mockFetch(...okres());
    renderPage();

    expect(await screen.findByText(/^8,5/)).toBeInTheDocument();
    expect(screen.getByText('oceniono 5 z 7 treningów')).toBeInTheDocument();
  });

  test('brak ocen pokazuje kreskę, nie zero', async () => {
    mockFetch(...okres({ ...stats, intensity: { average: null, ratedCount: 0, totalCount: 7 } }));
    renderPage();

    expect(await screen.findByText('żaden trening nie ma jeszcze oceny')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  test('treningi poza planem są rozbiciem liczby treningów', async () => {
    mockFetch(...okres());
    renderPage();

    expect(await screen.findByText('5 z planu · 2 poza planem')).toBeInTheDocument();
  });

  test('okres bez treningów poza planem nie wypisuje zera', async () => {
    mockFetch(...okres({ ...stats, plannedCount: 7, adHocCount: 0 }));
    renderPage();

    expect(await screen.findByText('wszystkie z planu')).toBeInTheDocument();
  });
});
