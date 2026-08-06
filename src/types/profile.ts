// src/types/profile.ts
import { Role } from "./auth";

// Odpowiedź z GET /profile — pełne dane zalogowanego użytkownika
export interface UserProfile {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string | null; // format ISO "YYYY-MM-DD", może być puste
  role: Role;
}