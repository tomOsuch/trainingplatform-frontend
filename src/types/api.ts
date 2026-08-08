export interface ApiError {
  timestamp: string;
  status: number;
  message: string;
  errors?: Record<string, string>;
}