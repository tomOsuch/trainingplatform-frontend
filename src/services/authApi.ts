import { apiFetch } from './apiClient';
import { LoginRequest, LoginResponse, RegisterRequest } from '../types/auth';
import { InvitationInfo } from '../types/auth';
import { PasswordResetConfirmRequest, PasswordResetInfo, PasswordResetRequest } from '../types/auth';

export function register(data: RegisterRequest): Promise<void> {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function login(data: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function logout(): Promise<void> {
  return apiFetch('/auth/logout', {
    method: 'POST',
  });
}

export function getInvitation(token: string): Promise<InvitationInfo> {
  return apiFetch<InvitationInfo>(`/auth/invitation?token=${encodeURIComponent(token)}`);
}

export function requestPasswordReset(data: PasswordResetRequest): Promise<void> {
  return apiFetch("/auth/password-reset", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getPasswordReset(token: string): Promise<PasswordResetInfo> {
  return apiFetch<PasswordResetInfo>(
    `/auth/password-reset?token=${encodeURIComponent(token)}`
  );
}

export function confirmPasswordReset(data: PasswordResetConfirmRequest): Promise<void> {
  return apiFetch("/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify(data),
  });
}