export type PlanStatus = "PLANNED" | "COMPLETED" | "SKIPPED" | "CANCELLED";

export interface WorkoutCategory {
  id: number;
  name: string;
  color: string;
  iconName: string; // np. "dance" — przyda się do ikon w UI
}

export interface TrainingPlan {
    id: number;
  title: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  plannedDate: string;
  plannedTime: string | null;
  durationMin: number | null;
  notes: string | null;
  status: PlanStatus;
}

export interface TrainingPlanRequest {
  title: string;
  categoryId: number;
  plannedDate: string;   // nie może być przeszła (BR backendu)
  plannedTime?: string;
  durationMin?: number;  // > 0
  notes?: string;
}