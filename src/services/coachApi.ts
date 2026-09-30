import { apiFetch } from './apiClient';
import { Athlete } from '../types/cooperation';

export async function getAthletes(): Promise<Athlete[]> {
  const data = await apiFetch<Athlete[]>('/coach/athletes');
  return data ?? [];
}
