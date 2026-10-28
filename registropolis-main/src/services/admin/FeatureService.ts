import { FeatureFlag } from '@/types/adminTypes';
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

export class FeatureService extends BaseAdminService {
  private static instance: FeatureService | null = null;

  static getInstance(): FeatureService {
    if (!FeatureService.instance) FeatureService.instance = new FeatureService();
    return FeatureService.instance;
  }

  async toggleFeature(featureName: string, enabled: boolean, scope: 'global' | 'user' = 'global', targetUsers?: string[]): Promise<void> {
    try {
      await apiFetch(`/admin/features/${featureName}`, 'POST', { enabled, scope, targetUsers });
    } catch (error) {
      console.error('Error toggling feature:', error);
      throw new Error('Failed to toggle feature');
    }
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    const data = await apiFetch('/admin/features');
    return (data.features || []).map((f: any) => ({
      name: f.name,
      enabled: f.enabled,
      scope: f.scope || 'global',
      targetUsers: f.targetUsers || [],
      moderationEnabled: f.moderationEnabled ?? false,
      moderationRules: f.moderationRules || {},
      lastModified: new Date(f.lastModified || Date.now()),
      modifiedBy: f.modifiedBy || 'system',
    }));
  }
}

export const featureService = FeatureService.getInstance();
