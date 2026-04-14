// TODO: implement with real Firebase calls
import { getFirebaseDb } from './firebase';

export interface Invite {
  id: string;
  email?: string;
  status: string;
  createdAt: string;
  usedAt?: string;
}

export interface InviteStatus {
  status: string;
  email?: string;
}

export interface InviteValidation {
  valid: boolean;
  email?: string;
}

export async function getAllInvites(): Promise<Invite[]> {
  return [];
}

export async function createInvite(_email?: string): Promise<string> {
  return 'stub-invite-id';
}

export async function revokeInvite(_inviteId: string): Promise<void> {
  // stub
}

export function getInviteUrl(inviteId: string): string {
  return `/auth/invite?code=${inviteId}`;
}

export async function getInviteStatus(_inviteId: string): Promise<InviteStatus> {
  return { status: 'pending' };
}

export async function validateInvite(_code: string): Promise<InviteValidation> {
  return { valid: false };
}
