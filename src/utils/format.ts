export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const last = n % 10;
  const lastTwo = n % 100;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

export function formatWaitTime(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} ${plural(minutes, 'minutę', 'minuty', 'minut')}`;
  }
  return `${seconds} ${plural(seconds, 'sekundę', 'sekundy', 'sekund')}`;
}

export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;

  if (!h) return `${m} min`;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export function parseDuration(input: string): number | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  if (/^\d+$/.test(text)) return Number(text);

  const clock = text.match(/^(\d+):([0-5]\d)$/); // 2:45
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);

  const match = text.match(/^(?:(\d+)\s*(?:h|g|godz\.?|godzin[ayę]?)\s*)?(?:(\d+)\s*(?:m|min\.?|minut[ayę]?)?)?$/);
  if (!match || (match[1] === undefined && match[2] === undefined)) return null;

  const hours = Number(match[1] ?? 0);
  const mins = Number(match[2] ?? 0);

  if (match[1] !== undefined && mins >= 60) return null;

  return hours * 60 + mins;
}
