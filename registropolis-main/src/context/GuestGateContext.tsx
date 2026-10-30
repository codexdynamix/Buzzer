import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { realAuthAPI } from '@/services/authService';
import { X, LogIn, UserPlus, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface GuestGateContextType {
  showGuestModal: () => void;
  requireAuth: (callback?: () => void) => boolean;
}

const GuestGateContext = createContext<GuestGateContextType | undefined>(undefined);

interface GuestGateModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const GuestGateModal = ({ onClose, onSuccess }: GuestGateModalProps) => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const result = mode === 'signup'
        ? await realAuthAPI.emailSignup(email, password, name)
        : await realAuthAPI.emailLogin(email, password);

      if (result.requiresEmailConfirmation) {
        toast.success('Account created! Please check your email to confirm your account.');
        onClose();
        return;
      }

      if (!result.token) {
        throw new Error('Authentication session token missing');
      }

      const { user: profile } = await realAuthAPI.getCurrentUser(result.token);
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user', JSON.stringify(profile));
      signIn(profile);

      toast.success(mode === 'signup' ? 'Welcome to Buzzer!' : 'Signed in successfully!');
      onClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs antialiased"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#E8E2D8]"
        onClick={e => e.stopPropagation()}
      >
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-[#1A3353]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E8E2D8]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-extrabold tracking-tight text-[#1A3353]">BUZZER<span className="text-[#C9A96E]">•</span></span>
            <span className="text-xs text-[#6E7A8A]">City Platform</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#0F1923]">
            {mode === 'signin' ? 'Sign in to continue' : 'Create your free account'}
          </h2>
          <p className="text-xs text-[#6E7A8A] mt-1">
            {mode === 'signin'
              ? 'Enter your credentials to save items, message sellers, and participate.'
              : 'Join Buzzer to save listings, post inquiries, and message certified sellers.'}
          </p>

          {/* Tab Switcher */}
          <div className="flex gap-2 mt-4 p-1 bg-[#FAFAF7] rounded-xl border border-[#E8E2D8]">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#1A3353] shadow-xs'
                  : 'text-[#6E7A8A] hover:text-[#0F1923]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#1A3353] shadow-xs'
                  : 'text-[#6E7A8A] hover:text-[#0F1923]'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E7A8A] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Elena Torres"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] bg-white text-sm font-medium text-[#0F1923] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A3353]"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E7A8A] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] bg-white text-sm font-medium text-[#0F1923] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A3353]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E7A8A] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min 8 characters' : '••••••••'}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#E8E2D8] bg-white text-sm font-medium text-[#0F1923] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A3353]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl text-sm font-semibold text-white bg-[#1A3353] hover:bg-[#24436A] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : mode === 'signin' ? (
              <>
                <LogIn size={15} />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus size={15} />
                <span>Create Free Account</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/auth?mode=${mode}`);
              }}
              className="text-xs text-[#6E7A8A] hover:text-[#1A3353] font-medium transition-colors"
            >
              Open full sign-in page &rarr;
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const GuestGateProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [callback, setCallback] = useState<(() => void) | null>(null);
  const { isAuthenticated } = useAuth();

  const showGuestModal = useCallback(() => {
    setCallback(null);
    setOpen(true);
  }, []);

  const requireAuth = useCallback((cb?: () => void): boolean => {
    if (isAuthenticated) {
      cb?.();
      return true;
    }
    setCallback(() => cb);
    setOpen(true);
    return false;
  }, [isAuthenticated]);

  const handleSuccess = useCallback(() => {
    if (callback) {
      callback();
      setCallback(null);
    }
  }, [callback]);

  return (
    <GuestGateContext.Provider value={{ showGuestModal, requireAuth }}>
      {children}
      {open && (
        <GuestGateModal
          onClose={() => setOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </GuestGateContext.Provider>
  );
};

export const useGuestGate = () => {
  const ctx = useContext(GuestGateContext);
  if (!ctx) throw new Error('useGuestGate must be used within GuestGateProvider');
  return ctx;
};
