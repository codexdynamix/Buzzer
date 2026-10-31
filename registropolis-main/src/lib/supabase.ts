import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CREDENTIALS } from '@/config/supabaseCredentials';

let client: SupabaseClient | null = null;

export function getSupabaseUrl(): string {
  const raw = (SUPABASE_CREDENTIALS.url || import.meta.env.VITE_SUPABASE_URL || '').trim();
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

export function getSupabaseAnonKey(): string {
  return (SUPABASE_CREDENTIALS.anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the deployment environment.');
  }

  if (!client) {
    client = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  }

  return client;
}
