import { AdminLog, AdminAction } from '@/types/adminTypes';
import { BaseAdminService } from './BaseAdminService';

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

export class LoggingService extends BaseAdminService {
  private static instance: LoggingService | null = null;

  static getInstance(): LoggingService {
    if (!LoggingService.instance) LoggingService.instance = new LoggingService();
    return LoggingService.instance;
  }

  async logAdminAction(action: string, performedBy: string, details: Record<string, any>): Promise<void> {
    try {
      await apiFetch('/admin/logs', 'POST', { action, details: { ...details, performedBy } });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  async createAdminAction(actionData: Partial<AdminAction>): Promise<AdminAction> {
    const action: AdminAction = { ...actionData, status: 'pending', createdAt: new Date() } as AdminAction;
    try {
      await apiFetch('/admin/logs', 'POST', { action: actionData.type || 'admin_action', details: actionData });
    } catch (error) {
      console.error('Error creating admin action:', error);
    }
    return action;
  }

  async getAdminLogs(limit: number = 100): Promise<AdminLog[]> {
    try {
      const data = await apiFetch(`/admin/logs?limit=${limit}`);
      return data.logs || [];
    } catch (error) {
      console.error('Error getting admin logs:', error);
      return [];
    }
  }
}

export const loggingService = LoggingService.getInstance();
