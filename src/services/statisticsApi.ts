import { apiFetch } from './apiClient';
import { scope } from './scope';
import { Statistics, WeeklyStatistics } from '../types/statistics';

export function getStatistics(from?: string, to?: string, athleteId?: number): Promise<Statistics> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return apiFetch<Statistics>(`${scope(athleteId)}/statistics${qs ? `?${qs}` : ''}`);
}

export function getWeeklyStatistics(from: string, to: string, athleteId?: number): Promise<WeeklyStatistics> {
  const params = new URLSearchParams({ from, to });
  return apiFetch<WeeklyStatistics>(`${scope(athleteId)}/statistics/weekly?${params.toString()}`);
}
