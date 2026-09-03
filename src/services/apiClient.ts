import { ApiError } from "../types/api";

const BASE_URL = "http://localhost:8080/api";

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setOnUnauthorized(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export class ApiRequestError extends Error {
  status: number;
  errors?: Record<string, string>;
  retryAfter?: number;

  constructor(status: number, message: string, errors?: Record<string, string>, retryAfter?: number) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.retryAfter = retryAfter;
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

  if (response.status === 401 && hadToken) {
    onUnauthorized?.();
  }

   if (!response.ok) {
    let apiError: ApiError | null = null;
    try {
      apiError = await response.json();
    } catch {
      // odpowiedź bez JSON-a
    }

    // Retry-After przychodzi przy 429; nagłówek jest tekstem, więc parsujemy
    const retryHeader = response.headers.get("Retry-After");
    const retryAfter = retryHeader ? Number(retryHeader) : undefined;

    throw new ApiRequestError(
      response.status,
      apiError?.message ?? "Wystąpił nieoczekiwany błąd",
      apiError?.errors,
      Number.isFinite(retryAfter) ? retryAfter : undefined
    );
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}