import { toISODate, MONTH_NAMES } from './calendar';

export interface Period {
  from: string;
  to: string;
}

export function monthPeriod(anchor: Date): Period {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  return {
    from: toISODate(new Date(year, month, 1)),
    to: toISODate(new Date(year, month + 1, 0)),
  };
}

export function shiftMonth(anchor: Date, direction: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
}

export function startOfCurrentMonth(today: Date = new Date()): Date {
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

export function isCurrentMonth(anchor: Date, today: Date = new Date()): boolean {
  return anchor.getFullYear() === today.getFullYear() && anchor.getMonth() === today.getMonth();
}

export function monthLabel(anchor: Date): string {
  return `${MONTH_NAMES[anchor.getMonth()].toLowerCase()} ${anchor.getFullYear()}`;
}

export function periodLabelFromResponse(from: string): string {
  const [year, month] = from.split('-').map(Number);
  return `${MONTH_NAMES[month - 1].toLowerCase()} ${year}`;
}

export function monthKey(from: string): string {
  return from.slice(0, 7);
}
