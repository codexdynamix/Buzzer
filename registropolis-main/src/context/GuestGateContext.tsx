import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { X, LogIn, UserPlus } from 'lucide-react';

interface GuestGateContextType {
  showGuestModal: () => void;
  requireAuth: (callback?: () => void) => boolean;
}

const GuestGateContext = createContext<GuestGateContextType | undefined>(undefined);

const GuestGateModal = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #C9A96E, #a8834e)' }} />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="px-8 pt-8 pb-8 flex flex-col items-center text-center gap-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #C9A96E, #a8834e)' }}
          >
            <span className="text-[22px] font-black tracking-widest" style={{ color: '#0F1923' }}>BZ</span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-[19px] font-bold text-slate-900 leading-tight">
              Join Buzzer to continue
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Create a free account or sign in to publish listings, save items, message, and connect with the community.
            </p>
          </div>

          <div className="w-full flex flex-col gap-2.5">
            <button
              onClick={() => go('/auth?mode=signup')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #C9A96E, #a8834e)', color: '#0F1923' }}
            >
              <UserPlus size={15} />
              Sign Up Free
            </button>
            <button
              onClick={() => go('/auth')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all"
            >
              <LogIn size={15} />
              Sign In
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            You can browse freely — just register to interact.
          </p>
        </div>
      </div>
    </div>
  );
};

export const GuestGateProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const showGuestModal = useCallback(() => setOpen(true), []);

  const requireAuth = useCallback((callback?: () => void): boolean => {
    if (isAuthenticated) {
      callback?.();
      return true;
    }
    setOpen(true);
    return false;
  }, [isAuthenticated]);

  return (
    <GuestGateContext.Provider value={{ showGuestModal, requireAuth }}>
      {children}
      {open && <GuestGateModal onClose={() => setOpen(false)} />}
    </GuestGateContext.Provider>
  );
};

export const useGuestGate = () => {
  const ctx = useContext(GuestGateContext);
  if (!ctx) throw new Error('useGuestGate must be used within GuestGateProvider');
  return ctx;
};
