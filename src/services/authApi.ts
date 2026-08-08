import { apiFetch } from "./apiClient";
import { LoginRequest, LoginResponse, RegisterRequest } from "../types/auth";

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

export function logout(): Promise<void> {
  return apiFetch("/auth/logout", {
    method: "POST",
  });
}