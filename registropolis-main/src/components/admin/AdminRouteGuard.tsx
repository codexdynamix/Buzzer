import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    const handleStaffLogin = async (role: string = 'superadmin') => {
      try {
        const res = await fetch('/api/admin/auth/staff-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
      }
    };

    return (
      <div className="min-h-screen bg-[#0B1118] flex items-center justify-center px-4 py-12 text-[#FAFAF7]">
        <div className="max-w-lg w-full bg-[#121B24] border border-[#C9A96E]/30 rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/40 mx-auto flex items-center justify-center mb-5">
            <Shield className="w-8 h-8 text-[#C9A96E]" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">Buzzer Operations Portal & CRM</h2>
          <p className="text-xs text-slate-300 mb-6 leading-relaxed">
            Integrated back-office workspace combining <strong>OLX-style speed queue</strong>, <strong>Rieltor.ua accreditation desk</strong>, and <strong>Booking.com partner extranet</strong>. Select a staff role to enter immediately:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
            <button
              onClick={() => handleStaffLogin('superadmin')}
              className="p-3.5 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/30 hover:border-red-500/60 transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-1">Full Authority</div>
              <div className="text-sm font-bold text-white group-hover:text-red-300">Alex Vance</div>
              <div className="text-[11px] text-slate-400">Superadmin & Director</div>
            </button>

            <button
              onClick={() => handleStaffLogin('operations')}
              className="p-3.5 rounded-xl border border-[#C9A96E]/40 bg-[#C9A96E]/10 hover:bg-[#C9A96E]/20 hover:border-[#C9A96E]/70 transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-[#C9A96E] uppercase tracking-wider mb-1">Commercial / B2B</div>
              <div className="text-sm font-bold text-white group-hover:text-[#C9A96E]">Elena Rostova</div>
              <div className="text-[11px] text-slate-400">Booking Extranet & Ads CRM</div>
            </button>

            <button
              onClick={() => handleStaffLogin('moderator')}
              className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/30 hover:border-emerald-500/60 transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">OLX Triage Lead</div>
              <div className="text-sm font-bold text-white group-hover:text-emerald-300">David Chen</div>
              <div className="text-[11px] text-slate-400">Trust & Safety Moderator</div>
            </button>

            <button
              onClick={() => handleStaffLogin('support')}
              className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 hover:bg-blue-900/30 hover:border-blue-500/60 transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">Help Desk</div>
              <div className="text-sm font-bold text-white group-hover:text-blue-300">Sarah Miller</div>
              <div className="text-[11px] text-slate-400">Customer Support Agent</div>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Built-in Role Impersonation</span>
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
