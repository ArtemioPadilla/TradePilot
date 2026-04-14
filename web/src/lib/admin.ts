// TODO: implement with real Firebase calls
import { getFirebaseDb } from './firebase';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
}

export async function getAdminStats(): Promise<AdminStats> {
  return {
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    suspendedUsers: 0,
  };
}

export async function getAllUsers(): Promise<AdminUser[]> {
  return [];
}

export async function approveUser(_uid: string): Promise<void> {
  // stub
}

export async function suspendUser(_uid: string): Promise<void> {
  // stub
}

export async function reactivateUser(_uid: string): Promise<void> {
  // stub
}

export async function updateUserRole(_uid: string, _role: string): Promise<void> {
  // stub
}
