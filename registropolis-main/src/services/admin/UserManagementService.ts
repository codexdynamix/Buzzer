import { UserActivity, UserRestriction } from '@/types/adminTypes';
import { BaseAdminService } from './BaseAdminService';
import { loggingService } from './LoggingService';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path: string, method = 'GET', body?: any) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export class UserManagementService extends BaseAdminService {
  private static instance: UserManagementService | null = null;

  static getInstance(): UserManagementService {
    if (!UserManagementService.instance) UserManagementService.instance = new UserManagementService();
    return UserManagementService.instance;
  }

  async restrictUser(userId: string, restriction: Omit<UserRestriction, 'userId' | 'status'>): Promise<void> {
    try {
      await apiFetch(`/admin/users/${userId}/restrict`, 'POST', restriction);
    } catch (error) {
      console.error('Error restricting user:', error);
      throw new Error('Failed to restrict user');
    }
  }

  async updateUserRole(userId: string, newRole: 'user' | 'admin' | 'moderator'): Promise<void> {
    try {
      await apiFetch(`/admin/users/${userId}/role`, 'PATCH', { role: newRole });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await apiFetch(`/admin/users/${userId}`, 'DELETE');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async getUserActivities(_userId?: string, _limit: number = 100): Promise<UserActivity[]> {
    return [];
  }

  async getUserRestrictions(userId?: string): Promise<UserRestriction[]> {
    try {
      if (!userId) return [];
      const data = await apiFetch(`/admin/users/${userId}/restrictions`);
      return data.restrictions || [];
    } catch (error) {
      console.error('Error getting user restrictions:', error);
      return [];
    }
  }

  async trackUserActivity(_activity: Omit<UserActivity, 'timestamp'>): Promise<void> {
    // Tracked server-side
  }
}

export const userManagementService = UserManagementService.getInstance();
