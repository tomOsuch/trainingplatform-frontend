export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function darkenHex(hex: string, factor = 0.55): string {
  const h = hex.replace("#", "");
  const d = (s: string) =>
    Math.round(parseInt(s, 16) * factor).toString(16).padStart(2, "0");
  return `#${d(h.slice(0, 2))}${d(h.slice(2, 4))}${d(h.slice(4, 6))}`;
}