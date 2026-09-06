import { Goal } from '../types/goal';
import { plural } from './format';

const MONTHS_GENITIVE = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
];

const DAY_MS = 86_400_000;

export function isAchieved(goal: Goal): boolean {
  return goal.achievedAt !== null;
}

export function progressValue(goal: Goal): number {
  return isAchieved(goal) ? goal.achievedValue ?? 0 : goal.currentValue;
}

export function progressPercent(goal: Goal): number {
  if (goal.targetValue <= 0) return 0; // backend tego nie dopuszcza, ale dzielenie przez zero psuje cały widok
  return Math.round((progressValue(goal) / goal.targetValue) * 100);
}

export function progressWidth(goal: Goal): number {
  return Math.min(100, Math.max(0, progressPercent(goal)));
}

export function unitLabel(goal: Goal, value: number): string {
  return goal.metric === "MINUTES"
    ? plural(value, "minuta", "minuty", "minut")
    : plural(value, "sesja", "sesje", "sesji");
}

export function formatProgress(goal: Goal): string {
  return `${progressValue(goal)} / ${goal.targetValue} ${unitLabel(goal, goal.targetValue)}`;
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysLeft(goal: Goal, today: Date = new Date()): number | null {
  if (!goal.endDate) return null;
  const end = parseISO(goal.endDate);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // zaokrąglenie, nie obcięcie: doba zmiany czasu ma 23 albo 25 godzin
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

export interface DeadlineInfo {
  text: string;
  overdue: boolean;
}

export function deadlineLabel(goal: Goal, today: Date = new Date()): DeadlineInfo | null {
  const days = daysLeft(goal, today);
  if (days === null) return null;

  if (days < 0) {
    const n = Math.abs(days);
    return { text: `termin minął ${n} ${plural(n, "dzień", "dni", "dni")} temu`, overdue: true };
  }
  if (days === 0) return { text: "dziś ostatni dzień", overdue: false };
  if (days === 1) return { text: "został 1 dzień", overdue: false };
  return { text: `zostało ${days} dni`, overdue: false };
}

function dayMonth(iso: string, withYear: boolean): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_GENITIVE[m - 1]}${withYear ? ` ${y}` : ""}`;
}

export function periodLabel(goal: Goal, today: Date = new Date()): string {
  const [startYear, startMonth, startDay] = goal.startDate.split("-").map(Number);
  const currentYear = today.getFullYear();

  if (!goal.endDate) {
    return `od ${dayMonth(goal.startDate, startYear !== currentYear)}`;
  }

  const [endYear, endMonth, endDay] = goal.endDate.split("-").map(Number);
  const withYear = startYear !== currentYear || endYear !== currentYear;

  if (startYear === endYear && startMonth === endMonth) {
    return `${startDay}–${endDay} ${MONTHS_GENITIVE[endMonth - 1]}${withYear ? ` ${endYear}` : ""}`;
  }

  return `${dayMonth(goal.startDate, withYear)} – ${dayMonth(goal.endDate, withYear)}`;
}

export function achievedLabel(goal: Goal): string | null {
  if (!goal.achievedAt) return null;
  return `osiągnięty ${dayMonth(goal.achievedAt.slice(0, 10), false)}`;
}

export function sortGoals(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    if (isAchieved(a) && isAchieved(b)) {
      return (b.achievedAt ?? "").localeCompare(a.achievedAt ?? "");
    }
    if (a.targetReached !== b.targetReached) return a.targetReached ? -1 : 1;
    if (!a.endDate) return b.endDate ? 1 : 0;
    if (!b.endDate) return -1;
    return a.endDate.localeCompare(b.endDate);
  });
}