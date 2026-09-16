import { apiFetch } from './apiClient';
import { WorkoutTemplate, WorkoutTemplateRequest } from '../types/template';

export async function getTemplates(): Promise<WorkoutTemplate[]> {
  const data = await apiFetch<WorkoutTemplate[]>('/workout-templates');
  return data ?? [];
}

export function createTemplate(data: WorkoutTemplateRequest): Promise<WorkoutTemplate> {
  return apiFetch<WorkoutTemplate>('/workout-templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTemplate(id: number, data: WorkoutTemplateRequest): Promise<WorkoutTemplate> {
  return apiFetch<WorkoutTemplate>(`/workout-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteTemplate(id: number): Promise<void> {
  return apiFetch<void>(`/workout-templates/${id}`, {
    method: 'DELETE',
  });
}
