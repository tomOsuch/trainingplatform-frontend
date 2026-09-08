import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch } from '../test-utils';
import GoalDetailsModal from './GoalDetailsModal';
import { Goal, GoalEntry } from '../types/goal';

const goal: Goal = {
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
};

const entries: GoalEntry[] = [
  { id: 91, title: 'Poranna sesja', performedDate: '2026-09-05', durationMin: 45, categoryName: 'Gimnastyka', categoryColor: '#E74C3C' },
  { id: 90, title: null, performedDate: '2026-09-03', durationMin: null, categoryName: 'Gimnastyka', categoryColor: '#E74C3C' },
];

const noop = () => {};

const open = (props: Partial<React.ComponentProps<typeof GoalDetailsModal>> = {}) =>
  renderWithProviders(<GoalDetailsModal goal={goal} onClose={noop} onEdit={noop} onOpenEntry={noop} onChanged={noop} {...props} />);

describe('GoalDetailsModal', () => {
  afterEach(() => jest.restoreAllMocks());

  test('pokazuje dane celu natychmiast, jeszcze przed odpowiedzią z listą treningów', () => {
    mockFetch({ status: 200, body: { entries } });
    open();

    expect(screen.getByText('20 treningów gimnastyki')).toBeInTheDocument();
    expect(screen.getByText('12 / 20 sesji')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  test('dociąga i pokazuje wliczone treningi', async () => {
    const spy = mockFetch({ status: 200, body: { entries } });
    open();

    expect(await screen.findByText('Poranna sesja')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
    expect(screen.getByText(/2 treningi/)).toBeInTheDocument();
    expect(String(spy.mock.calls[0][0])).toContain('/goals/4');
  });

  test('cel bez wliczonych treningów ma stan pusty', async () => {
    mockFetch({ status: 200, body: { entries: [] } });
    open();

    expect(await screen.findByText('Żaden trening nie wliczył się jeszcze do tego celu.')).toBeInTheDocument();
  });

  test('błąd listy treningów nie psuje reszty okna', async () => {
    mockFetch({ status: 500, body: { message: 'Nie udało się pobrać' } });
    open();

    expect(await screen.findByText('Nie udało się pobrać')).toBeInTheDocument();
    expect(screen.getByText('12 / 20 sesji')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edytuj' })).toBeInTheDocument();
  });

  test('osiągnięty próg zachęca do zamknięcia i wysyła PATCH', async () => {
    const onChanged = jest.fn();
    const onClose = jest.fn();
    const spy = mockFetch(
      { status: 200, body: { entries } },
      { status: 200, body: { ...goal, achievedAt: '2026-09-08T09:00:00', achievedValue: 20 } },
    );
    open({ goal: { ...goal, currentValue: 20, targetReached: true }, onChanged, onClose });

    expect(screen.getByText('Wartość docelowa osiągnięta. Możesz zamknąć ten cel.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Oznacz jako osiągnięty' }));

    const patch = spy.mock.calls.find(([url]) => String(url).includes('/goals/4/status'));
    expect(patch?.[1]?.method).toBe('PATCH');
    expect(patch?.[1]?.body).toBe(JSON.stringify({ status: 'ACHIEVED' }));
    expect(onChanged).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test('cel osiągnięty nie ma edycji, ma przywrócenie', async () => {
    const spy = mockFetch({ status: 200, body: { entries } }, { status: 200, body: goal });
    open({ goal: { ...goal, achievedAt: '2026-09-04T10:12:00', achievedValue: 18 } });

    expect(screen.getByText('18 / 20 sesji')).toBeInTheDocument();
    expect(screen.getByText(/postęp zamknięty/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Przywróć cel' }));

    const patch = spy.mock.calls.find(([url]) => String(url).includes('/goals/4/status'));
    expect(patch?.[1]?.body).toBe(JSON.stringify({ status: 'ACTIVE' }));
  });

  test('kliknięcie treningu przekazuje wpis do rodzica', async () => {
    const onOpenEntry = jest.fn();
    mockFetch({ status: 200, body: { entries } });
    open({ onOpenEntry });

    await userEvent.click(await screen.findByText('Poranna sesja'));

    expect(onOpenEntry).toHaveBeenCalledWith(entries[0]);
  });
});
