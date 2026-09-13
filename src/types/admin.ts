import { Role } from './auth';

export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export type AdminUsersSort = 'LAST_NAME' | 'NEWEST';

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminUsersQuery {
  search?: string;
  status?: AccountStatus;
  sort?: AdminUsersSort;
  page?: number;
  size?: number;
}
