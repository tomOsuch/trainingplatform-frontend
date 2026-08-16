import { apiFetch } from "./apiClient";
import { PlanStatus, TrainingPlan, TrainingPlanRequest } from "../types/workout";

export async function getPlans(from?: string, to?: string): Promise<TrainingPlan[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const data = await apiFetch<TrainingPlan[]>(`/training-plans${qs ? `?${qs}` : ""}`);
  return data ?? []; // pusta odpowiedź -> pusta lista
}

export function getPlan(id: number): Promise<TrainingPlan> {
  return apiFetch<TrainingPlan>(`/training-plans/${id}`);
}

export function createPlan(data: TrainingPlanRequest): Promise<TrainingPlan> {
  return apiFetch<TrainingPlan>("/training-plans", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePlan(id: number, data: TrainingPlanRequest): Promise<TrainingPlan> {
  return apiFetch<TrainingPlan>(`/training-plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// 204 No Content — apiFetch zwraca undefined
export function deletePlan(id: number): Promise<void> {
  return apiFetch<void>(`/training-plans/${id}`, { method: "DELETE" });
}

export function changeStatus(id: number, status: PlanStatus): Promise<TrainingPlan> {
  return apiFetch<TrainingPlan>(`/training-plans/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}