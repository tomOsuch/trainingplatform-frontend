import { apiFetch } from "./apiClient";
import { ChangePasswordRequest, UpdateProfileRequest, UserProfile } from "../types/profile";

export function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/profile");
}

export function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  return apiFetch<UserProfile>("/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function changePassword(data: ChangePasswordRequest): Promise<void> {
  return apiFetch("/profile/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}