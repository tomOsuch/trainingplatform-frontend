/* eslint-disable testing-library/no-node-access */
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch } from '../test-utils';
import GoalsPage from './GoalsPage';
import { Goal } from '../types/goal';

const base: Goal = {
  id: 1,
  title: 'Przetańczyć 20 godzin we wrześniu',
  description: null,
  categoryId: 1,
  categoryName: 'Taniec',
  categoryColor: '#9B59B6',
  metric: 'MINUTES',
  targetValue: 1200,
  currentValue: 720,
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  targetReached: false,
  achievedAt: null,
  achievedValue: null,
};

const reached: Goal = {
  ...base,
  id: 2,
  title: '20 treningów gimnastyki',
  metric: 'SESSIONS',
  targetValue: 20,
  currentValue: 20,
  targetReached: true,
};

const openGoal: Goal = {
  ...base,
  id: 3,
  title: '50 treningów siłowych',
  categoryId: null,
  categoryName: null,
  categoryColor: null,
  metric: 'SESSIONS',
  targetValue: 50,
  currentValue: 7,
  endDate: null,
};

const achievedGoal: Goal = {
  ...base,
  id: 4,
  title: '15 treningów w wakacje',
  metric: 'SESSIONS',
  targetValue: 20,
  currentValue: 999, // celowo: po zamknięciu liczy się wyłącznie migawka
  targetReached: false,
  achievedAt: '2026-09-04T10:12:00',
  achievedValue: 18,
};

const cardFor = (title: string): HTMLElement => {
  const card = screen.getByText(title).closest('div');
  if (!card) throw new Error(`Nie znaleziono karty celu "${title}"`);
  return card.parentElement as HTMLElement;
};

describe('GoalsPage', () => {
  afterEach(() => jest.restoreAllMocks());

  test('pobiera aktywne cele i pokazuje postęp z jednostką', async () => {
    const spy = mockFetch({ status: 200, body: [base, openGoal] });
    renderWithProviders(<GoalsPage />);

    expect(await screen.findByText('720 / 1200 minut')).toBeInTheDocument();
    expect(screen.getByText('7 / 50 sesji')).toBeInTheDocument();
    expect(spy.mock.calls[0][0]).toContain('/goals?status=active');
  });

  test('cel bez terminu i bez kategorii ma własne podpisy', async () => {
    mockFetch({ status: 200, body: [openGoal] });
    renderWithProviders(<GoalsPage />);

    expect(await screen.findByText('bez terminu')).toBeInTheDocument();
    expect(screen.getByText('Wszystkie kategorie')).toBeInTheDocument();
  });

  test('cel z osiągniętym progiem ma plakietkę i zamyka się przyciskiem', async () => {
    const spy = mockFetch(
      { status: 200, body: [reached] },
      { status: 200, body: { ...reached, achievedAt: '2026-09-06T09:00:00', achievedValue: 20 } },
      { status: 200, body: [] }, // odświeżenie listy aktywnych po zamknięciu
    );
    renderWithProviders(<GoalsPage />);

    expect(await screen.findByText('Cel osiągnięty')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Oznacz jako osiągnięty' }));

    const [url, options] = spy.mock.calls[1];
    expect(url).toContain('/goals/2/status');
    expect(options?.method).toBe('PATCH');
    expect(options?.body).toBe(JSON.stringify({ status: 'ACHIEVED' }));

    expect(await screen.findByText('Nie masz jeszcze żadnych celów. Dodaj pierwszy!')).toBeInTheDocument();
  });

  test('przełącznik pobiera osiągnięte i pokazuje migawkę postępu', async () => {
    const spy = mockFetch({ status: 200, body: [base] }, { status: 200, body: [achievedGoal] });
    renderWithProviders(<GoalsPage />);

    await screen.findByText('720 / 1200 minut');
    await userEvent.click(screen.getByRole('button', { name: 'Osiągnięte' }));

    // 18 z migawki, nie 999 z currentValue
    expect(await screen.findByText('18 / 20 sesji')).toBeInTheDocument();
    expect(screen.getByText('osiągnięty 4 września')).toBeInTheDocument();
    expect(spy.mock.calls[1][0]).toContain('/goals?status=achieved');
  });

  test('pusta sekcja osiągniętych ma własny komunikat', async () => {
    mockFetch({ status: 200, body: [base] }, { status: 200, body: [] });
    renderWithProviders(<GoalsPage />);

    await screen.findByText('720 / 1200 minut');
    await userEvent.click(screen.getByRole('button', { name: 'Osiągnięte' }));

    expect(await screen.findByText('Nie masz jeszcze osiągniętych celów.')).toBeInTheDocument();
  });

  test('błąd pobrania pokazuje komunikat z API', async () => {
    mockFetch({ status: 500, body: { message: 'Coś poszło nie tak' } });
    renderWithProviders(<GoalsPage />);

    expect(await screen.findByText('Coś poszło nie tak')).toBeInTheDocument();
  });
});