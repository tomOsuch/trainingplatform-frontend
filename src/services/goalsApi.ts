import { apiFetch } from './apiClient';
import { Goal, GoalStatusChange, GoalStatusFilter } from '../types/goal';

export async function getGoals(status?: GoalStatusFilter): Promise<Goal[]> {
  const qs = status ? `?status=${status}` : '';
  const data = await apiFetch<Goal[]>(`/goals${qs}`);
  return data ?? [];
}

export function changeGoalStatus(id: number, status: GoalStatusChange): Promise<Goal> {
  return apiFetch<Goal>(`/goals/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}