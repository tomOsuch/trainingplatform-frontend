// src/services/authApi.ts
import { apiFetch } from "./apiClient";
import { LoginRequest, LoginResponse, RegisterRequest } from "../types/auth";

// 201 — body odpowiedzi ignorujemy, bo zaraz po rejestracji
// i tak robimy auto-login
export function register(data: RegisterRequest): Promise<void> {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// POST /auth/logout — best-effort; przy stateless JWT wylogowanie
// i tak dzieje się po stronie frontu (czyszczenie tokenu)
export function logout(): Promise<void> {
  return apiFetch("/auth/logout", {
    method: "POST",
  });
}