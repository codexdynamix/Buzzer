import { APP_FEATURES } from '@/config/features';

export interface AdminFeatureControl {
  featureId: string;
  enabled: boolean;
  moderationEnabled: boolean;
  restrictedToRoles?: string[];
  moderationRules?: {
    requiresApproval?: boolean;
    autoModeration?: boolean;
    maxDailySubmissions?: number;
  };
}

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
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export async function updateFeatureControls(featureId: string, controls: Partial<AdminFeatureControl>) {
  const { featureId: _featureId, ...updates } = controls;
  await apiFetch(`/admin/features/${featureId}`, 'POST', updates);
}

export async function getFeatureControls(featureId: string): Promise<AdminFeatureControl | null> {
  const data = await apiFetch('/admin/features');
  if (!data?.features) throw new Error('Feature controls response is invalid');
  const flag = data.features.find((f: any) => f.name === featureId);
  if (!flag) {
    return {
      featureId,
      enabled: false,
      moderationEnabled: false,
      moderationRules: {},
    };
  }
  return {
    featureId: flag.name,
    enabled: flag.enabled,
    moderationEnabled: flag.moderationEnabled ?? false,
    restrictedToRoles: flag.restrictedToRoles || [],
    moderationRules: flag.moderationRules || {},
  };
}

export async function initializeFeatureControls() {
  const data = await apiFetch('/admin/features');
  if (!data?.features) throw new Error('Feature controls response is invalid');
  const existingNames = data.features.map((f: any) => f.name);
  for (const feature of Object.values(APP_FEATURES)) {
    if (!existingNames.includes(feature)) {
      await apiFetch(`/admin/features/${feature}`, 'POST', {
        enabled: true,
        scope: 'global',
        targetUsers: [],
      });
    }
  }
}
