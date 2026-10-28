import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, CheckCircle } from 'lucide-react';
import { realAuthAPI } from '@/services/authService';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured()) return;

    getSupabaseClient().auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (active) setHasSession(Boolean(data.session));
      })
      .catch(error => {
        console.error('Unable to verify password recovery session:', error);
        if (active) setHasSession(false);
      });

    return () => { active = false; };
  }, []);

  const handleReset = async () => {
    if (!newPassword.trim()) return toast.error('Enter a new password');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (!hasSession) return toast.error('Invalid or expired reset link');
    setLoading(true);
    try {
      await realAuthAPI.resetPassword('', newPassword);
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      <div className="flex items-center justify-between px-6 py-5">
        <span className="text-xl font-bold text-[#1a1f36] tracking-tight">
          BUZZER<span className="text-[#C9A96E]">•</span>
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

            {done ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 bg-green-500 rounded-2xl flex items-center justify-center">
                    <CheckCircle size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#1a1f36]">Password updated!</h1>
                    <p className="text-sm text-slate-500">You can now sign in with your new password</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <button
                    onClick={() => navigate('/auth?method=email')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#1a1f36] text-white rounded-xl font-semibold text-sm transition-all hover:bg-[#252d4a]"
                  >
                    Sign In <ArrowRight size={15} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 bg-[#1a1f36] rounded-2xl flex items-center justify-center">
                    <KeyRound size={20} className="text-[#C9A96E]" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#1a1f36]">Set new password</h1>
                    <p className="text-sm text-slate-500">Choose a strong password for your account</p>
                  </div>
                </div>

                {!hasSession && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600 font-medium">Verifying the password reset session. If the link is invalid or expired, request a new one.</p>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</label>
                    <div className="mt-1.5 relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        autoFocus
                        className="w-full px-3 py-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a1f36]"
                      />
                      <button type="button" onClick={() => setShowNew(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                    <div className="mt-1.5 relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleReset()}
                        placeholder="Repeat your new password"
                        className="w-full px-3 py-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a1f36]"
                      />
                      <button type="button" onClick={() => setShowConfirm(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
                    )}
                  </div>

                  <button
                    onClick={handleReset}
                    disabled={loading || !hasSession}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#1a1f36] text-white rounded-xl font-semibold text-sm transition-all hover:bg-[#252d4a] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={17} className="animate-spin" /> : <>Update Password <ArrowRight size={15} /></>}
                  </button>
                </div>
              </>
            )}

          </motion.div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Remembered your password?{' '}
            <button onClick={() => navigate('/auth?method=email')} className="text-[#1a1f36] font-semibold hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
