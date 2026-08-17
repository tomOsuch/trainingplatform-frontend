import { apiFetch } from "./apiClient";
import { WorkoutLog, WorkoutLogFilters, WorkoutLogRequest } from "../types/workout";

export async function getLogs(filters: WorkoutLogFilters = {}): Promise<WorkoutLog[]> {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set("categoryId", String(filters.categoryId));
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);

  const qs = params.toString();
  const data = await apiFetch<WorkoutLog[]>(`/workout-logs${qs ? `?${qs}` : ""}`);
  return data ?? []; // pusta odpowiedź -> pusta lista
}

export function getLog(id: number): Promise<WorkoutLog> {
  return apiFetch<WorkoutLog>(`/workout-logs/${id}`);
}

export function createLog(data: WorkoutLogRequest): Promise<WorkoutLog> {
  return apiFetch<WorkoutLog>("/workout-logs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateLog(id: number, data: WorkoutLogRequest): Promise<WorkoutLog> {
  return apiFetch<WorkoutLog>(`/workout-logs/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteLog(id: number): Promise<void> {
  return apiFetch<void>(`/workout-logs/${id}`, { method: "DELETE" });
}