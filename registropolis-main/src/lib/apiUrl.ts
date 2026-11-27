const configuredApiOrigin = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export function apiUrl(path: string): string {
  return `${configuredApiOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getApiOrigin(): string {
  return configuredApiOrigin || window.location.origin;
}
