export type CooperationRole = 'COACH' | 'ATHLETE';

export type CooperationStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED' | 'ENDED';

export interface CooperationInvitation {
  id: number;
  role: CooperationRole;
  partnerId: number;
  partnerFirstName: string | null;
  partnerLastName: string | null;
  partnerEmail: string;
  status: CooperationStatus;
  createdAt: string;
  expiresAt: string;
}

export interface Cooperation {
  id: number;
  role: CooperationRole;
  partnerId: number;
  partnerFirstName: string | null;
  partnerLastName: string | null;
  partnerEmail: string;
  since: string;
}

export interface Athlete {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  cooperationSince: string;
}

export type InvitationDecision = 'ACCEPTED' | 'REJECTED';
