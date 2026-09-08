import { formatDuration, parseDuration } from './format';

describe('formatDuration', () => {
  test('poniżej godziny pokazuje minuty', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(0)).toBe('0 min');
  });

  test('pełne godziny bez minut', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
  });

  test('godziny z minutami', () => {
    expect(formatDuration(165)).toBe('2h 45min');
    expect(formatDuration(1200)).toBe('20h');
  });
});

describe('parseDuration', () => {
  test('sama liczba to minuty — dotychczasowy nawyk musi działać', () => {
    expect(parseDuration('90')).toBe(90);
    expect(parseDuration(' 45 ')).toBe(45);
  });

  test('godziny i minuty w różnych zapisach', () => {
    expect(parseDuration('2h 45min')).toBe(165);
    expect(parseDuration('2h45')).toBe(165);
    expect(parseDuration('2h')).toBe(120);
    expect(parseDuration('45min')).toBe(45);
    expect(parseDuration('2 godz 30 min')).toBe(150);
    expect(parseDuration('2:45')).toBe(165);
  });

  test('odmawia przy zapisie, którego nie da się odczytać', () => {
    expect(parseDuration('')).toBeNull();
    expect(parseDuration('dwie godziny')).toBeNull();
    expect(parseDuration('2h 90min')).toBeNull(); // pomyłka, nie zapis czasu
    expect(parseDuration('2 45')).toBeNull();
  });

  test('to, co sformatowane, daje się odczytać z powrotem', () => {
    [1, 45, 60, 90, 165, 1200].forEach((minutes) => {
      expect(parseDuration(formatDuration(minutes))).toBe(minutes);
    });
  });
});
