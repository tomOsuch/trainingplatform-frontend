import {
  CalendarItem,
  CalendarItemState,
  PlanStatus,
  TrainingPlan,
  WorkoutLog,
} from "../types/workout";

const PLAN_STATE: Record<PlanStatus, CalendarItemState> = {
  PLANNED: "planned",
  COMPLETED: "done",
  SKIPPED: "skipped",
  CANCELLED: "cancelled",
};

export function planToItem(p: TrainingPlan): CalendarItem {
  return {
    key: `plan-${p.id}`,
    kind: "plan",
    id: p.id,
    date: p.plannedDate,
    time: p.plannedTime,
    durationMin: p.durationMin,
    label: p.title,
    color: p.categoryColor,
    state: PLAN_STATE[p.status],
  };
}

export function logToItem(l: WorkoutLog): CalendarItem {
  return {
    key: `log-${l.id}`,
    kind: "log",
    id: l.id,
    date: l.performedDate,
    time: null,
    durationMin: l.durationMin,
    label: l.durationMin ? `${l.categoryName} ${l.durationMin}′` : l.categoryName,
    color: l.categoryColor,
    state: "done", 
  };
}

export function buildItemsByDay(
  plans: TrainingPlan[],
  logs: WorkoutLog[]
): Map<string, CalendarItem[]> {
  const items = [
    ...plans.map(planToItem),
    ...logs.filter((l) => l.planId === null).map(logToItem),
  ];

  const map = new Map<string, CalendarItem[]>();
  for (const it of items) {
    const list = map.get(it.date) ?? [];
    list.push(it);
    map.set(it.date, list);
  }

  map.forEach((list) =>
    list.sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"))
  );

  return map;
}