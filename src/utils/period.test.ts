import { isCurrentMonth, monthKey, monthLabel, monthPeriod, periodLabelFromResponse, shiftMonth } from './period';

const day = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

describe('monthPeriod', () => {
  test('zwraca pierwszy i ostatni dzień miesiąca', () => {
    expect(monthPeriod(day('2026-03-17'))).toEqual({ from: '2026-03-01', to: '2026-03-31' });
    expect(monthPeriod(day('2026-04-01'))).toEqual({ from: '2026-04-01', to: '2026-04-30' });
  });

  test('luty w roku przestępnym i nieprzestępnym', () => {
    expect(monthPeriod(day('2026-02-10')).to).toBe('2026-02-28');
    expect(monthPeriod(day('2028-02-10')).to).toBe('2028-02-29');
  });

  test('granice nie uciekają przez strefę czasową', () => {
    expect(monthPeriod(day('2026-03-01')).from).toBe('2026-03-01');
    expect(monthPeriod(day('2026-12-31'))).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });
});

describe('nawigacja po miesiącach', () => {
  test('przesuwa w tył i w przód, przechodząc przez granicę roku', () => {
    expect(monthPeriod(shiftMonth(day('2026-01-15'), -1)).from).toBe('2025-12-01');
    expect(monthPeriod(shiftMonth(day('2026-12-15'), 1)).from).toBe('2027-01-01');
  });

  test('rozpoznaje bieżący miesiąc', () => {
    expect(isCurrentMonth(day('2026-03-01'), day('2026-03-17'))).toBe(true);
    expect(isCurrentMonth(day('2026-02-01'), day('2026-03-17'))).toBe(false);
    expect(isCurrentMonth(day('2025-03-01'), day('2026-03-17'))).toBe(false);
  });
});

describe('etykiety', () => {
  test('nazwa miesiąca z kotwicy i z odpowiedzi dają to samo', () => {
    expect(monthLabel(day('2026-03-01'))).toBe('marzec 2026');
    expect(periodLabelFromResponse('2026-03-01')).toBe('marzec 2026');
  });

  test('klucz miesiąca dla przejścia do kalendarza', () => {
    expect(monthKey('2026-03-01')).toBe('2026-03');
  });
});
