import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, Search,
  ShoppingBag, Home, Briefcase, Wrench, Car, Calendar, Users, Check,
  Sparkles, MapPin, Mail, KeyRound
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { realAuthAPI } from '@/services/authService';
import { SEED_USERS, SeedUser } from '@/data/seedAccounts';
import { toast } from 'sonner';

type EmailMode = 'login' | 'signup';

function finishSignIn(result: any, signIn: (u: any) => void, navigate: (p: string) => void) {
  localStorage.setItem('auth_token', result.token);
  localStorage.setItem('user', JSON.stringify(result.user));
  signIn(result.user);
  navigate('/dashboard');
}

const SECTIONS = [
  { id: 'all', label: 'All Users', count: 30, icon: Users, color: '#1a1f36' },
  { id: 'marketplace', label: 'Marketplace', count: 5, icon: ShoppingBag, color: '#D97706' },
  { id: 'real-estate', label: 'Real Estate', count: 5, icon: Home, color: '#2563EB' },
  { id: 'jobs', label: 'Jobs', count: 5, icon: Briefcase, color: '#7C3AED' },
  { id: 'services', label: 'Services', count: 5, icon: Wrench, color: '#059669' },
  { id: 'transport', label: 'Transport', count: 5, icon: Car, color: '#0284C7' },
  { id: 'events', label: 'Events', count: 5, icon: Calendar, color: '#E11D48' },
] as const;

