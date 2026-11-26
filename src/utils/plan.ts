import { TrainingPlan } from '../types/workout';

export function canCoachEditPlan(plan: TrainingPlan, currentUserId: number | undefined): boolean {
  return currentUserId !== undefined && plan.createdById === currentUserId;
}