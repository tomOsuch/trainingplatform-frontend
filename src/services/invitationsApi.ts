import { apiFetch } from "./apiClient";
import { Invitation, InvitationRequest } from "../types/invitation";

export async function getInvitations(): Promise<Invitation[]> {
  const data = await apiFetch<Invitation[]>("/invitations");
  return data ?? [];
}

export function createInvitation(data: InvitationRequest): Promise<Invitation> {
  return apiFetch<Invitation>("/invitations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function revokeInvitation(id: number): Promise<void> {
  return apiFetch<void>(`/invitations/${id}`, { method: "DELETE" });
}