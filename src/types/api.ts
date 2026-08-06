// src/types/api.ts

// Kształt błędu zwracanego przez backend (400/403/404/500).
// Pole `errors` pojawia się TYLKO przy błędach walidacji (400) —
// mapuje nazwę pola na komunikat, np. { email: "Email jest zajęty" }
export interface ApiError {
  timestamp: string;
  status: number;
  message: string;
  errors?: Record<string, string>;
}