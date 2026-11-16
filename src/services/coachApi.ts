import { apiFetch } from './apiClient';
import { Athlete } from '../types/cooperation';

export async function getAthletes(): Promise<Athlete[]> {
  const data = await apiFetch<Athlete[]>('/coach/athletes');
  return data ?? [];
}

export async function isMyAthlete(athleteId: number): Promise<boolean> {
  return (await getAthletes()).some((a) => a.id === athleteId);
}
