import { apiFetch } from './apiClient';
import { AccountStatus, AdminUser, AdminUsersQuery, PageResponse } from '../types/admin';

export function getUsers(query: AdminUsersQuery = {}): Promise<PageResponse<AdminUser>> {
  const params = new URLSearchParams();

  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.status) params.set('status', query.status);
  if (query.sort) params.set('sort', query.sort);
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.size !== undefined) params.set('size', String(query.size));

  const qs = params.toString();
  return apiFetch<PageResponse<AdminUser>>(`/admin/users${qs ? `?${qs}` : ''}`);
}

export function setUserStatus(id: number, status: AccountStatus): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
