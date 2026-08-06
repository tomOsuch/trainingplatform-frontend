// src/types/auth.ts
export type Role = "USER" | "ADMIN";

// Body wysyłane do POST /auth/register
// UWAGA: bez potwierdzenia hasła i bez daty urodzenia —
// potwierdzenie hasła sprawdzamy tylko na froncie i NIE wysyłamy go do API
export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

// Body wysyłane do POST /auth/login
export interface LoginRequest {
  email: string;
  password: string;
}

// Odpowiedź z POST /auth/login (200)
export interface LoginResponse {
  token: string;
  type: "Bearer";
  userId: number;
  email: string;
  role: Role;
}

// Zalogowany użytkownik trzymany w AuthContext.
// firstName/lastName są opcjonalne, bo logowanie ich nie zwraca —
// dociągamy je osobno z GET /profile (Task 8, Navbar)
export interface User {
  userId: number;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
}