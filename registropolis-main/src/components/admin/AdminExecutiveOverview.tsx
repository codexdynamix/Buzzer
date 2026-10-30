import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Building2,
  Car,
  ShoppingBag,
  Briefcase,
  Wrench,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Layers,
  ChevronRight,
  DollarSign,
  Activity,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { executiveOverviewAPI } from '../../services/apiService';
import { ExecutiveOverviewData } from '../../types/adminTypes';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onNavigateTab?: (tab: string, queryParam?: string) => void;
}

export const AdminExecutiveOverview: React.FC<Props> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [data, setData] = useState<ExecutiveOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await executiveOverviewAPI.getData();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load executive metrics');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching executive overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const getSectorIcon = (id: string) => {
    switch (id) {
      case 'real-estate':
        return <Building2 className="w-5 h-5 text-emerald-600" />;
      case 'motors':
        return <Car className="w-5 h-5 text-blue-600" />;
      case 'marketplace':
        return <ShoppingBag className="w-5 h-5 text-amber-600" />;
      case 'services':
        return <Wrench className="w-5 h-5 text-indigo-600" />;
      case 'jobs':
        return <Briefcase className="w-5 h-5 text-purple-600" />;
      case 'kyb':
        return <ShieldCheck className="w-5 h-5 text-[#C9A96E]" />;
      default:
        return <Layers className="w-5 h-5 text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[420px] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#C9A96E] animate-spin" />
        <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">
          Aggregating Platform Scale Metrics & Caseloads...
        </p>
      </div>
    );
  }

  const kpis = data?.kpis;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Executive Command Header */}
      <div className="bg-gradient-to-r from-[#0F1923] via-[#1A3353] to-[#0F1923] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-[#E8E2D8]/20">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#C9A96E]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C9A96E] text-[#0F1923]">
                EXECUTIVE COMMAND CENTER
              </span>
              <span className="flex items-center text-xs text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                Live Cluster Operational
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-tight font-bold text-white">
              Platform & Client Operations Overview
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl font-light">
              Real-time surveillance across 1,000,000+ accounts, departmental caseload balance, institutional KYB, and transaction velocities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchOverview(true)}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/10 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Sync Platform Pulse
            </button>
            <button
              onClick={() => onNavigateTab?.('clients')}
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold bg-[#C9A96E] hover:bg-[#b89758] text-[#0F1923] transition-all shadow-md active:scale-95"
            >
              Access Client CRM
              <ArrowUpRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>
        </div>

        {/* Platform Core Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Managed Accounts</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {kpis?.totalClients.toLocaleString() || '1,090,800+'}
            </p>
            <p className="text-xs text-emerald-400 mt-0.5 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 inline" /> +8.4% QoQ growth
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Verified Pro Merchants</p>
            <p className="text-2xl font-bold font-mono text-[#C9A96E] mt-1">
              {kpis?.proMerchants.toLocaleString() || '42,150'}
            </p>
            <p className="text-xs text-slate-300 mt-0.5">3.8% of user base</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Est. Monthly GMV</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {kpis?.monthlyGmvEstimate || '$14.85M'}
            </p>
            <p className="text-xs text-slate-300 mt-0.5">Escrow & Direct</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Avg Support & SLA</p>
            <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {kpis?.avgResponseMinutes || 4.2}m
            </p>
            <p className="text-xs text-slate-300 mt-0.5">Tier 1-4 routing speed</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchOverview()} className="underline text-xs font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Actionable Triage Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab?.('clients', 'unassigned')}
          className="bg-white p-5 rounded-2xl border border-[#E8E2D8] hover:border-[#C9A96E] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Unassigned Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-mono font-bold text-[#0F1923] mt-2">
            {kpis?.unassignedQueue ?? 148}
          </p>
          <p className="text-xs text-amber-700 font-medium mt-1 flex items-center">
            Needs agent delegation
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </p>
        </div>

        <div
          onClick={() => onNavigateTab?.('verification')}
          className="bg-white p-5 rounded-2xl border border-[#E8E2D8] hover:border-[#C9A96E] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">KYB & Verifications</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-mono font-bold text-[#0F1923] mt-2">
            {kpis?.pendingVerification ?? 37}
          </p>
          <p className="text-xs text-blue-700 font-medium mt-1 flex items-center">
            Awaiting identity approval
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </p>
        </div>

        <div
          onClick={() => onNavigateTab?.('support')}
          className="bg-white p-5 rounded-2xl border border-[#E8E2D8] hover:border-[#C9A96E] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Escalated Tickets</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-mono font-bold text-[#0F1923] mt-2">
            {kpis?.openTickets ?? 19}
          </p>
          <p className="text-xs text-indigo-700 font-medium mt-1 flex items-center">
            High priority cases
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </p>
        </div>

        <div
          onClick={() => onNavigateTab?.('clients', 'high_risk')}
          className="bg-white p-5 rounded-2xl border border-[#E8E2D8] hover:border-red-300 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Risk Anomalies</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-mono font-bold text-red-600 mt-2">
            {kpis?.highRiskAlerts ?? 5}
          </p>
          <p className="text-xs text-red-700 font-medium mt-1 flex items-center">
            Velocity & fraud flags
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </p>
        </div>
      </div>

      {/* Main Grid: Sector Performance + Workload Balancing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sector Distribution Breakdown (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8E2D8] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#0F1923]">Sector Inventory & Capacity Matrix</h2>
              <p className="text-xs text-slate-500">Autonomous departmental performance and catalog depth</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
              6 Active Sectors
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D8] text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-2">Market Sector</th>
                  <th className="pb-3 text-right">Client Accounts</th>
                  <th className="pb-3 text-right">Active Inventory</th>
                  <th className="pb-3 text-right">Desk Staff</th>
                  <th className="pb-3 text-right">Backlog</th>
                  <th className="pb-3 text-right pr-2">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]/60">
                {data?.sectors &&
                  Object.values(data.sectors).map((sector) => (
                    <tr
                      key={sector.id}
                      onClick={() => onNavigateTab?.('clients', sector.id)}
                      className="hover:bg-[#FAFAF7] cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 pl-2 flex items-center space-x-3">
                        <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-white border border-[#E8E2D8]/80 transition-colors">
                          {getSectorIcon(sector.id)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#0F1923] group-hover:text-[#C9A96E] transition-colors">
                            {sector.name}
                          </p>
                          <p className="text-[11px] text-slate-400 capitalize">{sector.id}</p>
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-mono font-medium text-slate-700">
                        {sector.clientCount.toLocaleString()}
                      </td>
                      <td className="py-3.5 text-right font-mono font-medium text-slate-700">
                        {sector.activeListings > 0 ? sector.activeListings.toLocaleString() : '—'}
                      </td>
                      <td className="py-3.5 text-right font-medium text-slate-700">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 font-mono text-[11px]">
                          {sector.activeAgents} agents
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            sector.backlogCount > 25 ? 'text-amber-600' : 'text-slate-500'
                          }`}
                        >
                          {sector.backlogCount} pending
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2 font-mono font-semibold text-emerald-600">
                        {sector.growthRate}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent Caseload & Capacity Balance (1 col) */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#0F1923]">Staff Caseload Balance</h2>
                <p className="text-xs text-slate-500">Live allocation vs max quota per agent</p>
              </div>
              <button
                onClick={() => onNavigateTab?.('agents')}
                className="text-xs font-semibold text-[#C9A96E] hover:underline"
              >
                Manage Desk
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {data?.agentCaseload?.slice(0, 6).map((agent) => {
                const percent = Math.min(100, Math.round((agent.assignedCount / (agent.quota || 1)) * 100));
                const isOverloaded = percent >= 90;
                return (
                  <div key={agent.agentId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800">{agent.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {agent.department}
                        </span>
                      </div>
                      <span className="font-mono text-slate-500 text-[11px]">
                        <strong className="text-slate-900">{agent.assignedCount}</strong> / {agent.quota} ({percent}%)
                      </span>
                    </div>
                    {/* Caseload Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverloaded
                            ? 'bg-red-500'
                            : percent > 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E8E2D8] flex items-center justify-between">
            <span className="text-xs text-slate-500">Total Staff Active</span>
            <button
              onClick={() => onNavigateTab?.('agents')}
              className="text-xs font-bold text-[#0F1923] hover:text-[#C9A96E] flex items-center"
            >
              Provision New Agent
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Critical Escalations Feed */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-serif font-bold text-[#0F1923]">Critical Operational Alerts</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time anomaly sentinel</span>
        </div>

        <div className="space-y-3">
          {data?.recentCriticalAlerts?.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                alert.severity === 'critical'
                  ? 'bg-red-50/60 border-red-200'
                  : alert.severity === 'high'
                  ? 'bg-amber-50/60 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span
                  className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider ${
                    alert.severity === 'critical'
                      ? 'bg-red-600 text-white'
                      : alert.severity === 'high'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {alert.severity}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#0F1923]">{alert.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Client:{' '}
                    <strong className="text-slate-800">{alert.clientName}</strong> ({alert.clientId})
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => onNavigateTab?.('clients', alert.clientId)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F1923] text-white hover:bg-[#1A3353] transition-colors"
                >
                  Open Dossier
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
