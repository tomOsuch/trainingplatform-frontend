import { Goal } from '../types/goal';
import { deadlineLabel, daysLeft, formatProgress, periodLabel, progressPercent, progressValue, progressWidth, sortGoals } from './goal';

const base: Goal = {
  id: 1,
  title: 'Cel',
  description: null,
  categoryId: null,
  categoryName: null,
  categoryColor: null,
  metric: 'SESSIONS',
  targetValue: 20,
  currentValue: 5,
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  targetReached: false,
  achievedAt: null,
  achievedValue: null,
};

const goal = (patch: Partial<Goal>): Goal => ({ ...base, ...patch });
const day = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

describe('postęp celu', () => {
  test('cel aktywny liczy się na bieżąco, osiągnięty pokazuje migawkę', () => {
    expect(progressValue(goal({ currentValue: 5 }))).toBe(5);

    const closed = goal({ currentValue: 999, achievedAt: '2026-09-04T10:00:00', achievedValue: 18 });
    expect(progressValue(closed)).toBe(18);
  });

  test('procent może przekroczyć 100, ale pasek nie wychodzi poza tor', () => {
    const over = goal({ currentValue: 25, targetValue: 20 });
    expect(progressPercent(over)).toBe(125);
    expect(progressWidth(over)).toBe(100);
  });

  test('wartość docelowa 0 nie wywraca widoku', () => {
    expect(progressPercent(goal({ targetValue: 0 }))).toBe(0);
  });

  test('jednostka odmienia się od wartości docelowej', () => {
    expect(formatProgress(goal({ currentValue: 5, targetValue: 20 }))).toBe('5 / 20 sesji');
    expect(formatProgress(goal({ currentValue: 1, targetValue: 2 }))).toBe('1 / 2 sesje');
    expect(formatProgress(goal({ metric: 'MINUTES', currentValue: 720, targetValue: 1200 }))).toBe('12h / 20h');
    expect(formatProgress(goal({ metric: 'MINUTES', currentValue: 0, targetValue: 1 }))).toBe('0 min / 1 min');
  });
});

describe('termin celu', () => {
  test('cel otwarty nie ma terminu', () => {
    expect(daysLeft(goal({ endDate: null }), day('2026-09-10'))).toBeNull();
    expect(deadlineLabel(goal({ endDate: null }), day('2026-09-10'))).toBeNull();
  });

  test('odlicza dni i odmienia komunikat', () => {
    expect(deadlineLabel(goal({ endDate: '2026-09-30' }), day('2026-09-18'))).toEqual({
      text: 'zostało 12 dni',
      overdue: false,
    });
    expect(deadlineLabel(goal({ endDate: '2026-09-30' }), day('2026-09-29'))).toEqual({
      text: 'został 1 dzień',
      overdue: false,
    });
    expect(deadlineLabel(goal({ endDate: '2026-09-30' }), day('2026-09-30'))).toEqual({
      text: 'dziś ostatni dzień',
      overdue: false,
    });
  });

  test('po terminie oznacza cel jako przeterminowany', () => {
    expect(deadlineLabel(goal({ endDate: '2026-08-31' }), day('2026-09-05'))).toEqual({
      text: 'termin minął 5 dni temu',
      overdue: true,
    });
    expect(deadlineLabel(goal({ endDate: '2026-09-04' }), day('2026-09-05'))).toEqual({
      text: 'termin minął 1 dzień temu',
      overdue: true,
    });
  });

  test('zmiana czasu nie gubi dnia', () => {
    expect(daysLeft(goal({ endDate: '2026-03-30' }), day('2026-03-28'))).toBe(2);
    expect(daysLeft(goal({ endDate: '2026-10-26' }), day('2026-10-24'))).toBe(2);
  });
});

describe('okno czasowe', () => {
  test('ten sam miesiąc skraca się do jednej nazwy', () => {
    expect(periodLabel(goal({ startDate: '2026-09-01', endDate: '2026-09-30' }), day('2026-09-10'))).toBe('1–30 września');
  });

  test('różne miesiące pokazują obie daty', () => {
    expect(periodLabel(goal({ startDate: '2026-08-12', endDate: '2026-10-03' }), day('2026-09-10'))).toBe('12 sierpnia – 3 października');
  });

  test('cel otwarty ma tylko datę początkową', () => {
    expect(periodLabel(goal({ startDate: '2026-08-01', endDate: null }), day('2026-09-10'))).toBe('od 1 sierpnia');
  });

  test('rok pojawia się tylko wtedy, gdy nie jest bieżący', () => {
    expect(periodLabel(goal({ startDate: '2025-12-01', endDate: '2025-12-31' }), day('2026-09-10'))).toBe('1–31 grudnia 2025');
  });
});

describe('kolejność celów', () => {
  test('najpierw wymagające decyzji, potem najbliższy termin, otwarte na końcu', () => {
    const soon = goal({ id: 1, endDate: '2026-09-10' });
    const later = goal({ id: 2, endDate: '2026-12-01' });
    const open = goal({ id: 3, endDate: null });
    const reached = goal({ id: 4, endDate: '2026-11-01', targetReached: true });

    expect(sortGoals([open, later, soon, reached]).map((g) => g.id)).toEqual([4, 1, 2, 3]);
  });

  test('osiągnięte idą od najświeższych', () => {
    const older = goal({ id: 1, achievedAt: '2026-07-31T12:00:00', achievedValue: 20 });
    const newer = goal({ id: 2, achievedAt: '2026-09-04T10:00:00', achievedValue: 18 });

    expect(sortGoals([older, newer]).map((g) => g.id)).toEqual([2, 1]);
  });

  test('nie modyfikuje tablicy wejściowej', () => {
    const input = [goal({ id: 1, endDate: '2026-12-01' }), goal({ id: 2, endDate: '2026-09-10' })];
    sortGoals(input);
    expect(input.map((g) => g.id)).toEqual([1, 2]);
  });
});
