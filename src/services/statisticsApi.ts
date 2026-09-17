import { apiFetch } from './apiClient';
import { Statistics, WeeklyStatistics } from '../types/statistics';

export function getStatistics(from?: string, to?: string): Promise<Statistics> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return apiFetch<Statistics>(`/statistics${qs ? `?${qs}` : ''}`);
}

export function getWeeklyStatistics(from: string, to: string): Promise<WeeklyStatistics> {
  const params = new URLSearchParams({ from, to });
  return apiFetch<WeeklyStatistics>(`/statistics/weekly?${params.toString()}`);
}
