import { apiFetch } from './apiClient';
import { NotificationSettings } from '../types/notifications';

export function getNotificationSettings(): Promise<NotificationSettings> {
  return apiFetch<NotificationSettings>('/profile/notifications');
}

export function updateNotificationSettings(data: NotificationSettings): Promise<NotificationSettings> {
  return apiFetch<NotificationSettings>('/profile/notifications', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}