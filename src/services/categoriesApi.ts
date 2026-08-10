import { apiFetch } from "./apiClient";
import { WorkoutCategory } from "../types/workout";

export function getCategories(): Promise<WorkoutCategory[]> {
  return apiFetch<WorkoutCategory[]>("/workout-categories");
}