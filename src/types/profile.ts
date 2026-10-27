import { Role } from './auth';

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string | null; // "YYYY-MM-DD"
  role: Role;
  coach: boolean;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  birthDate?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CoachModeRequest {
  enabled: boolean;
}

export interface DeleteAccountRequest {
  password: string;
}
