import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isStaff, isLoading } = useAuth();
  const [loginError, setLoginError] = useState('');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated || !isStaff) {
    const handleStaffLogin = async (role: string) => {
      try {
        setLoginError('');
        const res = await fetch('/api/admin/auth/staff-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        });
        const data = await res.json();
        if (!res.ok || !data.token) throw new Error(data.message || 'Could not start the demo staff session');
        localStorage.setItem('auth_token', data.token);
        window.location.reload();
      } catch (error) {
        setLoginError(error instanceof Error ? error.message : 'Could not start the demo staff session');
      }
    };

    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-4 py-12 text-[#0F1923]">
        <div className="admin-entry-card max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1A3353] border border-[#C9A96E]/50 mx-auto flex items-center justify-center mb-5">
            <Shield className="w-8 h-8 text-[#C9A96E]" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#0F1923] mb-2">Buzzer Operations Portal & CRM</h2>
          <p className="text-xs text-[#526070] mb-6 leading-relaxed">
            Staff access to Buzzer operations, customer support, trust and safety, and business CRM.
          </p>

          {import.meta.env.DEV ? (
            <>
              <div className="mb-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6E7A8A]">Development demo roles</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
            <button
              onClick={() => handleStaffLogin('superadmin')}
              className="p-3.5 rounded-xl border border-[#E8E2D8] bg-white hover:bg-[#F5F0E8] hover:border-red-300 transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-1">Full Authority</div>
              <div className="text-sm font-bold text-[#0F1923] group-hover:text-red-700">Alex Vance</div>
              <div className="text-[11px] text-[#6E7A8A]">Superadmin & Director</div>
            </button>

            <button
              onClick={() => handleStaffLogin('operations')}
              className="p-3.5 rounded-xl border border-[#C9A96E]/50 bg-[#F5F0E8] hover:bg-[#C9A96E]/20 hover:border-[#C9A96E]/70 transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-[#C9A96E] uppercase tracking-wider mb-1">Commercial / B2B</div>
              <div className="text-sm font-bold text-[#0F1923] group-hover:text-[#8A6A32]">Elena Rostova</div>
              <div className="text-[11px] text-[#6E7A8A]">Booking Extranet & Ads CRM</div>
            </button>

            <button
              onClick={() => handleStaffLogin('moderator')}
              className="p-3.5 rounded-xl border border-[#E8E2D8] bg-white hover:bg-[#F5F0E8] hover:border-emerald-300 transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">OLX Triage Lead</div>
              <div className="text-sm font-bold text-[#0F1923] group-hover:text-emerald-700">David Chen</div>
              <div className="text-[11px] text-[#6E7A8A]">Trust & Safety Moderator</div>
            </button>

            <button
              onClick={() => handleStaffLogin('support')}
              className="p-3.5 rounded-xl border border-[#E8E2D8] bg-white hover:bg-[#F5F0E8] hover:border-blue-300 transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">Help Desk</div>
              <div className="text-sm font-bold text-[#0F1923] group-hover:text-blue-700">Sarah Miller</div>
              <div className="text-[11px] text-[#6E7A8A]">Customer Support Agent</div>
            </button>
              </div>
            </>
          ) : (
            <div className="mb-6 rounded-xl border border-[#E8E2D8] bg-white p-4 text-left">
              <div className="font-semibold text-[#0F1923]">Staff sign-in required</div>
              <p className="mt-1 text-xs text-[#6E7A8A]">Sign in with an assigned staff account to access the back office.</p>
              <Link to="/auth" className="mt-3 inline-flex rounded-lg bg-[#1A3353] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162C48]">
                Go to sign in
              </Link>
            </div>
          )}

          {loginError && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-left text-xs text-red-700">
              <AlertCircle size={16} />
              {loginError}
            </div>
          )}

          <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between text-xs text-[#6E7A8A]">
            <span>{import.meta.env.DEV ? 'Development-only demo access' : 'Restricted staff workspace'}</span>
            <a href="/dashboard" className="text-[#C9A96E] hover:underline font-semibold">
              Return to Marketplace &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
