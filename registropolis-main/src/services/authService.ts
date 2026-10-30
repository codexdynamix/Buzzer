import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import type { StaffRole } from '@/config/adminAccess';

const API_BASE = '/api';

export type AuthUser = {
  id: string;
  phoneNumber?: string;
  name: string;
  profileImageUrl?: string;
  email?: string;
  role?: string;
  staffRole?: StaffRole;
  staffTitle?: string;
  bio?: string;
  location?: string;
  contactPhone?: string;
  whatsapp?: boolean;
  viber?: boolean;
  telegram?: boolean;
  signal?: boolean;
  messenger?: boolean;
};

function mapAuthUser(user: SupabaseUser): AuthUser {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email,
    name: typeof metadata.name === 'string' && metadata.name.trim()
      ? metadata.name
      : user.email?.split('@')[0] ?? 'Buzzer user',
    role: 'user',
    profileImageUrl: typeof metadata.profileImageUrl === 'string' ? metadata.profileImageUrl : undefined,
  };
}

async function apiCall<T>(path: string, method: string, body?: unknown, token?: string): Promise<T> {
  const accessToken = token ?? localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`);
  if (!data) throw new Error('The server returned an invalid response');
  return data as T;
}

export const realAuthAPI = {
  async emailSignup(email: string, password: string, name: string) {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Supabase did not return a user after signup');
    return {
      token: data.session?.access_token ?? null,
      user: mapAuthUser(data.user),
      requiresEmailConfirmation: !data.session,
    };
  },

  async emailLogin(email: string, password: string) {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (!data.user || !data.session) throw new Error('Supabase did not return an authenticated session');
    return {
      token: data.session.access_token,
      user: mapAuthUser(data.user),
      requiresEmailConfirmation: false,
    };
  },

  async staffLogin(email: string, password: string) {
    const res = await apiCall<{ success: boolean; token: string; user: AuthUser }>(
      '/auth/staff-login',
      'POST',
      { email, password }
    );
    if (!res.token || !res.user) throw new Error('Invalid staff credentials');
    localStorage.setItem('auth_token', res.token);
    return res;
  },

  async getCurrentUser(accessToken?: string) {
    let token = accessToken ?? localStorage.getItem('auth_token');
    if (!token && isSupabaseConfigured()) {
      try {
        const session = (await getSupabaseClient().auth.getSession()).data.session;
        token = session?.access_token ?? null;
      } catch {
        // ignore
      }
    }
    if (!token) throw new Error('No active authentication session');
    return apiCall<{ success: boolean; user: AuthUser }>('/auth/me', 'GET', undefined, token);
  },

  async logout() {
    if (isSupabaseConfigured()) {
      try {
        await getSupabaseClient().auth.signOut();
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  async sendPasswordReset(email: string) {
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  },

  async resetPassword(_token: string, newPassword: string) {
    const client = getSupabaseClient();
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw error;
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) throw signOutError;
  },

  updateProfile: (updates: Record<string, unknown>) =>
    apiCall<{ success: boolean; user: AuthUser }>('/users/me', 'PATCH', updates),

  async changePassword(currentPassword: string, newPassword: string) {
    const client = getSupabaseClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user?.email) throw new Error('The current Supabase user has no email address');

    const { error: signInError } = await client.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) throw signInError;

    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
};

export { mapAuthUser };
