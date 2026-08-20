export type PlanStatus = "PLANNED" | "COMPLETED" | "SKIPPED" | "CANCELLED";

export interface WorkoutCategory {
  id: number;
  name: string;
  color: string;
  iconName: string; 
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
  plannedDate: string;  
  plannedTime?: string;
  durationMin?: number; 
  notes?: string;
}

export interface WorkoutLog {
  id: number;
  title: string | null;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  planId: number | null;     
  performedDate: string;
  performedTime: string | null;     
  durationMin: number | null;
  intensity: number | null;  
  notes: string | null;
}

export interface WorkoutLogRequest {
  title?: string;
  categoryId: number;
  performedDate: string;
  performedTime?: string; 
  planId?: number;
  durationMin?: number;  
  intensity?: number;     
  notes?: string;
}

export interface WorkoutLogFilters {
  categoryId?: number;
  from?: string;
  to?: string;
}

export type CalendarItemState = "planned" | "done" | "skipped" | "cancelled";
export interface CalendarItem {
  key: string;            
  kind: "plan" | "log";
  id: number;
  date: string;        
  time: string | null;   
  durationMin: number | null;
  label: string;
  color: string;
  state: CalendarItemState;
}

export type JournalItemState = "done" | "skipped" | "cancelled";

export interface JournalItem {
  key: string;
  kind: "log" | "plan";
  id: number;
  date: string;
  label: string; 
  categoryName: string;
  categoryColor: string;
  durationMin: number | null;
  intensity: number | null; 
  notes: string | null;
  state: JournalItemState;
  fromPlan: boolean;     
  time: string | null; 
}