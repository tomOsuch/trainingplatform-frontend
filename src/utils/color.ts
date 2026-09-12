const FALLBACK_HEX = "2563eb";

function normalizeHex(hex: string): string {
  const h = (hex ?? "").trim().replace("#", "");

  if (/^[0-9a-fA-F]{6}$/.test(h)) return h.toLowerCase();
  if (/^[0-9a-fA-F]{3}$/.test(h)) return h.toLowerCase().split("").map((c) => c + c).join("");

  if (process.env.NODE_ENV === "development") {
    console.warn(`[color] Nierozpoznany kolor kategorii: "${hex}" — użyto wartości awaryjnej`);
  }
  return FALLBACK_HEX;
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = normalizeHex(hex);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function darkenHex(hex: string, factor = 0.55): string {
  const h = normalizeHex(hex);
  const d = (s: string) => Math.round(parseInt(s, 16) * factor).toString(16).padStart(2, "0");
  return `#${d(h.slice(0, 2))}${d(h.slice(2, 4))}${d(h.slice(4, 6))}`;
}

export function lightenHex(hex: string, factor = 0.45): string {
  const h = normalizeHex(hex);
  const l = (s: string) => {
    const v = parseInt(s, 16);
    return Math.round(255 - (255 - v) * factor).toString(16).padStart(2, "0");
  };
  return `#${l(h.slice(0, 2))}${l(h.slice(2, 4))}${l(h.slice(4, 6))}`;
}