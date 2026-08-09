export type Role = "USER" | "ADMIN";

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: "Bearer";
  userId: number;
  email: string;
  role: Role;
}

export interface User {
  userId: number;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
}