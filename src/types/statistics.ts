export interface CategoryStat {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIconName: string;
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

export interface IntensityStat {
  average: number | null;
  ratedCount: number;
  totalCount: number;
}

export interface Statistics {
  from: string;
  to: string;
  workoutCount: number;
  totalMinutes: number;
  byCategory: CategoryStat[];
  planCompletion: PlanCompletion;
  intensity: IntensityStat;
  plannedCount: number;
  adHocCount: number;
}

export interface WeeklyBucket {
  weekStart: string;
  weekEnd: string;
  partial: boolean;
  workoutCount: number;
  totalMinutes: number;
}

export interface WeeklyStatistics {
  from: string;
  to: string;
  workoutCount: number;
  totalMinutes: number;
  weeks: WeeklyBucket[];
}
