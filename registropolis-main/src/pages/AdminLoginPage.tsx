import React, { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { realAuthAPI } from '@/services/authService';
import { isStaffRole } from '@/config/adminAccess';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const requestedReturnTo = searchParams.get('redirect');
  const returnTo = requestedReturnTo?.startsWith('/admin/') || requestedReturnTo?.startsWith('/admin?')
    ? requestedReturnTo
    : '/admin?tab=overview';

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoaderCircle className="h-7 w-7 animate-spin text-[#1A3353]" aria-label="Loading staff account" />
      </main>
    );
  }

  if (isAuthenticated && user?.role === 'admin' && isStaffRole(user.staffRole)) {
    return <Navigate to={returnTo} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await realAuthAPI.emailLogin(email, password);
      const { user: profile } = await realAuthAPI.getCurrentUser(result.token);
      if (profile.role !== 'admin' || !isStaffRole(profile.staffRole)) {
        await realAuthAPI.logout();
        toast.error('This account does not have an assigned staff role. Contact your administrator.');
        return;
      }

      signIn(profile);
      navigate(returnTo, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Staff sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      toast.error('Enter your staff email address first.');
      return;
    }

    setSendingReset(true);
    try {
      await realAuthAPI.sendPasswordReset(email);
      toast.success('If this email belongs to a staff account, a reset link will be sent.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send the password reset email.');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(440px,560px)]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#10243B] p-12 text-white lg:flex xl:p-16">
        <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-36 h-[34rem] w-[34rem] rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-[24rem] w-[24rem] rounded-full border border-[#C9A96E]/20" />
        <Link to="/" className="relative inline-flex w-fit items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C9A96E] text-lg font-black text-[#10243B]">B</span>
          <span className="text-sm font-bold tracking-[0.18em]">BUZZER</span>
        </Link>

        <div className="relative max-w-xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#D9BD88]">Staff workspace</p>
          <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            A clear view of the work that keeps Buzzer moving.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Review accounts, listings, verification requests, and support cases from one secure operations workspace.
          </p>
          <div className="mt-9 flex items-center gap-3 text-sm text-slate-300">
            <ShieldCheck size={18} className="text-[#D9BD88]" aria-hidden="true" />
            Staff access is checked against your account permissions.
          </div>
        </div>

        <p className="relative text-xs text-slate-400">Authorized staff only · Buzzer CRM</p>
      </section>

      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#1A3353] lg:hidden">
            <ArrowLeft size={16} aria-hidden="true" />
            Buzzer
          </Link>
          <Link to="/auth" className="text-sm font-medium text-slate-500 hover:text-[#1A3353]">
            Client sign in
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#1A3353] shadow-sm">
              <LockKeyhole size={22} aria-hidden="true" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A6D3B]">Buzzer staff</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to your workspace</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use your assigned staff email and password to continue.
            </p>
          </div>

          {isAuthenticated ? (
            <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div role="status" className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                This signed-in account does not have CRM access{user?.email ? ` (${user.email})` : ''}. Sign out to use a staff account or contact your administrator.
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A3353] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#24436A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A3353]"
              >
                Sign out and continue
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <label className="block space-y-2 text-sm font-medium">
                <span>Staff email</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1A3353] focus:ring-4 focus:ring-[#1A3353]/10"
                />
              </label>

              <label className="block space-y-2 text-sm font-medium">
                <span>Password</span>
                <span className="relative block">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 pr-12 text-sm outline-none transition focus:border-[#1A3353] focus:ring-4 focus:ring-[#1A3353]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(value => !value)}
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                    aria-pressed={passwordVisible}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-[#1A3353] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#1A3353]"
                  >
                    {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A3353] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#24436A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A3353] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : null}
                {submitting ? 'Signing in…' : 'Sign in'}
                {!submitting ? <ArrowRight size={16} aria-hidden="true" /> : null}
              </button>

              <div className="border-t border-slate-100 pt-4 text-center">
                <button
                  type="button"
                  onClick={() => void handlePasswordReset()}
                  disabled={sendingReset}
                  className="text-sm font-medium text-[#1A3353] underline-offset-4 hover:underline disabled:opacity-60"
                >
                  {sendingReset ? 'Sending reset link…' : 'Forgot your password?'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            Need staff access? Contact your workspace administrator. Client accounts cannot sign in to the CRM.
          </p>
        </div>

        <p className="text-center text-xs text-slate-400">© {new Date().getFullYear()} Buzzer · Secure staff access</p>
      </section>
    </main>
  );
};

export default AdminLoginPage;
