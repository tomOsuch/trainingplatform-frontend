import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import WeeklyChart from './WeeklyChart';
import { WeeklyBucket } from '../types/statistics';

const weeks: WeeklyBucket[] = [
  { weekStart: '2026-02-23', weekEnd: '2026-03-01', partial: true, workoutCount: 1, totalMinutes: 45 },
  { weekStart: '2026-03-02', weekEnd: '2026-03-08', partial: false, workoutCount: 4, totalMinutes: 240 },
  { weekStart: '2026-03-09', weekEnd: '2026-03-15', partial: false, workoutCount: 0, totalMinutes: 0 },
  { weekStart: '2026-03-16', weekEnd: '2026-03-22', partial: false, workoutCount: 2, totalMinutes: 105 },
  { weekStart: '2026-03-23', weekEnd: '2026-03-29', partial: false, workoutCount: 0, totalMinutes: 0 },
  { weekStart: '2026-03-30', weekEnd: '2026-04-05', partial: true, workoutCount: 0, totalMinutes: 0 },
];

describe('WeeklyChart', () => {
  test('tydzień przycięty granicą okresu jest opisany jako niepełny', () => {
    renderWithProviders(<WeeklyChart weeks={weeks} today="2026-03-18" />);

    expect(screen.getByText('23.02 – 1.03 · tydzień przycięty granicą okresu · 1 trening · 45 min')).toBeInTheDocument();
  });

  test('tydzień, w którym jesteśmy, jest niepełny z innego powodu', () => {
    renderWithProviders(<WeeklyChart weeks={weeks} today="2026-03-18" />);

    expect(screen.getByText('16.03 – 22.03 · tydzień jeszcze trwa · 2 treningi · 1h 45min')).toBeInTheDocument();
  });

  test('tygodnie z przyszłości nie pokazują zera', () => {
    renderWithProviders(<WeeklyChart weeks={weeks} today="2026-03-18" />);

    expect(screen.getByText('23.03 – 29.03 · tydzień jeszcze się nie zaczął')).toBeInTheDocument();
    expect(screen.getByText('30.03 – 5.04 · tydzień jeszcze się nie zaczął')).toBeInTheDocument();
  });

  test('przerwa w treningach jest widoczna, nie pominięta', () => {
    renderWithProviders(<WeeklyChart weeks={weeks} today="2026-03-18" />);

    expect(screen.getByText('9.03 – 15.03 · brak treningów')).toBeInTheDocument();
  });

  test('ten sam zestaw oglądany później nie ma już tygodni niepełnych z powodu daty', () => {
    renderWithProviders(<WeeklyChart weeks={weeks} today="2026-04-10" />);

    expect(screen.getByText('23.03 – 29.03 · brak treningów')).toBeInTheDocument();
    expect(screen.queryByText(/jeszcze się nie zaczął/)).not.toBeInTheDocument();
    expect(screen.queryByText(/jeszcze trwa/)).not.toBeInTheDocument();
  });

  test('okres bez treningów pokazuje zdanie zamiast pustej siatki', () => {
    renderWithProviders(<WeeklyChart weeks={weeks.map((w) => ({ ...w, workoutCount: 0, totalMinutes: 0 }))} today="2026-04-10" />);

    expect(screen.getByText(/nie ma żadnych treningów/)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Aktywność tygodniowa' })).not.toBeInTheDocument();
  });
});
