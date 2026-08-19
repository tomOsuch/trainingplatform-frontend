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

export interface WorkoutLog {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  planId: number | null;      // powiązanie z planem (null = trening niezaplanowany)
  performedDate: string;      // "YYYY-MM-DD"
  durationMin: number | null;
  intensity: number | null;   // 1–10
  notes: string | null;
}

export interface WorkoutLogRequest {
  categoryId: number;
  performedDate: string;  // nie może być przyszła (BR backendu)
  planId?: number;
  durationMin?: number;   // > 0
  intensity?: number;     // 1–10
  notes?: string;
}

export interface WorkoutLogFilters {
  categoryId?: number;
  from?: string;
  to?: string;
}

export type CalendarItemState = "planned" | "done" | "skipped" | "cancelled";
export interface CalendarItem {
  key: string;              // "plan-12" / "log-5" — unikalny w całej siatce
  kind: "plan" | "log";
  id: number;
  date: string;             // YYYY-MM-DD
  time: string | null;      // wpisy nie mają godziny
  durationMin: number | null;
  label: string;
  color: string;
  state: CalendarItemState;
}