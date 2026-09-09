import { apiFetch } from './apiClient';
import { Statistics } from '../types/statistics';

export function getStatistics(from?: string, to?: string): Promise<Statistics> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return apiFetch<Statistics>(`/statistics${qs ? `?${qs}` : ''}`);
}
