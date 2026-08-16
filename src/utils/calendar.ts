export interface CalendarDay {
  date: Date;
  iso: string;
  inCurrentMonth: boolean;
  isToday: boolean;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildMonthGrid(anchor: Date): CalendarDay[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // getDay(): Nd=0 -> Pn=0
  const start = new Date(year, month, 1 - startOffset);
  const todayIso = toISODate(new Date());

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = toISODate(date);
    return { date, iso, inCurrentMonth: date.getMonth() === month, isToday: iso === todayIso };
  });
}

// poniedziałek tygodnia, w którym leży podana data
export function startOfWeek(d: Date): Date {
  const offset = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
}

// 7 kolejnych dni od poniedziałku
export function buildWeekGrid(anchor: Date): CalendarDay[] {
  const start = startOfWeek(anchor);
  const todayIso = toISODate(new Date());
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = toISODate(date);
    return { date, iso, inCurrentMonth: true, isToday: iso === todayIso };
  });
}

// "18:30" -> 1110 (minuty od północy); null -> null
export function timeToMinutes(t: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export const MONTH_NAMES = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];

export const WEEKDAY_NAMES = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
