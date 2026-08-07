// src/services/apiClient.ts
import { ApiError } from '../types/api';

const BASE_URL = 'http://localhost:8080/api';

// Token trzymany w tym module — AuthContext (Task 4) będzie go
// ustawiał przez setAuthToken() przy logowaniu/wylogowaniu
let authToken: string | null = null;

// Callback wywoływany przy 401 — AuthContext zarejestruje tu logout()
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setOnUnauthorized(callback: (() => void) | null): void {
  onUnauthorized = callback;
}

// Własna klasa błędu — niesie status HTTP i mapę błędów walidacji,
// żeby formularze mogły pokazać komunikaty pod właściwymi polami
export class ApiRequestError extends Error {
  status: number;
  errors?: Record<string, string>;

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const hadToken = authToken !== null;
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 401 Z tokenem = sesja wygasła -> auto-wylogowanie.
  // 401 BEZ tokenu (np. błędne hasło przy logowaniu) = zwykły błąd,
  // który obsłuży formularz — dlatego sprawdzamy hadToken
  if (response.status === 401 && hadToken) {
    onUnauthorized?.();
  }

  if (!response.ok) {
    let apiError: ApiError | null = null;
    try {
      apiError = await response.json();
    } catch {
      // odpowiedź bez JSON-a (np. 500 z pustym body)
    }
    throw new ApiRequestError(
      response.status,
      apiError?.message ?? "Wystąpił nieoczekiwany błąd",
      apiError?.errors
    );
  }

  if (response.status === 204) return undefined as T; // DELETE bez body
  return response.json();
}