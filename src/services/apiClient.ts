import { ApiError } from '../types/api';
import { LoginResponse } from '../types/auth';
import { API_BASE_URL } from '../config';

const AUTH_PREFIX = '/auth/';

let authToken: string | null = null;
let onSessionEnd: ((message?: string) => void) | null = null;
let refreshPromise: Promise<RefreshResult> | null = null;

type RefreshResult = { ok: true; session: LoginResponse } | { ok: false; message: string | null };

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setOnSessionEnd(handler: ((message?: string) => void) | null): void {
  onSessionEnd = handler;
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

function rawFetch(path: string, options: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
}

async function doRefresh(): Promise<RefreshResult> {
  const response = await rawFetch('/auth/refresh', { method: 'POST' });

  if (response.ok) {
    const session = (await response.json()) as LoginResponse;
    setAuthToken(session.token); // nowy token obowiązuje od razu, także dla ponowienia
    return { ok: true, session };
  }

  let message: string | null = null;
  try {
    message = ((await response.json()) as ApiError).message ?? null;
  } catch {}
  return { ok: false, message };
}

function refreshOnce(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function restoreSession(): Promise<LoginResponse | null> {
  const result = await refreshOnce();
  return result.ok ? result.session : null;
}

async function toResult<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let apiError: ApiError | null = null;
    try {
      apiError = await response.json();
    } catch {}

    const retryHeader = response.headers.get('Retry-After');
    const retryAfter = retryHeader ? Number(retryHeader) : undefined;

    throw new ApiRequestError(
      response.status,
      apiError?.message ?? 'Wystąpił nieoczekiwany błąd',
      apiError?.errors,
      Number.isFinite(retryAfter) ? retryAfter : undefined,
    );
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response = await rawFetch(path, options);

  if (response.status === 401 && !path.startsWith(AUTH_PREFIX)) {
    const result = await refreshOnce();

    if (result.ok) {
      response = await rawFetch(path, options);
    } else {
      setAuthToken(null);
      onSessionEnd?.(result.message ?? undefined);
    }
  }

  return toResult<T>(response);
}
