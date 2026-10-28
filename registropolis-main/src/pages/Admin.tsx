import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle,
  CircleHelp,
  Eye,
  EyeOff,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Megaphone,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminFeatures from '@/components/admin/AdminFeatures';
import AdminUserActivity from '@/components/admin/AdminUserActivity';
import AdminRestrictions from '@/components/admin/AdminRestrictions';
import AdminSupport from '@/components/admin/AdminSupport';
import { AdminModerationQueue } from '@/components/admin/AdminModerationQueue';
import { AdminVerificationDesk } from '@/components/admin/AdminVerificationDesk';
import { AdminMerchantPortal } from '@/components/admin/AdminMerchantPortal';
import { useAuth } from '@/context/AuthContext';
import { adminCRMAPI } from '@/services/apiService';
import {
  ADMIN_TAB_PERMISSIONS,
  hasAdminPermission,
  isStaffRole,
  type AdminTab,
  type StaffRole,
} from '@/config/adminAccess';

type AdminKpis = {
  totalUsers: number;
  activeListings: number;
  pendingModeration: number;
  pendingVerifications: number;
  openTickets: number;
  sponsoredBusinesses: number;
};

type NavigationItem = {
  id: AdminTab;
  label: string;
  group: 'OPERATIONS' | 'ADMINISTRATION';
  icon: LucideIcon;
};

const STAFF_PROFILES: Record<StaffRole, { title: string; badge: string }> = {
  superadmin: { title: 'Platform Director & Superadmin', badge: 'Super Admin' },
  operations: { title: 'Commercial Operations & Partner CRM', badge: 'Ops Manager' },
  moderator: { title: 'Trust & Safety Lead Moderator', badge: 'Content Moderator' },
  support: { title: 'Customer Experience & Help Desk', badge: 'Support Specialist' },
};

const NAVIGATION: NavigationItem[] = [
  { id: 'overview', label: 'Executive Overview', group: 'OPERATIONS', icon: LayoutDashboard },
  { id: 'users', label: 'User & Merchant CRM', group: 'OPERATIONS', icon: Users },
  { id: 'moderation', label: 'Catalog & Moderation', group: 'OPERATIONS', icon: BriefcaseBusiness },
  { id: 'merchants', label: 'Business & Advertising', group: 'OPERATIONS', icon: Megaphone },
  { id: 'verification', label: 'Verification Desk', group: 'OPERATIONS', icon: ShieldCheck },
  { id: 'restrictions', label: 'Trust, Safety & Bans', group: 'OPERATIONS', icon: LockKeyhole },
  { id: 'support', label: 'Help Desk & Support', group: 'OPERATIONS', icon: CircleHelp },
  { id: 'analytics', label: 'Audit & Analytics', group: 'ADMINISTRATION', icon: BarChart3 },
  { id: 'features', label: 'System Configuration', group: 'ADMINISTRATION', icon: Settings2 },
];

const EMPTY_KPIS: AdminKpis = {
  totalUsers: 0,
  activeListings: 0,
  pendingModeration: 0,
  pendingVerifications: 0,
  openTickets: 0,
  sponsoredBusinesses: 0,
};

const isAdminTab = (value: string | null): value is AdminTab =>
  value !== null && Object.prototype.hasOwnProperty.call(ADMIN_TAB_PERMISSIONS, value);

