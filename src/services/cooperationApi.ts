import { apiFetch } from './apiClient';
import { Cooperation, CooperationInvitation, InvitationDecision } from '../types/cooperation';

export async function getCooperationInvitations(): Promise<CooperationInvitation[]> {
  const data = await apiFetch<CooperationInvitation[]>('/cooperation-invitations');
  return data ?? [];
}

export function createCooperationInvitation(email: string): Promise<CooperationInvitation> {
  return apiFetch<CooperationInvitation>('/cooperation-invitations', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function answerCooperationInvitation(id: number, decision: InvitationDecision): Promise<CooperationInvitation> {
  return apiFetch<CooperationInvitation>(`/cooperation-invitations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ decision }),
  });
}

export function withdrawCooperationInvitation(id: number): Promise<void> {
  return apiFetch<void>(`/cooperation-invitations/${id}`, { method: 'DELETE' });
}

export async function getCooperations(): Promise<Cooperation[]> {
  const data = await apiFetch<Cooperation[]>('/cooperations');
  return data ?? [];
}

export function endCooperation(id: number): Promise<void> {
  return apiFetch<void>(`/cooperations/${id}`, { method: 'DELETE' });
}