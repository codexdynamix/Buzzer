import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { toast } from 'sonner';
import { realAuthAPI } from '@/services/authService';
import { authAPI } from '@/services/apiService';

type User = {
  id: string;
  phoneNumber?: string;
  name: string;
  profileImageUrl?: string;
  email?: string;
  role?: string;
  bio?: string;
  location?: string;
  contactPhone?: string;
  whatsapp?: boolean;
  viber?: boolean;
  telegram?: boolean;
  signal?: boolean;
  messenger?: boolean;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (user: User) => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
  addAdmin: (email: string) => Promise<void>;
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
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          try {
            const response = await realAuthAPI.getCurrentUser();
            if (response?.user) {
              setUser(response.user);
            } else {
              localStorage.removeItem('user');
              localStorage.removeItem('auth_token');
            }
          } catch {
            localStorage.removeItem('user');
            localStorage.removeItem('auth_token');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
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
      if (user) await realAuthAPI.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('mock_user');
      setUser(null);
      toast.success('Signed out successfully');
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

  const addAdmin = async (email: string) => {
    try {
      await authAPI.addAdmin(email);
      toast.success(`${email} is now an admin`);
    } catch (error) {
      toast.error('Failed to add admin: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
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