const Admin = () => {
  const { user, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const staffRole: StaffRole = isStaffRole(user?.staffRole) ? user.staffRole : 'superadmin';
  const staffProfile = STAFF_PROFILES[staffRole];
  const allowedNavigation = useMemo(
    () => NAVIGATION.filter(item => hasAdminPermission(staffRole, ADMIN_TAB_PERMISSIONS[item.id])),
    [staffRole],
  );
  const requestedTab = searchParams.get('tab');
  const activeTab = isAdminTab(requestedTab) &&
    allowedNavigation.some(item => item.id === requestedTab)
    ? requestedTab
    : allowedNavigation[0]?.id ?? 'overview';
  const [piiMasked, setPiiMasked] = useState(true);
  const [kpis, setKpis] = useState<AdminKpis>(EMPTY_KPIS);
  const [isLoadingKpis, setIsLoadingKpis] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    type: string;
    id: string;
    label: string;
    detail?: string;
    href: string;
  }>>([]);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (!isAdminTab(requestedTab) || !allowedNavigation.some(item => item.id === requestedTab)) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, allowedNavigation, requestedTab, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchOverview = async () => {
      try {
        setIsLoadingKpis(true);
        const data = await adminCRMAPI.getOverview(controller.signal);
        if (data.success && data.kpis) setKpis(data.kpis);
      } catch (error) {
        if (controller.signal.aborted) return;
        toast.error(error instanceof Error ? error.message : 'Could not load operations overview');
        console.error('Failed to load admin overview:', error);
      } finally {
        if (!controller.signal.aborted) setIsLoadingKpis(false);
      }
    };

    void fetchOverview();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const query = globalSearch.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setSearchError('');
        const data = await adminCRMAPI.search(query, controller.signal);
        setSearchResults(data.results || []);
      } catch (error) {
        if (controller.signal.aborted) return;
        setSearchError(error instanceof Error ? error.message : 'Search failed');
        setSearchResults([]);
      }
    }, 250);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [globalSearch]);

  const openSearchResult = (href: string) => {
    const url = new URL(href, window.location.origin);
    setSearchParams(Object.fromEntries(url.searchParams.entries()));
    setGlobalSearch('');
    setSearchResults([]);
  };

  const selectTab = (tab: AdminTab) => {
    if (!allowedNavigation.some(item => item.id === tab)) return;
    setSearchParams({ tab });
  };

  const canRevealPii = hasAdminPermission(staffRole, 'users:pii');
  const sections = (['OPERATIONS', 'ADMINISTRATION'] as const).map(group => ({
    group,
    items: allowedNavigation.filter(item => item.group === group),
  })).filter(section => section.items.length > 0);

  const summaryCards = [
    { label: 'Platform members', value: kpis.totalUsers, icon: Users, tone: 'navy' },
    { label: 'Live listings', value: kpis.activeListings, icon: BriefcaseBusiness, tone: 'navy' },
    { label: 'Awaiting review', value: kpis.pendingModeration, icon: Zap, tone: 'gold', tab: 'moderation' as const },
    { label: 'Verifications', value: kpis.pendingVerifications, icon: ShieldCheck, tone: 'gold', tab: 'verification' as const },
    { label: 'Open support tickets', value: kpis.openTickets, icon: CircleHelp, tone: 'navy', tab: 'support' as const },
    { label: 'Promoted businesses', value: kpis.sponsoredBusinesses, icon: Megaphone, tone: 'green', tab: 'merchants' as const },
  ];

  return (
      <div className="admin-shell min-h-screen bg-[#FAFAF7] text-[#0F1923]">
        <header className="sticky top-0 z-40 border-b border-[#E8E2D8] bg-[#FAFAF7]/95 px-4 py-3 backdrop-blur-xl lg:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C9A96E]/50 bg-[#1A3353] font-black text-[#C9A96E] shadow-sm">BZ</div>
              <div>
                <h1 className="font-extrabold tracking-tight text-[#0F1923]">BUZZER OPERATIONS</h1>
                <p className="text-[11px] text-[#6E7A8A]">Back-office workspace</p>
              </div>
            </div>
            <div className="relative order-3 w-full max-w-xl lg:order-none lg:flex-1 lg:px-6">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#87909A]" />
                <input
                  type="search"
                  value={globalSearch}
                  onChange={event => setGlobalSearch(event.target.value)}
                  placeholder="Search users, listings, businesses, tickets…"
                  aria-label="Search CRM records"
                  className="w-full rounded-xl border border-[#E8E2D8] bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-[#C9A96E]"
                />
              </div>
              {globalSearch.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-[#E8E2D8] bg-white p-2 shadow-xl lg:left-6">
                  {searchError ? (
                    <p className="p-3 text-xs text-red-600">{searchError}</p>
                  ) : searchResults.length ? searchResults.map(result => (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => openSearchResult(result.href)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F5F0E8]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-[#1A3353]">{result.label}</span>
                        <span className="block truncate text-[10px] text-[#6E7A8A]">{result.type} · {result.detail || result.id}</span>
                      </span>
                      <span className="text-[10px] text-[#87909A]">Open</span>
                    </button>
                  )) : (
                    <p className="p-3 text-xs text-[#6E7A8A]">No matching records.</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canRevealPii && activeTab === 'users' && (
                <button
                  type="button"
                  onClick={() => setPiiMasked(value => !value)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#E8E2D8] bg-white px-3 py-2 text-xs font-semibold text-[#1A3353] hover:bg-[#F5F0E8]"
                  aria-pressed={!piiMasked}
                >
                  {piiMasked ? <EyeOff size={14} /> : <Eye size={14} />}
                  {piiMasked ? 'PII masked' : 'PII visible'}
                </button>
              )}
              <div className="hidden text-right sm:block">
                <div className="text-xs font-bold">{user?.name || 'Staff member'}</div>
                <div className="text-[10px] text-[#6E7A8A]">{user?.staffTitle || staffProfile.title}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C9A96E]/50 bg-[#F5F0E8] text-sm font-bold text-[#1A3353]" aria-hidden="true">
                {(user?.name || 'S').charAt(0)}
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex items-center gap-1.5 rounded-xl border border-[#E8E2D8] bg-white px-3 py-2 text-xs font-semibold text-[#6E7A8A] hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-[1600px] lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="border-b border-[#E8E2D8] bg-white/70 p-3 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-4">
            <nav aria-label="Back-office modules" className="admin-tab-scroll flex gap-2 overflow-x-auto lg:block lg:space-y-5">
              {sections.map(section => (
                <div key={section.group} className="shrink-0 lg:space-y-1">
                  <div className="hidden px-3 pb-1 text-[10px] font-bold tracking-[0.12em] text-[#87909A] lg:block">
                    {section.group}
                  </div>
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectTab(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex min-h-10 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors lg:w-full ${
                          isActive
                            ? 'bg-[#1A3353] text-white shadow-sm'
                            : 'text-[#526070] hover:bg-[#F5F0E8] hover:text-[#1A3353]'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-[#C9A96E]' : 'text-[#6E7A8A]'} />
                        <span>{item.label}</span>
                        {item.id === 'support' && kpis.openTickets > 0 && (
                          <span className="ml-auto rounded-full bg-[#C9A96E] px-1.5 py-0.5 text-[10px] font-bold text-[#0F1923]">{kpis.openTickets}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
            <div className="mt-6 hidden rounded-xl border border-[#E8E2D8] bg-[#F5F0E8] p-3 lg:block">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1A3353]">
                <Activity size={14} className="text-emerald-600" />
                Staff access active
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[#6E7A8A]">
                Your role controls which modules and actions are available.
              </p>
            </div>
          </aside>

          <main className="min-w-0 p-4 sm:p-6 lg:p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8A6A32]">Operations center</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">Executive Overview</h2>
                    <p className="mt-1 text-sm text-[#6E7A8A]">Platform activity and the work that needs attention.</p>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    Workspace operational
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {summaryCards.map(card => {
                    const Icon = card.icon;
                    const isActionable = card.tab && allowedNavigation.some(item => item.id === card.tab);
                    return (
                      <button
                        key={card.label}
                        type="button"
                        disabled={!isActionable}
                        onClick={() => card.tab && selectTab(card.tab)}
                        className={`rounded-2xl border border-[#E8E2D8] bg-white p-4 text-left shadow-[0_1px_3px_rgba(15,25,35,0.04)] ${isActionable ? 'transition hover:-translate-y-0.5 hover:shadow-md' : 'cursor-default'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#6E7A8A]">{card.label}</span>
                          <Icon size={16} className={card.tone === 'gold' ? 'text-[#A27B37]' : card.tone === 'green' ? 'text-emerald-600' : 'text-[#1A3353]'} />
                        </div>
                        <div className="mt-3 text-2xl font-bold text-[#0F1923]">
                          {isLoadingKpis ? <span className="text-[#AAB1B9]">—</span> : card.value.toLocaleString()}
                        </div>
                        {isActionable && <div className="mt-2 text-[11px] font-semibold text-[#1A3353]">Open module →</div>}
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-[0_1px_3px_rgba(15,25,35,0.04)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={17} className="text-emerald-600" />
                    <h3 className="font-semibold">Your operational modules</h3>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {allowedNavigation.filter(item => item.id !== 'overview').map(item => (
                      <button
                        key={item.id}
                        onClick={() => selectTab(item.id)}
                        className="flex items-center gap-2 rounded-xl border border-[#E8E2D8] px-3 py-3 text-left text-xs font-semibold text-[#526070] hover:bg-[#F5F0E8] hover:text-[#1A3353]"
                      >
                        <item.icon size={15} className="text-[#8A6A32]" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'users' && <AdminUsers piiMasked={piiMasked} canManageUsers={hasAdminPermission(staffRole, 'users:write')} canRestrictUsers={hasAdminPermission(staffRole, 'users:ban')} />}
            {activeTab === 'moderation' && <AdminModerationQueue />}
            {activeTab === 'merchants' && <AdminMerchantPortal />}
            {activeTab === 'verification' && <AdminVerificationDesk />}
            {activeTab === 'restrictions' && <AdminRestrictions />}
            {activeTab === 'support' && <AdminSupport />}
            {activeTab === 'features' && <AdminFeatures />}
            {activeTab === 'analytics' && <AdminUserActivity />}
          </main>
        </div>
      </div>
  );
};

export default Admin;
