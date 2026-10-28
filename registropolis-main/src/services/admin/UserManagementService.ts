import { UserActivity, UserRestriction } from '@/types/adminTypes';
import type { StaffRole } from '@/config/adminAccess';
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

  async updateUserRole(userId: string, newRole: 'user' | StaffRole): Promise<void> {
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

  async getUserActivities(userId?: string, limit: number = 100): Promise<UserActivity[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (userId) params.set('userId', userId);
    const data = await apiFetch(`/admin/activity?${params}`);
    return (data.activities || []).map((activity: UserActivity) => ({
      ...activity,
      userId: activity.performedBy || activity.userId,
      actorName: activity.actorName,
      timestamp: new Date(activity.timestamp),
    }));
  }

  async getUserRestrictions(userId?: string): Promise<UserRestriction[]> {
    const path = userId ? `/admin/users/${userId}/restrictions` : '/admin/restrictions';
    const data = await apiFetch(path);
    return data.restrictions || [];
  }

  async liftRestriction(restrictionId: string): Promise<void> {
    await apiFetch(`/admin/restrictions/${restrictionId}/lift`, 'PATCH');
  }

  async trackUserActivity(_activity: Omit<UserActivity, 'timestamp'>): Promise<void> {
    // Tracked server-side
  }
}

export const userManagementService = UserManagementService.getInstance();
