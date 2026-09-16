export interface WorkoutTemplate {
  id: number;
  name: string;
  description: string | null;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIconName: string;
  durationMin: number | null;
}

export interface WorkoutTemplateRequest {
  name: string;
  categoryId: number;
  description?: string;
  durationMin?: number;
}