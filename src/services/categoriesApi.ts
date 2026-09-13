import { apiFetch } from "./apiClient";
import { WorkoutCategory, WorkoutCategoryRequest } from "../types/workout";

export function getCategories(): Promise<WorkoutCategory[]> {
  return apiFetch<WorkoutCategory[]>("/workout-categories");
}

export function getIconNames(): Promise<string[]> {
  return apiFetch<string[]>("/workout-categories/icons");
}

export function createCategory(data: WorkoutCategoryRequest): Promise<WorkoutCategory> {
  return apiFetch<WorkoutCategory>("/workout-categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCategory(id: number, data: WorkoutCategoryRequest): Promise<WorkoutCategory> {
  return apiFetch<WorkoutCategory>(`/workout-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCategory(id: number): Promise<void> {
  return apiFetch<void>(`/workout-categories/${id}`, { method: "DELETE" });
}