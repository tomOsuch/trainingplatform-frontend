import { apiFetch } from './apiClient';
import { Goal, GoalDetails, GoalEntry, GoalRequest, GoalStatusChange, GoalStatusFilter } from '../types/goal';

export async function getGoals(status?: GoalStatusFilter): Promise<Goal[]> {
  const qs = status ? `?status=${status}` : '';
  const data = await apiFetch<Goal[]>(`/goals${qs}`);
  return data ?? [];
}

export async function getGoalEntries(id: number): Promise<GoalEntry[]> {
  const data = await apiFetch<GoalDetails>(`/goals/${id}`);
  return data?.entries ?? [];
}

export function changeGoalStatus(id: number, status: GoalStatusChange): Promise<Goal> {
  return apiFetch<Goal>(`/goals/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function createGoal(data: GoalRequest): Promise<Goal> {
  return apiFetch<Goal>('/goals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateGoal(id: number, data: GoalRequest): Promise<Goal> {
  return apiFetch<Goal>(`/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteGoal(id: number): Promise<void> {
  return apiFetch<void>(`/goals/${id}`, { method: 'DELETE' });
}
