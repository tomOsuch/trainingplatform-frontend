function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const last = n % 10;
  const lastTwo = n % 100;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

export function formatWaitTime(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} ${plural(minutes, "minutę", "minuty", "minut")}`;
  }
  return `${seconds} ${plural(seconds, "sekundę", "sekundy", "sekund")}`;
}