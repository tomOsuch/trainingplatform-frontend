import { CalendarItem } from '../types/workout';
import { layoutDay } from './weekLayout';

let seq = 0;
const item = (time: string | null, durationMin: number | null, label = `t${++seq}`): CalendarItem => ({
  key: `plan-${seq}`,
  kind: 'plan',
  id: seq,
  date: '2026-09-07',
  time,
  durationMin,
  label,
  color: '#9B59B6',
  state: 'planned',
});

const summary = (items: CalendarItem[]) => layoutDay(items).map((p) => ({ label: p.item.label, column: p.column, columns: p.columns }));

describe('layoutDay', () => {
  test('treningi bez zachodzenia zajmują pełną szerokość', () => {
    const a = item('09:00', 60, 'rano');
    const b = item('17:00', 60, 'wieczorem');

    expect(summary([a, b])).toEqual([
      { label: 'rano', column: 0, columns: 1 },
      { label: 'wieczorem', column: 0, columns: 1 },
    ]);
  });

  test('dwa zachodzące dzielą dzień na dwie kolumny', () => {
    const a = item('17:00', 60, 'rozgrzewka');
    const b = item('17:30', 60, 'trening');

    expect(summary([a, b])).toEqual([
      { label: 'rozgrzewka', column: 0, columns: 2 },
      { label: 'trening', column: 1, columns: 2 },
    ]);
  });

  test('łańcuch A–B–C ma wspólną szerokość, a C wraca do wolnej kolumny', () => {
    const a = item('10:00', 60, 'A');
    const b = item('10:30', 60, 'B');
    const c = item('11:00', 60, 'C');

    expect(summary([a, b, c])).toEqual([
      { label: 'A', column: 0, columns: 2 },
      { label: 'B', column: 1, columns: 2 },
      { label: 'C', column: 0, columns: 2 },
    ]);
  });

  test('trzy jednocześnie dają trzy kolumny', () => {
    const a = item('18:00', 90, 'A');
    const b = item('18:15', 60, 'B');
    const c = item('18:30', 30, 'C');

    expect(summary([a, b, c]).map((s) => s.columns)).toEqual([3, 3, 3]);
    expect(summary([a, b, c]).map((s) => s.column)).toEqual([0, 1, 2]);
  });

  test('osobne grupy nie wpływają na siebie', () => {
    const a = item('08:00', 60, 'A');
    const b = item('08:30', 60, 'B');
    const c = item('12:00', 60, 'C');

    expect(summary([a, b, c])).toEqual([
      { label: 'A', column: 0, columns: 2 },
      { label: 'B', column: 1, columns: 2 },
      { label: 'C', column: 0, columns: 1 },
    ]);
  });

  test('brak czasu trwania to domyślna godzina', () => {
    const a = item('19:00', null, 'bez czasu');
    const b = item('19:30', 30, 'krótki');

    expect(summary([a, b]).map((s) => s.columns)).toEqual([2, 2]);
  });

  test('przy równym starcie dłuższy trening idzie na lewo', () => {
    const short = item('07:00', 30, 'krótki');
    const long = item('07:00', 90, 'długi');

    expect(summary([short, long])).toEqual([
      { label: 'długi', column: 0, columns: 2 },
      { label: 'krótki', column: 1, columns: 2 },
    ]);
  });
});
