import { APP_FEATURES } from '@/config/features';

export interface AdminFeatureControl {
  featureId: string;
  enabled: boolean;
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
  if (typeof controls.enabled !== 'boolean') {
    throw new Error('A feature enabled state is required');
  }
  await apiFetch(`/admin/features/${featureId}`, 'POST', {
    enabled: controls.enabled,
    scope: 'global',
  });
}

export async function getFeatureControls(featureId: string): Promise<AdminFeatureControl | null> {
  const data = await apiFetch('/admin/features');
  if (!Array.isArray(data.features)) throw new Error('Feature settings response is invalid');
  const flag = data.features.find((f: any) => f.name === featureId);
  return { featureId, enabled: flag?.enabled ?? true };
}

export async function initializeFeatureControls() {
  const data = await apiFetch('/admin/features');
  if (!Array.isArray(data.features)) throw new Error('Feature settings response is invalid');
  const existingNames = new Set(data.features.map((feature: any) => feature.name));
  await Promise.all(Object.values(APP_FEATURES)
    .filter(feature => !existingNames.has(feature))
    .map(feature => apiFetch(`/admin/features/${feature}`, 'POST', {
        enabled: true,
        scope: 'global',
        targetUsers: [],
      })));
}
