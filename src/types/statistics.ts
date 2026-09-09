export interface CategoryStat {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  workoutCount: number;
  totalMinutes: number;
}

export interface PlanCompletion {
  completed: number;
  skipped: number;
  cancelled: number;
  unresolved: number;
  completionBase: number;
  completionRate: number | null;
}

export interface Statistics {
  from: string;
  to: string;
  workoutCount: number;
  totalMinutes: number;
  byCategory: CategoryStat[];
  planCompletion: PlanCompletion;
}
