const API_BASE = '/api';

async function apiCall(path: string, method: string, body?: any) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const listingsAPI = {
  getAll: (): Promise<{ listings: any[] }> =>
    apiCall('/listings', 'GET'),

  getMine: (): Promise<{ listings: any[] }> =>
    apiCall('/listings/mine', 'GET'),

  create: (section: string, data: any): Promise<{ listing: any }> =>
    apiCall('/listings', 'POST', { section, data }),

  update: (id: string, data: any): Promise<{ listing: any }> =>
    apiCall(`/listings/${id}`, 'PUT', { data }),

  setStatus: (id: string, status: string): Promise<{ success: boolean }> =>
    apiCall(`/listings/${id}/status`, 'PATCH', { status }),

  setPromotion: (id: string, active: boolean): Promise<{ success: boolean; promotionEndAt: string | null }> =>
    apiCall(`/listings/${encodeURIComponent(id)}/promotion`, 'PATCH', { active }),

  remove: (id: string): Promise<{ success: boolean }> =>
    apiCall(`/listings/${id}`, 'DELETE'),
};
