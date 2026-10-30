import { apiFetch } from './apiClient';
import { ChangePasswordRequest, UpdateProfileRequest, UserProfile, CoachModeRequest } from '../types/profile';
import { DeleteAccountRequest } from '../types/profile';

export function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/profile');
}

export function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  return apiFetch<UserProfile>('/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function changePassword(data: ChangePasswordRequest): Promise<void> {
  return apiFetch('/profile/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function setCoachMode(enabled: boolean): Promise<UserProfile> {
  const body: CoachModeRequest = { enabled };
  return apiFetch<UserProfile>('/profile/coach', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function deleteAccount(data: DeleteAccountRequest): Promise<void> {
  return apiFetch('/profile', {
    method: 'DELETE',
    body: JSON.stringify(data),
  });
}
