import React, { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { realAuthAPI } from '@/services/authService';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const requestedReturnTo = searchParams.get('redirect');
  const returnTo = requestedReturnTo?.startsWith('/admin') && !requestedReturnTo.startsWith('//')
    ? requestedReturnTo
    : '/admin?tab=overview';

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F0E8]">
        <LoaderCircle className="h-7 w-7 animate-spin text-[#1A3353]" aria-label="Loading staff account" />
      </main>
    );
  }

  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin?tab=overview" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Enter your staff email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await realAuthAPI.emailLogin(email, password);
      const { user: profile } = await realAuthAPI.getCurrentUser(result.token);
      if (profile.role !== 'admin') {
        await realAuthAPI.logout();
        toast.error('This is a client account. Use a staff account to access the CRM.');
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F0E8] px-4 py-12 text-[#0F1923]">
      <section className="w-full max-w-md rounded-2xl border border-[#E8E2D8] bg-white p-8 shadow-sm">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A3353] text-[#C9A96E]">
            <ShieldCheck size={25} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A6D3B]">Buzzer staff</p>
            <h1 className="text-2xl font-bold tracking-tight">CRM sign in</h1>
          </div>
        </div>

        {isAuthenticated ? (
          <div role="status" className="space-y-4">
            <p className="rounded-xl border border-[#E8E2D8] bg-[#FAFAF7] p-4 text-sm text-[#526070]">
              You’re signed in as a client{user?.email ? ` (${user.email})` : ''}. Sign out before using a staff account.
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full rounded-xl bg-[#1A3353] px-4 py-3 text-sm font-semibold text-white hover:bg-[#24436A]"
            >
              Sign out and continue
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm leading-relaxed text-[#6E7A8A]">
              This staff-only sign-in is separate from client accounts. Staff access is verified before the CRM opens.
            </p>
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Staff email</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[#D8D2C8] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#1A3353] focus:ring-2 focus:ring-[#1A3353]/15"
              />
            </label>
            <label className="block space-y-1.5 text-sm font-semibold">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[#D8D2C8] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#1A3353] focus:ring-2 focus:ring-[#1A3353]/15"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A3353] px-4 py-3 text-sm font-semibold text-white hover:bg-[#24436A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}
              Sign in to CRM
            </button>
          </form>
        )}

        <p className="mt-6 border-t border-[#E8E2D8] pt-5 text-center text-sm text-[#6E7A8A]">
          Looking for the client app?{' '}
          <Link to="/auth" className="font-semibold text-[#1A3353] underline-offset-4 hover:underline">
            Client sign in
          </Link>
        </p>
      </section>
    </main>
  );
};

export default AdminLoginPage;
