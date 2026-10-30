import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { toast } from 'sonner';
import { realAuthAPI } from '@/services/authService';
import { authAPI } from '@/services/apiService';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import type { StaffRole } from '@/config/adminAccess';

type User = {
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
  storeName?: string;
  storeSlug?: string;
  storeTagline?: string;
  storeDescription?: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  storeWebsite?: string;
  storeContactPhone?: string;
  storeEmail?: string;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (user: User) => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
  addAdmin: (email: string, staffRole: StaffRole) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  signIn: () => {},
  signOut: () => {},
  refreshUser: async () => {},
  addAdmin: async () => {},
  updateUser: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setIsLoading(false);
      return;
    }

    let active = true;
    const client = getSupabaseClient();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setUser(null);
        setIsLoading(false);
        return;
      }

      localStorage.setItem('auth_token', session.access_token);
      const sessionUser = {
        id: session.user.id,
        email: session.user.email,
        name: typeof session.user.user_metadata.name === 'string'
          ? session.user.user_metadata.name
          : session.user.email?.split('@')[0] ?? 'Buzzer user',
        role: 'user',
      };
      setUser(sessionUser);
      setIsLoading(true);

      void realAuthAPI.getCurrentUser(session.access_token)
        .then(response => {
          if (!active || !response.user) return;
          setUser(response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
        })
        .catch(error => {
          console.error('Unable to load the Supabase user profile:', error);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    toast.success(`Welcome, ${userData.name}!`);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const signOut = async () => {
    try {
      await realAuthAPI.logout();
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('mock_user');
      setUser(null);
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sign out');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await realAuthAPI.getCurrentUser();
      if (response?.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    } catch {
      // ignore
    }
  };

  const addAdmin = async (email: string, staffRole: StaffRole) => {
    await authAPI.addAdmin(email, staffRole);
    toast.success(`${email} is now an admin`);
  };

  const isAdmin = useMemo(
    () => user?.role === 'admin',
    [user]
  );

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: !!user, isAdmin, signIn, signOut, refreshUser, addAdmin, updateUser }),
    [user, isLoading, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
