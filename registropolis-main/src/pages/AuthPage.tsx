import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Loader2, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { realAuthAPI } from '@/services/authService';
import { toast } from 'sonner';

type EmailMode = 'login' | 'signup';

function finishSignIn(result: any, signIn: (u: any) => void, navigate: (p: string) => void) {
  localStorage.setItem('auth_token', result.token);
  localStorage.setItem('user', JSON.stringify(result.user));
  signIn(result.user);
  navigate('/dashboard');
}

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

  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-5">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xl font-bold tracking-tight" style={{ color: '#1a1f36', letterSpacing: '-0.04em' }}>
          BUZZER<span style={{ color: '#C9A96E' }}>•</span>
        </button>
        <button onClick={() => navigate('/')} className="text-sm font-medium transition-colors hover:text-slate-700" style={{ color: '#8a909d' }}>
          ← Back to home
        </button>
      </div>

      {/* ── Centered card ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-[420px]">

          <AnimatePresence mode="wait">

            {/* ═══════════════════════════════════════════════════
                FORGOT PASSWORD — enter email
            ══════════════════════════════════════════════════ */}
            {emailStep === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  {/* Card header */}
                  <div className="px-6 pt-6 pb-5 border-b border-slate-100">
                    <button onClick={() => setEmailStep('form')} className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors hover:text-[#1a1f36]" style={{ color: '#8a909d' }}>
                      <ArrowLeft size={14} /> Back to sign in
                    </button>
                    <h1 className="text-lg font-bold text-[#1a1f36]">Password reset unavailable</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Password-reset email delivery is not configured. Contact support for help regaining access.</p>
                  </div>
                  <div className="px-6 py-5">
                    <button onClick={() => setEmailStep('form')} className={btnPrimary}>
                      Back to Sign In
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                MAIN AUTH CARD (sign in / sign up)
            ══════════════════════════════════════════════════ */}
            {emailStep === 'form' && (
              <motion.div key="main" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                  {/* ── Sign In / Sign Up toggle ── */}
                  <div className="flex" style={{ borderBottom: '1px solid #f1f5f9' }}>
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

                  {/* ── Form fields ── */}
                  <div className="px-6 pt-5 pb-6 space-y-4">
                    {authMode === 'signup' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full name</label>
                        <input type="text" value={emailName} onChange={e => setEmailName(e.target.value)}
                          placeholder="Jordan Smith" autoFocus className={inputCls} />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com" className={inputCls} />
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
                      {loading
                        ? <Loader2 size={16} className="animate-spin" />
                        : authMode === 'signin'
                          ? <>Sign In <ArrowRight size={14} /></>
                          : <>Create Account <ArrowRight size={14} /></>
                      }
                    </button>

                  </div>
                </div>

                {/* Below-card switch prompt */}
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

          <p className="mt-5 text-center text-xs text-slate-400">
            By continuing you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
