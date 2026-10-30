import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, Check,
  ShoppingBag, Home, Briefcase, Wrench, ShieldCheck, Sparkles, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { realAuthAPI } from '@/services/authService';
import { toast } from 'sonner';
import { useLocalization } from '@/i18n/LocalizationContext';

type EmailMode = 'login' | 'signup';

type AuthUser = {
  id: string;
  phoneNumber?: string;
  name: string;
  profileImageUrl?: string;
  email?: string;
  role?: string;
  staffRole?: 'superadmin' | 'operations' | 'moderator' | 'support';
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

type AuthResult = { token: string | null; user: AuthUser; requiresEmailConfirmation?: boolean };

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function finishSignIn(
  result: AuthResult,
  signIn: (user: AuthUser) => void,
  navigate: (path: string) => void,
  returnTo: string,
) {
  if (!result.token) throw new Error('Supabase did not return an active session');
  localStorage.setItem('auth_token', result.token);
  localStorage.setItem('user', JSON.stringify(result.user));
  signIn(result.user);
  navigate(returnTo);
}

const inputCls = 'w-full px-4 py-3 rounded-xl border border-[#E8E2D8] bg-white text-sm font-medium text-[#0F1923] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A3353] focus:border-transparent transition-all shadow-xs';
const btnPrimary = 'w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#1A3353] text-white rounded-xl font-semibold text-sm transition-all hover:bg-[#24436A] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const { t } = useLocalization();
  const requestedReturnTo = searchParams.get('redirect');
  const returnTo = requestedReturnTo?.startsWith('/') && !requestedReturnTo.startsWith('//')
    ? requestedReturnTo
    : '/dashboard';

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [emailMode, setEmailMode] = useState<EmailMode>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailName, setEmailName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [emailStep, setEmailStep] = useState<'form' | 'forgot'>('form');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const switchAuthMode = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setEmailMode(mode === 'signup' ? 'signup' : 'login');
    setEmailStep('form');
  };

  const handleEmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) return toast.error(t('Please fill in your email and password.'));
    if (emailMode === 'signup' && !emailName.trim()) return toast.error(t('Please enter your full name.'));
    if (emailMode === 'signup' && password.length < 8) return toast.error(t('Password must be at least 8 characters long.'));
    
    setLoading(true);
    try {
      const result = emailMode === 'signup'
        ? await realAuthAPI.emailSignup(email, password, emailName)
        : await realAuthAPI.emailLogin(email, password);

      if (result.requiresEmailConfirmation) {
        toast.success(t('Account created! Please check your email to confirm your account before signing in.'));
        return;
      }
      const { user: profile } = await realAuthAPI.getCurrentUser(result.token ?? undefined);
      finishSignIn({ ...result, user: profile }, signIn, navigate, returnTo);
      toast.success(authMode === 'signup' ? t('Welcome to Buzzer!') : t('Signed in successfully!'));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t('Authentication failed. Please check your credentials.')));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) return toast.error(t('Enter your email address first.'));
    setLoading(true);
    try {
      await realAuthAPI.sendPasswordReset(email);
      setResetEmailSent(true);
      toast.success(t('Password reset instructions sent. Please check your inbox.'));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t('Could not send the password reset email.')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7] text-[#0F1923] antialiased">
      {/* ── Top Navigation Bar ── */}
      <header className="w-full border-b border-[#E8E2D8] bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-[#0F1923]"
          >
            BUZZER<span className="text-[#C9A96E] text-2xl leading-none">•</span>
          </button>
          
          <div className="flex items-center gap-5 text-sm">
            <Link
              to="/admin/login"
              className="text-xs font-semibold uppercase tracking-wider text-[#6E7A8A] hover:text-[#1A3353] transition-colors"
            >
              Staff Portal
            </Link>
            <button
              onClick={() => navigate('/')}
              className="text-sm font-medium text-[#6E7A8A] hover:text-[#0F1923] transition-colors flex items-center gap-1"
            >
              ← <span className="hidden sm:inline">{t('Back to home')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ── Left Column: Platform Value & Trust (Desktop) ── */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E8E2D8] bg-[#F5F0E8] text-xs font-semibold text-[#1A3353] mb-4">
                <Sparkles size={13} className="text-[#C9A96E]" />
                One Account for Everything in Your City
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F1923] leading-tight">
                Connect, trade, and discover with verified local creators.
              </h1>
              <p className="mt-3 text-base text-[#6E7A8A] leading-relaxed">
                Join a decentralized community of artisans, professionals, brokers, and verified sellers across 6 thriving city verticals.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#E8E2D8] bg-white shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-[#F5F0E8] flex items-center justify-center text-[#1A3353] mb-2.5">
                  <ShoppingBag size={18} />
                </div>
                <h3 className="font-bold text-sm text-[#0F1923]">Marketplace</h3>
                <p className="text-xs text-[#6E7A8A] mt-0.5">Peer-to-peer authentic commerce without middleman markups.</p>
              </div>

              <div className="p-4 rounded-xl border border-[#E8E2D8] bg-white shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-[#F5F0E8] flex items-center justify-center text-[#1A3353] mb-2.5">
                  <Home size={18} />
                </div>
                <h3 className="font-bold text-sm text-[#0F1923]">Real Estate</h3>
                <p className="text-xs text-[#6E7A8A] mt-0.5">Architectural lofts, live-work studios & verified rentals.</p>
              </div>

              <div className="p-4 rounded-xl border border-[#E8E2D8] bg-white shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-[#F5F0E8] flex items-center justify-center text-[#1A3353] mb-2.5">
                  <Briefcase size={18} />
                </div>
                <h3 className="font-bold text-sm text-[#0F1923]">Careers & Talent</h3>
                <p className="text-xs text-[#6E7A8A] mt-0.5">Direct hiring at high-growth tech, design & energy firms.</p>
              </div>

              <div className="p-4 rounded-xl border border-[#E8E2D8] bg-white shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-[#F5F0E8] flex items-center justify-center text-[#1A3353] mb-2.5">
                  <MessageSquare size={18} />
                </div>
                <h3 className="font-bold text-sm text-[#0F1923]">Encrypted Chat</h3>
                <p className="text-xs text-[#6E7A8A] mt-0.5">Real-time messaging, instant offers, and direct negotiations.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 text-xs text-[#6E7A8A]">
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <ShieldCheck size={16} />
                <span>Supabase Protected & Verified</span>
              </div>
              <span>•</span>
              <span>No spam, private data never sold</span>
            </div>
          </div>

          {/* ── Right Column: Interactive Real Authentication Card ── */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E2D8] overflow-hidden">
              
              <AnimatePresence mode="wait">
                {/* ── Forgot Password View ── */}
                {emailStep === 'forgot' ? (
                  <motion.div
                    key="forgot-password"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 sm:p-8"
                  >
                    <button
                      type="button"
                      onClick={() => setEmailStep('form')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E7A8A] hover:text-[#1A3353] mb-5 transition-colors"
                    >
                      <ArrowLeft size={14} /> {t('Back to sign in')}
                    </button>

                    <h2 className="text-2xl font-bold tracking-tight text-[#0F1923]">
                      {t('Reset your password')}
                    </h2>
                    <p className="text-sm text-[#6E7A8A] mt-1.5 mb-6">
                      {resetEmailSent
                        ? t('If an account exists for this email, password reset instructions have been sent.')
                        : t('Enter the email associated with your account and we will send a secure reset link.')}
                    </p>

                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#6E7A8A] mb-1.5">
                          {t('Email address')}
                        </label>
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className={inputCls}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || resetEmailSent}
                        className={btnPrimary}
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : t('Send reset link')}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEmailStep('form')}
                        className="w-full text-center text-xs font-semibold text-[#6E7A8A] hover:text-[#0F1923] pt-2"
                      >
                        {t('Cancel and return')}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  /* ── Real Sign In / Sign Up View ── */
                  <motion.div
                    key="auth-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Mode Toggle Tabs */}
                    <div className="flex border-b border-[#E8E2D8] bg-[#FAFAF7]/50">
                      <button
                        type="button"
                        onClick={() => switchAuthMode('signin')}
                        className={`flex-1 py-4 text-sm font-bold text-center relative transition-colors ${
                          authMode === 'signin' ? 'text-[#1A3353]' : 'text-[#6E7A8A] hover:text-[#0F1923]'
                        }`}
                      >
                        {t('Sign In')}
                        {authMode === 'signin' && (
                          <motion.div
                            layoutId="activeTabIndicator"
                            className="absolute bottom-0 left-6 right-6 h-0.5 bg-[#1A3353]"
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => switchAuthMode('signup')}
                        className={`flex-1 py-4 text-sm font-bold text-center relative transition-colors ${
                          authMode === 'signup' ? 'text-[#1A3353]' : 'text-[#6E7A8A] hover:text-[#0F1923]'
                        }`}
                      >
                        {t('Create Account')}
                        {authMode === 'signup' && (
                          <motion.div
                            layoutId="activeTabIndicator"
                            className="absolute bottom-0 left-6 right-6 h-0.5 bg-[#1A3353]"
                          />
                        )}
                      </button>
                    </div>

                    {/* Form Container */}
                    <form onSubmit={handleEmailSubmit} className="p-6 sm:p-8 space-y-4">
                      {authMode === 'signup' && (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#6E7A8A] mb-1.5">
                            {t('Full Name')}
                          </label>
                          <input
                            type="text"
                            required
                            autoComplete="name"
                            value={emailName}
                            onChange={e => setEmailName(e.target.value)}
                            placeholder="e.g. Elena Torres"
                            className={inputCls}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#6E7A8A] mb-1.5">
                          {t('Email address')}
                        </label>
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#6E7A8A]">
                            {t('Password')}
                          </label>
                          {authMode === 'signin' && (
                            <button
                              type="button"
                              onClick={() => setEmailStep('forgot')}
                              className="text-xs font-medium text-[#C9A96E] hover:text-[#A6884E] transition-colors"
                            >
                              {t('Forgot password?')}
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder={authMode === 'signup' ? 'Minimum 8 characters' : '••••••••'}
                            className={`${inputCls} pr-11`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {authMode === 'signup' && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#6E7A8A]">
                            <Check size={12} className={password.length >= 8 ? 'text-emerald-500' : 'text-slate-300'} />
                            <span>8 or more characters</span>
                          </div>
                        )}
                      </div>

                      {authMode === 'signin' && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            id="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-[#E8E2D8] text-[#1A3353] focus:ring-[#1A3353]"
                          />
                          <label htmlFor="remember-me" className="text-xs text-[#6E7A8A] select-none cursor-pointer">
                            Keep me signed in on this device
                          </label>
                        </div>
                      )}

                      {authMode === 'signup' && (
                        <p className="text-[11px] text-[#6E7A8A] leading-relaxed pt-1">
                          By creating an account, you agree to Buzzer's{' '}
                          <span className="font-semibold text-[#0F1923]">Terms of Service</span> and{' '}
                          <span className="font-semibold text-[#0F1923]">Privacy Policy</span>.
                        </p>
                      )}

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className={btnPrimary}
                        >
                          {loading ? (
                            <Loader2 size={17} className="animate-spin" />
                          ) : authMode === 'signin' ? (
                            <>
                              <span>{t('Sign in to Buzzer')}</span>
                              <ArrowRight size={15} />
                            </>
                          ) : (
                            <>
                              <span>{t('Create Your Account')}</span>
                              <ArrowRight size={15} />
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                    {/* Footer switch prompt */}
                    <div className="px-6 py-4 border-t border-[#E8E2D8] bg-[#FAFAF7]/50 text-center text-xs text-[#6E7A8A]">
                      {authMode === 'signin' ? (
                        <>
                          New to Buzzer?{' '}
                          <button
                            type="button"
                            onClick={() => switchAuthMode('signup')}
                            className="font-bold text-[#1A3353] hover:underline"
                          >
                            Create an account free
                          </button>
                        </>
                      ) : (
                        <>
                          Already have an account?{' '}
                          <button
                            type="button"
                            onClick={() => switchAuthMode('signin')}
                            className="font-bold text-[#1A3353] hover:underline"
                          >
                            Sign in here
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </main>

      {/* ── Subdued Footer ── */}
      <footer className="border-t border-[#E8E2D8] py-6 text-center text-xs text-[#6E7A8A] max-w-6xl mx-auto w-full px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} Buzzer Technologies. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link to="/admin/login" className="hover:text-[#1A3353] transition-colors">
            Staff Sign In
          </Link>
          <span>•</span>
          <button onClick={() => navigate('/')} className="hover:text-[#1A3353] transition-colors">
            Browse Listings
          </button>
        </div>
      </footer>
    </div>
  );
}
