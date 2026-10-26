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

export const realAuthAPI = {
  emailSignup: (email: string, password: string, name: string) =>
    apiCall('/auth/email-signup', 'POST', { email, password, name }),

  emailLogin: (email: string, password: string) =>
    apiCall('/auth/email-login', 'POST', { email, password }),

  getCurrentUser: () =>
    apiCall('/auth/me', 'GET'),

  logout: () =>
    apiCall('/auth/logout', 'POST'),

  resetPassword: (token: string, newPassword: string) =>
    apiCall('/auth/reset-password', 'POST', { token, newPassword }),

  updateProfile: (updates: Record<string, any>) =>
    apiCall('/users/me', 'PATCH', updates),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiCall('/users/me/change-password', 'POST', { currentPassword, newPassword }),
};
