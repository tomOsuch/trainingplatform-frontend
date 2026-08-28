import { Role } from './auth';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface Invitation {
  id: number;
  email: string;
  role: Role;
  status: InvitationStatus;
  invitedByEmail: string;
  expiresAt: string;
  sentAt: string | null;
  createdAt: string;
}

export interface InvitationRequest {
  email: string;
  role: Role;
}