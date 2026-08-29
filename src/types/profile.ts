import { Role } from './auth';

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string | null; // "YYYY-MM-DD"
  role: Role;
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

export interface DeleteAccountRequest {
  password: string;
}
