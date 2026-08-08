import { Role } from "./auth";

export interface UserProfile {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string | null; // format ISO "YYYY-MM-DD", może być puste
  role: Role;
}