const SECTION_BADGE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  'marketplace': { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  'real-estate': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  'jobs':        { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  'services':    { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  'transport':   { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' },
  'events':      { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
};

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a1f36] focus:border-transparent transition-all';
const btnPrimary = 'w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#1a1f36] text-white rounded-xl font-semibold text-sm transition-all hover:bg-[#252d4a] disabled:opacity-40 disabled:cursor-not-allowed';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [emailMode, setEmailMode] = useState<EmailMode>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailName, setEmailName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailStep, setEmailStep] = useState<'form' | 'forgot'>('form');

  // Account directory state
  const [selectedSection, setSelectedSection] = useState<string>('marketplace');
  const [accountSearch, setAccountSearch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingUserEmail, setLoadingUserEmail] = useState<string | null>(null);

  const switchAuthMode = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setEmailMode(mode === 'signup' ? 'signup' : 'login');
    setEmailStep('form');
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) return toast.error('Fill in all fields');
    if (emailMode === 'signup' && !emailName.trim()) return toast.error('Enter your name');
    setLoading(true);
    try {
      const result = emailMode === 'signup'
        ? await realAuthAPI.emailSignup(email, password, emailName)
        : await realAuthAPI.emailLogin(email, password);
      finishSignIn(result, signIn, navigate);
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally { setLoading(false); }
  };

  const handleQuickLogin = async (acc: SeedUser) => {
    setLoadingUserEmail(acc.email);
    setLoading(true);
    try {
      const result = await realAuthAPI.emailLogin(acc.email, 'buzzer123');
      toast.success(`Welcome back, ${acc.name}! Logged into ${acc.section}.`);
      finishSignIn(result, signIn, navigate);
    } catch (err: any) {
      toast.error(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
      setLoadingUserEmail(null);
    }
  };

  const handleFillCredentials = (acc: SeedUser) => {
    setEmail(acc.email);
    setPassword('buzzer123');
    setAuthMode('signin');
    setEmailMode('login');
    toast.info(`Filled credentials for ${acc.name}`);
  };

  const filteredAccounts = useMemo(() => {
    return SEED_USERS.filter((acc) => {
      const matchesSection = selectedSection === 'all' || acc.section === selectedSection;
      const q = accountSearch.toLowerCase().trim();
      const matchesQuery = !q ||
        acc.name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.specialty.toLowerCase().includes(q) ||
        acc.location.toLowerCase().includes(q);
      return matchesSection && matchesQuery;
    });
  }, [selectedSection, accountSearch]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xl font-bold tracking-tight" style={{ color: '#1a1f36', letterSpacing: '-0.04em' }}>
          BUZZER<span style={{ color: '#C9A96E' }}>•</span>
        </button>
        <button onClick={() => navigate('/')} className="text-sm font-medium transition-colors hover:text-slate-700" style={{ color: '#8a909d' }}>
          ← Back to home
        </button>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-4 max-w-6xl mx-auto w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ═════════════════════════════════════════════════════
              LEFT COLUMN: AUTH FORM (Sign In / Sign Up)
          ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 w-full">
            <AnimatePresence mode="wait">

              {/* Forgot password */}
              {emailStep === 'forgot' && (
                <motion.div key="forgot" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                    <div className="px-6 pt-6 pb-5 border-b border-slate-100">
                      <button onClick={() => setEmailStep('form')} className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors hover:text-[#1a1f36]" style={{ color: '#8a909d' }}>
                        <ArrowLeft size={14} /> Back to sign in
                      </button>
                      <h1 className="text-lg font-bold text-[#1a1f36]">Password reset unavailable</h1>
                      <p className="text-sm text-slate-500 mt-0.5">Password-reset email delivery is not configured. Use any pre-seeded user account on the right with password: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700 font-semibold">buzzer123</code></p>
                    </div>
                    <div className="px-6 py-5">
                      <button onClick={() => setEmailStep('form')} className={btnPrimary}>
                        Back to Sign In
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Standard Auth Form */}
              {emailStep === 'form' && (
                <motion.div key="main" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">

                    {/* Sign In / Sign Up toggle */}
                    <div className="flex border-b border-slate-100">
                      <button
                        onClick={() => switchAuthMode('signin')}
                        className="flex-1 py-4 text-sm font-semibold transition-all relative"
                        style={{ color: authMode === 'signin' ? '#1a1f36' : '#94a3b8' }}
                      >
                        Sign In
                        {authMode === 'signin' && (
                          <span className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full" style={{ backgroundColor: '#1a1f36' }} />
                        )}
                      </button>
                      <button
                        onClick={() => switchAuthMode('signup')}
                        className="flex-1 py-4 text-sm font-semibold transition-all relative"
                        style={{ color: authMode === 'signup' ? '#1a1f36' : '#94a3b8' }}
                      >
                        Create Account
                        {authMode === 'signup' && (
                          <span className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full" style={{ backgroundColor: '#1a1f36' }} />
                        )}
                      </button>
                    </div>

                    {/* Form fields */}
                    <div className="px-6 pt-5 pb-6 space-y-4">
                      {authMode === 'signup' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full name</label>
                          <input type="text" value={emailName} onChange={e => setEmailName(e.target.value)}
                            placeholder="Alex Morgan" autoFocus className={inputCls} />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="elena.vintage@buzzer.com" className={inputCls} />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                          {authMode === 'signin' && (
                            <button
                              type="button"
                              onClick={() => setEmailStep('forgot')}
                              className="text-xs font-medium text-slate-400 hover:text-[#1a1f36] transition-colors"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                            placeholder={authMode === 'signup' ? 'At least 6 characters' : '••••••••'}
                            className={inputCls + ' pr-11'}
                          />
                          <button type="button" onClick={() => setShowPassword(s => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <button onClick={handleEmailSubmit} disabled={loading} className={btnPrimary}>
                        {loading && !loadingUserEmail
                          ? <Loader2 size={16} className="animate-spin" />
                          : authMode === 'signin'
                            ? <>Sign In <ArrowRight size={14} /></>
                            : <>Create Account <ArrowRight size={14} /></>
                        }
                      </button>

                      <div className="pt-2 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                        <KeyRound size={12} className="text-slate-400" />
                        All pre-seeded user accounts use password: <span className="font-mono font-semibold text-slate-600">buzzer123</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-center text-sm text-slate-500">
                    {authMode === 'signin' ? (
                      <>Don't have an account?{' '}
                        <button onClick={() => switchAuthMode('signup')} className="font-semibold text-[#1a1f36] hover:underline">
                          Sign up free
                        </button>
                      </>
                    ) : (
                      <>Already have an account?{' '}
                        <button onClick={() => switchAuthMode('signin')} className="font-semibold text-[#1a1f36] hover:underline">
                          Sign in
                        </button>
                      </>
                    )}
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ═════════════════════════════════════════════════════
              RIGHT COLUMN: 30 SECTION REAL USER ACCOUNTS DIRECTORY
          ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 w-full space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-base font-bold text-[#1a1f36]">
                      Section User Accounts Directory
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real, active user accounts across all 6 sections (5 dedicated users per section)
                  </p>
                </div>

                <div className="relative sm:w-56">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                    placeholder="Search users, specialty..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1a1f36]"
                  />
                </div>
              </div>

              {/* Section Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar border-b border-slate-100">
                {SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = selectedSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setSelectedSection(sec.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-[#1a1f36] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                      }`}
                    >
                      <Icon size={13} style={{ color: isActive ? '#C9A96E' : undefined }} />
                      <span>{sec.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Accounts List */}
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1 mt-2">
                {filteredAccounts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    No user accounts match "{accountSearch}".
                  </div>
                ) : (
                  filteredAccounts.map((acc) => {
                    const badge = SECTION_BADGE_STYLE[acc.section] || { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
                    const isCurrentLoading = loading && loadingUserEmail === acc.email;

                    return (
                      <div key={acc.id} className="py-3 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl transition-colors">
                        
                        {/* User Details */}
                        <div className="flex items-start gap-3 min-w-0">
                          <img
                            src={acc.profileImageUrl}
                            alt={acc.name}
                            className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-slate-200/80 mt-0.5"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-900">
                                {acc.name}
                              </span>
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                                style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}
                              >
                                {acc.section}
                              </span>
                            </div>
                            
                            <p className="text-xs font-medium text-slate-700 truncate mt-0.5">
                              {acc.specialty}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                              <span className="flex items-center gap-1 text-slate-600 font-mono">
                                <Mail size={11} className="text-slate-400" />
                                {acc.email}
                              </span>
                              <span className="flex items-center gap-1 text-slate-400">
                                <MapPin size={11} />
                                {acc.location}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleFillCredentials(acc)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Fill credentials in sign-in form"
                          >
                            Fill Form
                          </button>

                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleQuickLogin(acc)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1a1f36] hover:bg-[#283152] rounded-lg transition-all shadow-sm disabled:opacity-50"
                          >
                            {isCurrentLoading ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <>
                                <span>Sign In</span>
                                <ArrowRight size={12} />
                              </>
                            )}
                          </button>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
