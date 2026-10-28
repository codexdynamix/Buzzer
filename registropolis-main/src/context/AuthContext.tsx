import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { toast } from 'sonner';
import { realAuthAPI } from '@/services/authService';
import { authAPI } from '@/services/apiService';
import { disconnectSocket } from '@/services/socketService';
import { isStaffRole } from '@/config/adminAccess';
import type { StaffRole } from '@/config/adminAccess';

type User = {
  id: string;
  phoneNumber?: string;
  name: string;
  profileImageUrl?: string;
  email?: string;
  role?: string;
  staffRole?: string;
  demoStaff?: boolean;
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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
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
  isStaff: false,
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
      disconnectSocket();
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

  const addAdmin = async (email: string, staffRole: StaffRole) => {
    await authAPI.addAdmin(email, staffRole);
    toast.success(`${email} was assigned ${staffRole} access`);
  };

  const isAdmin = useMemo(
    () => isStaffRole(user?.staffRole) || user?.role === 'moderator',
    [user]
  );
  const isStaff = useMemo(
    () => isAdmin,
    [isAdmin]
  );

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: !!user, isAdmin, isStaff, signIn, signOut, refreshUser, addAdmin, updateUser }),
    [user, isLoading, isAdmin, isStaff]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
