export type GoalMetric = 'SESSIONS' | 'MINUTES';

export type GoalStatusFilter = 'active' | 'achieved';

export type GoalStatusChange = 'ACTIVE' | 'ACHIEVED';

export interface Goal {
  id: number;
  title: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  metric: GoalMetric;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string | null;
  targetReached: boolean;
  achievedAt: string | null;
  achievedValue: number | null;
}

export interface GoalRequest {
  title: string;
  description?: string;
  categoryId?: number;
  metric: GoalMetric;
  targetValue: number;
  startDate: string;
  endDate?: string;
}

export interface GoalEntry {
  id: number;
  title: string | null;
  performedDate: string;
  durationMin: number | null;
  categoryName: string;
  categoryColor: string;
}

export interface GoalDetails extends Goal {
  entries: GoalEntry[];
}