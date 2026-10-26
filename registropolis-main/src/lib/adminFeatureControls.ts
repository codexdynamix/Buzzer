import { APP_FEATURES } from '@/config/features';

export interface AdminFeatureControl {
  featureId: string;
  enabled: boolean;
  moderationEnabled: boolean;
  restrictedToRoles?: string[];
  moderationRules?: {
    requiresApproval: boolean;
    autoModeration: boolean;
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
  if (!res.ok) return null;
  return res.json();
}

export async function updateFeatureControls(featureId: string, controls: Partial<AdminFeatureControl>) {
  await apiFetch(`/admin/features/${featureId}`, 'POST', {
    enabled: controls.enabled ?? true,
    scope: 'global',
  });
}

export async function getFeatureControls(featureId: string): Promise<AdminFeatureControl | null> {
  const data = await apiFetch('/admin/features');
  if (!data?.features) return null;
  const flag = data.features.find((f: any) => f.name === featureId);
  if (!flag) return null;
  return {
    featureId: flag.name,
    enabled: flag.enabled,
    moderationEnabled: true,
    restrictedToRoles: ['admin', 'user'],
    moderationRules: { requiresApproval: false, autoModeration: true, maxDailySubmissions: 50 },
  };
}

export async function initializeFeatureControls() {
  const data = await apiFetch('/admin/features');
  const existingNames = (data?.features || []).map((f: any) => f.name);
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
