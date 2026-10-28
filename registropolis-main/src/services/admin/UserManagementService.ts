import { UserActivity, UserRestriction } from '@/types/adminTypes';
import { BaseAdminService } from './BaseAdminService';
import { loggingService } from './LoggingService';
import { isStaffRole } from '@/config/adminAccess';

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

  async restrictUser(
    userId: string,
    restriction: Omit<UserRestriction, 'id' | 'userId' | 'userName' | 'status'>,
  ): Promise<void> {
    try {
      await apiFetch(`/admin/users/${userId}/restrict`, 'POST', restriction);
    } catch (error) {
      console.error('Error restricting user:', error);
      throw new Error('Failed to restrict user');
    }
  }

  async updateUserRole(userId: string, newRole: string): Promise<void> {
    try {
      if (newRole === 'user') {
        await apiFetch(`/admin/users/${encodeURIComponent(userId)}/role`, 'PATCH', { role: 'user', staffRole: null });
      } else if (isStaffRole(newRole)) {
        await apiFetch(`/admin/users/${encodeURIComponent(userId)}/role`, 'PATCH', {
          role: 'admin',
          staffRole: newRole,
        });
      } else {
        throw new Error('Invalid staff access level');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await apiFetch(`/admin/users/${encodeURIComponent(userId)}`, 'DELETE');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async getUserActivities(userId?: string, limit: number = 100): Promise<UserActivity[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (userId) params.set('userId', userId);
    const data = await apiFetch(`/admin/activity?${params}`);
    return data.activities || [];
  }

  async getUserRestrictions(userId?: string): Promise<UserRestriction[]> {
    const path = userId
      ? `/admin/users/${encodeURIComponent(userId)}/restrictions`
      : '/admin/restrictions';
    const data = await apiFetch(path);
    return data.restrictions || [];
  }

  async liftRestriction(restrictionId: string): Promise<void> {
    await apiFetch(`/admin/restrictions/${encodeURIComponent(restrictionId)}/lift`, 'PATCH');
  }

  async trackUserActivity(_activity: Omit<UserActivity, 'timestamp'>): Promise<void> {
    // Tracked server-side
  }
}

export const userManagementService = UserManagementService.getInstance();
