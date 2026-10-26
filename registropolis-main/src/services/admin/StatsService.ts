import { AdminStats } from '@/types/adminTypes';
import { BaseAdminService } from './BaseAdminService';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path: string) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export class StatsService extends BaseAdminService {
  private static instance: StatsService | null = null;

  static getInstance(): StatsService {
    if (!StatsService.instance) StatsService.instance = new StatsService();
    return StatsService.instance;
  }

  async getDashboardStats(): Promise<AdminStats> {
    try {
      const data = await apiFetch('/admin/stats');
      return {
        totalUsers: data.data?.totalUsers || 0,
        totalMessages: data.data?.totalMessages || 0,
        totalGroups: data.data?.totalGroups || 0,
        lastUpdated: new Date(data.data?.lastUpdated || Date.now()),
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw new Error('Failed to get dashboard statistics');
    }
  }
}

export const statsService = StatsService.getInstance();
