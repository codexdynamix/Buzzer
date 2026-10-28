import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminMessages from '@/components/admin/AdminMessages';
import AdminGroups from '@/components/admin/AdminGroups';
import AdminFeatures from '@/components/admin/AdminFeatures';
import AdminUserActivity from '@/components/admin/AdminUserActivity';
import AdminRestrictions from '@/components/admin/AdminRestrictions';
import AdminServices from '@/components/admin/AdminServices';
import AdminSupport from '@/components/admin/AdminSupport';
import { AdminModerationQueue } from '@/components/admin/AdminModerationQueue';
import { AdminVerificationDesk } from '@/components/admin/AdminVerificationDesk';
import { AdminMerchantPortal } from '@/components/admin/AdminMerchantPortal';
import { 
  Shield, 
  Zap, 
  Award, 
  Users, 
  Megaphone, 
  HelpCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  Activity, 
  Sliders, 
  CheckCircle,
  Search,
  Sparkles,
  BarChart3,
  Server
} from 'lucide-react';
import { toast } from 'sonner';

export type StaffRole = 'superadmin' | 'operations' | 'moderator' | 'support';

const STAFF_PROFILES: Record<StaffRole, { name: string; title: string; badge: string; color: string }> = {
  superadmin: {
    name: 'Alex Vance',
    title: 'Platform Director & Superadmin',
    badge: 'Super Admin',
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  operations: {
    name: 'Elena Rostova',
    title: 'Commercial Operations & Partner CRM',
    badge: 'Ops Manager',
    color: 'bg-[#C9A96E]/20 text-[#C9A96E] border-[#C9A96E]/40',
  },
  moderator: {
    name: 'David Chen',
    title: 'Trust & Safety Lead Moderator',
    badge: 'Content Moderator',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  support: {
    name: 'Sarah Miller',
    title: 'Customer Experience & Help Desk',
    badge: 'Support Agent',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
};

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as any;
  const validTabs = ['moderation', 'verification', 'merchants', 'users', 'support', 'restrictions', 'features', 'analytics'];
  const [activeTab, setActiveTab] = useState<'moderation' | 'verification' | 'merchants' | 'users' | 'support' | 'restrictions' | 'features' | 'analytics'>(
    validTabs.includes(requestedTab) ? requestedTab : 'moderation'
  );
  const [staffRole, setStaffRole] = useState<StaffRole>('superadmin');
  const [piiMasked, setPiiMasked] = useState(true);
  const [kpis, setKpis] = useState({
    totalUsers: 31,
    activeListings: 30,
    pendingModeration: 4,
    pendingVerifications: 3,
    openTickets: 2,
    sponsoredBusinesses: 3,
  });

  useEffect(() => {
    fetch('/api/admin/crm/overview', {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.kpis) {
          setKpis(data.kpis);
        }
      })
      .catch(() => {});
  }, [activeTab]);

  const selectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const switchStaffPersona = async (role: StaffRole) => {
    setStaffRole(role);
    try {
      const res = await fetch('/api/admin/auth/staff-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
    } catch (e) {
      console.error(e);
    }
    toast.info(`Active staff persona: ${STAFF_PROFILES[role].name} (${STAFF_PROFILES[role].badge})`);
    
    // Auto-route to role's primary workspace
    if (role === 'moderator') selectTab('moderation');
    else if (role === 'operations') selectTab('merchants');
    else if (role === 'support') selectTab('support');
  };

  const currentProfile = STAFF_PROFILES[staffRole];

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-[#0B1118] text-[#FAFAF7]">
        {/* Top Operational Navigation Bar */}
        <header className="sticky top-0 z-40 bg-[#0F1923]/90 border-b border-[#E8E2D8]/15 backdrop-blur-xl px-4 lg:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Platform Branding & Live Telemetry */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A3353] to-[#0F1923] border border-[#C9A96E]/50 flex items-center justify-center text-[#C9A96E] font-black tracking-tight shadow">
                BZ
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base tracking-tight text-white">BUZZER OPS & CRM</h1>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE WORKSPACE
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Engine: Multi-Vertical In-Memory Store</span>
                  <span>•</span>
                  <span>Uptime: 99.98%</span>
                </div>
              </div>
            </div>

            {/* Controls: Persona Switcher & PII Masking */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* PII Masking Toggle */}
              <button
                onClick={() => {
                  setPiiMasked(!piiMasked);
                  toast(piiMasked ? 'PII Unmasked for Audit Review' : 'PII Masking Active (GDPR Enforced)');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#162C48]/60 hover:bg-[#162C48] text-xs font-semibold border border-slate-700 transition-all cursor-pointer text-slate-300"
                title="Simulates GDPR compliance by masking phone numbers and emails"
              >
                {piiMasked ? <EyeOff size={13} className="text-amber-400" /> : <Eye size={13} className="text-emerald-400" />}
                <span>PII {piiMasked ? 'Masked' : 'Revealed'}</span>
              </button>

              {/* Staff Role Switcher */}
              <div className="flex items-center gap-1.5 bg-[#162C48]/60 border border-slate-700 rounded-xl p-1">
                <span className="text-[11px] text-slate-400 pl-2 pr-1 font-medium hidden sm:inline">Role:</span>
                {(['superadmin', 'operations', 'moderator', 'support'] as StaffRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => switchStaffPersona(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      staffRole === r
                        ? 'bg-[#C9A96E] text-[#0F1923] font-bold shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {r === 'superadmin' ? 'Superadmin' : r === 'operations' ? 'Ops/B2B' : r === 'moderator' ? 'Moderator' : 'Support'}
                  </button>
                ))}
              </div>

              {/* Active User Chip */}
              <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-700">
                <div className="text-right">
                  <div className="text-xs font-bold text-white">{currentProfile.name}</div>
                  <div className="text-[10px] text-slate-400">{currentProfile.title}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#1A3353] border border-[#C9A96E]/40 flex items-center justify-center text-xs font-bold text-[#C9A96E]">
                  {currentProfile.name[0]}
                </div>
              </div>

              {/* Exit to Marketplace Link */}
              <a
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C9A96E]/15 hover:bg-[#C9A96E]/25 border border-[#C9A96E]/40 text-xs font-bold text-[#C9A96E] transition-all cursor-pointer ml-1"
                title="Return to consumer marketplace view"
              >
                <span>Marketplace</span>
                <span>&rarr;</span>
              </a>
            </div>
          </div>
        </header>

        {/* Live KPI Ticker */}
        <section className="bg-[#121B24] border-b border-slate-800/80 px-4 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div className="bg-[#162C48]/30 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Members</span>
              <strong className="text-base font-bold text-white">{kpis.totalUsers} accounts</strong>
            </div>
            <div className="bg-[#162C48]/30 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Catalog Listings</span>
              <strong className="text-base font-bold text-white">{kpis.activeListings} live</strong>
            </div>
            <div className={`p-2.5 rounded-xl border ${kpis.pendingModeration > 0 ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-[#162C48]/30 border-slate-800'}`}>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">OLX Review Queue</span>
              <strong className="text-base font-bold text-amber-400">{kpis.pendingModeration} items</strong>
            </div>
            <div className={`p-2.5 rounded-xl border ${kpis.pendingVerifications > 0 ? 'bg-[#C9A96E]/10 border-[#C9A96E]/30 text-yellow-200' : 'bg-[#162C48]/30 border-slate-800'}`}>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Rieltor Desks</span>
              <strong className="text-base font-bold text-[#C9A96E]">{kpis.pendingVerifications} audits</strong>
            </div>
            <div className="bg-[#162C48]/30 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Open Support SLAs</span>
              <strong className="text-base font-bold text-blue-400">{kpis.openTickets} tickets</strong>
            </div>
            <div className="bg-[#162C48]/30 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">B2B Advertisers</span>
              <strong className="text-base font-bold text-emerald-400">{kpis.sponsoredBusinesses} promoted</strong>
            </div>
          </div>
        </section>

        {/* Workspace Hub Container */}
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-6">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
            <button
              onClick={() => selectTab('moderation')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'moderation'
                  ? 'bg-gradient-to-r from-[#1A3353] to-[#162C48] text-[#C9A96E] border border-[#C9A96E]/50 shadow'
                  : 'text-slate-300 hover:text-white bg-[#162C48]/20 border border-transparent'
              }`}
            >
              <Zap size={15} className="text-amber-400" />
              <span>Speed Moderation Queue</span>
              {kpis.pendingModeration > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-black rounded-full text-[10px] font-black">
                  {kpis.pendingModeration}
                </span>
              )}
            </button>

            <button
              onClick={() => selectTab('verification')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'verification'
                  ? 'bg-gradient-to-r from-[#1A3353] to-[#162C48] text-[#C9A96E] border border-[#C9A96E]/50 shadow'
                  : 'text-slate-300 hover:text-white bg-[#162C48]/20 border border-transparent'
              }`}
            >
              <Award size={15} className="text-[#C9A96E]" />
              <span>Trust & Accreditation Desk</span>
              {kpis.pendingVerifications > 0 && (
                <span className="px-1.5 py-0.2 bg-[#C9A96E] text-black rounded-full text-[10px] font-black">
                  {kpis.pendingVerifications}
                </span>
              )}
            </button>

            <button
              onClick={() => selectTab('merchants')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'merchants'
                  ? 'bg-gradient-to-r from-[#1A3353] to-[#162C48] text-[#C9A96E] border border-[#C9A96E]/50 shadow'
                  : 'text-slate-300 hover:text-white bg-[#162C48]/20 border border-transparent'
              }`}
            >
              <Megaphone size={15} className="text-emerald-400" />
              <span>Booking Extranet & Ads CRM</span>
            </button>

            <button
              onClick={() => selectTab('users')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-[#1A3353] to-[#162C48] text-[#C9A96E] border border-[#C9A96E]/50 shadow'
                  : 'text-slate-300 hover:text-white bg-[#162C48]/20 border border-transparent'
              }`}
            >
              <Users size={15} className="text-blue-400" />
              <span>Customer 360 CRM</span>
            </button>

            <button
              onClick={() => selectTab('support')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-gradient-to-r from-[#1A3353] to-[#162C48] text-[#C9A96E] border border-[#C9A96E]/50 shadow'
                  : 'text-slate-300 hover:text-white bg-[#162C48]/20 border border-transparent'
              }`}
            >
              <HelpCircle size={15} className="text-purple-400" />
              <span>Help Desk & Disputes</span>
              {kpis.openTickets > 0 && (
                <span className="px-1.5 py-0.2 bg-blue-500 text-white rounded-full text-[10px] font-black">
                  {kpis.openTickets}
                </span>
              )}
            </button>

            <button
              onClick={() => selectTab('restrictions')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'restrictions'
                  ? 'bg-gradient-to-r from-[#1A3353] to-[#162C48] text-[#C9A96E] border border-[#C9A96E]/50 shadow'
                  : 'text-slate-300 hover:text-white bg-[#162C48]/20 border border-transparent'
              }`}
            >
              <Lock size={15} className="text-red-400" />
              <span>Bans & Restrictions</span>
            </button>

            {staffRole === 'superadmin' && (
              <button
                onClick={() => selectTab('features')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'features'
                    ? 'bg-gradient-to-r from-[#1A3353] to-[#162C48] text-[#C9A96E] border border-[#C9A96E]/50 shadow'
                    : 'text-slate-300 hover:text-white bg-[#162C48]/20 border border-transparent'
                }`}
              >
                <Sliders size={15} className="text-[#C9A96E]" />
                <span>Superadmin Flags & Logs</span>
              </button>
            )}

            {staffRole === 'superadmin' && (
              <button
                onClick={() => selectTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-[#1A3353] to-[#162C48] text-[#C9A96E] border border-[#C9A96E]/50 shadow'
                    : 'text-slate-300 hover:text-white bg-[#162C48]/20 border border-transparent'
                }`}
              >
                <BarChart3 size={15} className="text-cyan-400" />
                <span>System Analytics</span>
              </button>
            )}
          </div>

          {/* Tab Viewports */}
          <div className="transition-all duration-200">
            {activeTab === 'moderation' && <AdminModerationQueue />}
            {activeTab === 'verification' && <AdminVerificationDesk />}
            {activeTab === 'merchants' && <AdminMerchantPortal />}
            {activeTab === 'users' && <AdminUsers />}
            {activeTab === 'support' && <AdminSupport />}
            {activeTab === 'restrictions' && <AdminRestrictions />}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <AdminFeatures />
                <AdminDashboard />
              </div>
            )}
            {activeTab === 'analytics' && <AdminUserActivity />}
          </div>
        </main>
      </div>
    </AdminRouteGuard>
  );
};

export default Admin;
