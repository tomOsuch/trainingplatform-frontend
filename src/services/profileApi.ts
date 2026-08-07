// src/services/profileApi.ts
import { apiFetch } from "./apiClient";
import { UserProfile } from "../types/profile";

export function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/profile");
}