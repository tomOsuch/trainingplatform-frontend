import { JournalItem, JournalItemState, TrainingPlan, WorkoutLog } from '../types/workout';

const RESOLVED: Record<string, JournalItemState | undefined> = { COMPLETED: 'done', SKIPPED: 'skipped', CANCELLED: 'cancelled' };

function logToItem(l: WorkoutLog): JournalItem {
  return {
    key: `log-${l.id}`,
    kind: 'log',
    id: l.id,
    date: l.performedDate,
    label: l.categoryName,
    categoryName: l.categoryName,
    categoryColor: l.categoryColor,
    durationMin: l.durationMin,
    intensity: l.intensity,
    notes: l.notes,
    state: 'done',
    fromPlan: l.planId !== null,
    time: l.performedTime,
  };
}

function planToItem(p: TrainingPlan, state: JournalItemState): JournalItem {
  return {
    key: `plan-${p.id}`,
    kind: 'plan',
    id: p.id,
    date: p.plannedDate,
    label: p.title,
    categoryName: p.categoryName,
    categoryColor: p.categoryColor,
    durationMin: p.durationMin,
    intensity: null,
    notes: p.notes,
    state,
    fromPlan: false,
    time: p.plannedTime,
  };
}

export function buildJournalItems(logs: WorkoutLog[], plans: TrainingPlan[]): JournalItem[] {
  const planIdsWithLog = new Set(logs.map((l) => l.planId).filter((id): id is number => id !== null));

  const items: JournalItem[] = [
    ...logs.map(logToItem),
    ...plans.filter((p) => RESOLVED[p.status] && !planIdsWithLog.has(p.id)).map((p) => planToItem(p, RESOLVED[p.status]!)),
  ];

  return items.sort((a, b) => b.date.localeCompare(a.date));
}
