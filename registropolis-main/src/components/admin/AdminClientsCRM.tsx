import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Car,
  ShoppingBag,
  Briefcase,
  Wrench,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  FileText,
  Key,
  DollarSign,
  Send,
  X,
  ArrowUpDown,
  Download,
  Copy,
  Check,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { adminClientsAPI, adminAgentsAPI } from '../../services/apiService';
import { ClientProfile, AgentRecord, ClientTier, CrmStaffNote } from '../../types/adminTypes';
import { useAuth } from '../../context/AuthContext';

interface Props {
  initialFilter?: string;
  onNavigateTab?: (tab: string) => void;
}

export const AdminClientsCRM: React.FC<Props> = ({ initialFilter, onNavigateTab }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeCohort, setActiveCohort] = useState<string>(
    initialFilter === 'unassigned'
      ? 'unassigned'
      : initialFilter === 'high_risk'
      ? 'high_risk'
      : 'all'
  );
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortField, setSortField] = useState('newest');

  // Agents list for assignment dropdowns
  const [agents, setAgents] = useState<AgentRecord[]>([]);

  // Selection & Bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAgentModal, setBulkAgentModal] = useState(false);
  const [selectedBulkAgentId, setSelectedBulkAgentId] = useState('');
  const [bulkTierModal, setBulkTierModal] = useState(false);
  const [selectedBulkTier, setSelectedBulkTier] = useState<ClientTier>('pro');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Client Dossier Drawer
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteUrgency, setNewNoteUrgency] = useState<'normal' | 'urgent' | 'internal'>('normal');
  const [tempCredsNotice, setTempCredsNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Fetch agents for assignments
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await adminAgentsAPI.getAgents();
        if (res.success && res.agents) {
          setAgents(res.agents);
        }
      } catch (err) {
        console.error('Error fetching agents:', err);
      }
    };
    fetchAgents();
  }, []);

  // Fetch clients based on active filters
  const fetchClients = async () => {
    setLoading(true);
    try {
      let effectiveAgentId = agentFilter;
      let effectiveRisk = riskFilter;
      let effectiveTier = tierFilter;

      if (activeCohort === 'unassigned') effectiveAgentId = 'unassigned';
      if (activeCohort === 'my_portfolio' && user?.id) effectiveAgentId = user.id;
      if (activeCohort === 'vip') effectiveTier = 'vip';
      if (activeCohort === 'pro') effectiveTier = 'pro';
      if (activeCohort === 'high_risk') effectiveRisk = 'high';

      const res = await adminClientsAPI.getClients({
        search,
        sector: sectorFilter,
        tier: effectiveTier,
        assignedAgentId: effectiveAgentId,
        risk: effectiveRisk,
        page,
        limit,
        sort: sortField,
      });

      if (res.success) {
        setClients(res.clients || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, limit, activeCohort, sectorFilter, tierFilter, agentFilter, riskFilter, sortField]);

  // Handle free search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchClients();
  };

  // Open Dossier
  const handleOpenDossier = async (client: ClientProfile) => {
    setSelectedClient(client);
    setDossierLoading(true);
    setTempCredsNotice(null);
    try {
      const res = await adminClientsAPI.getClientDossier(client.id);
      if (res.success && res.client) {
        setSelectedClient(res.client);
      }
    } catch (err) {
      console.error('Failed to load dossier:', err);
    } finally {
      setDossierLoading(false);
    }
  };

  // Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newNoteText.trim()) return;
    try {
      const res = await adminClientsAPI.addStaffNote(selectedClient.id, {
        text: newNoteText.trim(),
        urgency: newNoteUrgency,
      });
      if (res.success && res.note) {
        setSelectedClient({
          ...selectedClient,
          crmNotes: [res.note, ...(selectedClient.crmNotes || [])],
        });
        setNewNoteText('');
        setActionSuccessMsg('Staff CRM note appended to dossier');
        setTimeout(() => setActionSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    }
  };

  // Assign Single Agent
  const handleAssignAgent = async (agentId: string) => {
    if (!selectedClient) return;
    try {
      const res = await adminClientsAPI.assignAgent(selectedClient.id, agentId);
      if (res.success) {
        const ag = agents.find((a) => a.id === agentId);
        setSelectedClient({
          ...selectedClient,
          assignedAgentId: agentId || undefined,
          assignedAgentName: ag?.name || undefined,
        });
        fetchClients();
        setActionSuccessMsg(`Assigned to ${ag?.name || 'Unassigned Queue'}`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reassign agent');
    }
  };

  // Change Tier
  const handleSetTier = async (tier: ClientTier) => {
    if (!selectedClient) return;
    try {
      const res = await adminClientsAPI.setTier(selectedClient.id, tier);
      if (res.success) {
        setSelectedClient({
          ...selectedClient,
          clientTier: tier,
        });
        fetchClients();
        setActionSuccessMsg(`Client tier updated to ${tier.toUpperCase()}`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update tier');
    }
  };

  // Reset Client Credentials
  const handleResetCredentials = async () => {
    if (!selectedClient) return;
    if (!window.confirm(`Issue secure temporary credential reset for ${selectedClient.name}?`)) return;
    try {
      const res = await adminClientsAPI.resetClientCredentials(selectedClient.id);
      if (res.success && res.temporaryPassword) {
        setTempCredsNotice(res.temporaryPassword);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reset credentials');
    }
  };

  // Bulk Selection
  const toggleSelectAll = () => {
    if (selectedIds.size === clients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clients.map((c) => c.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Bulk Assign Submit
  const handleBulkAssign = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await adminClientsAPI.bulkAssign(Array.from(selectedIds), selectedBulkAgentId);
      if (res.success) {
        setActionSuccessMsg(`Reassigned ${res.count} clients successfully`);
        setSelectedIds(new Set());
        setBulkAgentModal(false);
        fetchClients();
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Bulk assignment failed');
    }
  };

  // Bulk Tier Submit
  const handleBulkTier = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await adminClientsAPI.bulkTier(Array.from(selectedIds), selectedBulkTier);
      if (res.success) {
        setActionSuccessMsg(`Updated tier for ${res.count} clients`);
        setSelectedIds(new Set());
        setBulkTierModal(false);
        fetchClients();
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Bulk tier update failed');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['ID', 'Name', 'Email', 'Company', 'Tier', 'Sector', 'Agent', 'Risk Score', 'Lifetime Spend'],
      ...clients.map((c) => [
        c.id,
        c.name,
        c.email,
        c.businessName || '',
        c.clientTier,
        c.assignedSector,
        c.assignedAgentName || 'Unassigned',
        c.riskScore,
        c.lifetimeSpend,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `buzzer_clients_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTierBadge = (tier: ClientTier) => {
    switch (tier) {
      case 'vip':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A96E]/20 text-[#8B6E33] border border-[#C9A96E]/40 font-mono">
            ★ VIP ENTERPRISE
          </span>
        );
      case 'power':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
            POWER SELLER
          </span>
        );
      case 'pro':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
            VERIFIED PRO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 font-mono">
            STANDARD
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Bar: Title & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-serif font-bold text-[#0F1923]">Institutional Client CRM</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#0F1923] text-white">
              {total.toLocaleString()} ACCOUNTS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Segmented relationship management, agent portfolio routing, and risk surveillance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E8E2D8] hover:bg-[#FAFAF7] text-slate-700 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </button>
          <button
            onClick={() => onNavigateTab?.('agents')}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#0F1923] hover:bg-[#1A3353] text-white transition-all shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5 mr-1.5" />
            Staff & Agents Desk
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
            {actionSuccessMsg}
          </span>
          <button onClick={() => setActionSuccessMsg(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Cohort Tabs Strip */}
      <div className="flex overflow-x-auto border-b border-[#E8E2D8] space-x-2 pb-px scrollbar-none">
        {[
          { id: 'all', label: 'All Accounts' },
          { id: 'vip', label: 'VIP Enterprise' },
          { id: 'pro', label: 'Verified Pro' },
          { id: 'my_portfolio', label: 'My Assigned Book' },
          { id: 'unassigned', label: 'Unassigned Queue' },
          { id: 'high_risk', label: 'Risk Anomalies' },
        ].map((tab) => {
          const isActive = activeCohort === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCohort(tab.id);
                setPage(1);
              }}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-[#0F1923] text-[#0F1923]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Multi-Faceted Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8] shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search across 1M+ accounts by name, email, company, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#E8E2D8] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F1923]"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0F1923] text-white hover:bg-[#1A3353] transition-colors"
          >
            Filter
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E8E2D8]/60">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sector</label>
            <select
              value={sectorFilter}
              onChange={(e) => {
                setSectorFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-[#E8E2D8] bg-white font-medium text-slate-700"
            >
              <option value="all">All Sectors</option>
              <option value="real-estate">Real Estate & Properties</option>
              <option value="transport">Motors & Fleet</option>
              <option value="marketplace">General Marketplace</option>
              <option value="services">Professional Services</option>
              <option value="jobs">Jobs & Recruitment</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Account Tier</label>
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-[#E8E2D8] bg-white font-medium text-slate-700"
            >
              <option value="all">All Tiers</option>
              <option value="vip">VIP Enterprise</option>
              <option value="power">Power Seller</option>
              <option value="pro">Verified Pro</option>
              <option value="standard">Standard</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Assigned Agent</label>
            <select
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-[#E8E2D8] bg-white font-medium text-slate-700"
            >
              <option value="all">All Staff</option>
              <option value="unassigned">Unassigned Only</option>
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} ({ag.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sort Metric</label>
            <select
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-[#E8E2D8] bg-white font-medium text-slate-700"
            >
              <option value="newest">Registration (Newest)</option>
              <option value="spend_desc">Lifetime Spend (Highest)</option>
              <option value="risk_desc">Risk Rating (Highest)</option>
              <option value="tier_priority">Tier Rank (VIP first)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-[#0F1923] text-white p-3.5 rounded-xl shadow-xl flex items-center justify-between animate-fadeIn border border-[#C9A96E]/30">
          <div className="flex items-center space-x-3">
            <span className="w-6 h-6 rounded-full bg-[#C9A96E] text-[#0F1923] text-xs font-bold flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold">Clients selected for bulk action</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setBulkAgentModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Assign to Agent
            </button>
            <button
              onClick={() => setBulkTierModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#C9A96E] hover:bg-[#b89758] text-[#0F1923] transition-colors"
            >
              Update Tier
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Client Directory Table */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#C9A96E] animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Querying Client Partition...
            </p>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No accounts match the active filter criteria</p>
            <p className="text-xs text-slate-400">Try adjusting your search query, sector, or tier parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAF7] border-b border-[#E8E2D8] text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 pl-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === clients.length && clients.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-[#E8E2D8] text-[#0F1923] focus:ring-0"
                    />
                  </th>
                  <th className="py-3.5 pl-2">Account Dossier</th>
                  <th className="py-3.5">Tier & Verified</th>
                  <th className="py-3.5">Sector</th>
                  <th className="py-3.5">Assigned Agent</th>
                  <th className="py-3.5 text-right">Spend</th>
                  <th className="py-3.5 text-center">Risk</th>
                  <th className="py-3.5 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]/60">
                {clients.map((client) => {
                  const isSelected = selectedIds.has(client.id);
                  return (
                    <tr
                      key={client.id}
                      className={`hover:bg-[#FAFAF7]/80 transition-colors ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-3 pl-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(client.id)}
                          className="rounded border-[#E8E2D8] text-[#0F1923] focus:ring-0"
                        />
                      </td>

                      <td
                        onClick={() => handleOpenDossier(client)}
                        className="py-3 pl-2 cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              client.profileImageUrl ||
                              `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`
                            }
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover border border-[#E8E2D8]"
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <p className="font-bold text-sm text-[#0F1923] group-hover:text-[#C9A96E] transition-colors">
                                {client.name}
                              </p>
                              {client.verified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 inline" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {client.email || 'No email provided'}
                            </p>
                            {client.businessName && (
                              <p className="text-[10px] text-slate-400 font-medium">
                                🏢 {client.businessName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        <div className="space-y-1">
                          {getTierBadge(client.clientTier)}
                          {client.verifiedLevel > 1 && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              KYB Level {client.verifiedLevel}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3">
                        <span className="font-mono text-[11px] uppercase text-slate-600 font-medium">
                          {client.assignedSector}
                        </span>
                      </td>

                      <td className="py-3">
                        {client.assignedAgentName ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-semibold text-slate-800 text-xs">
                              {client.assignedAgentName}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 font-mono">
                            UNASSIGNED
                          </span>
                        )}
                      </td>

                      <td className="py-3 text-right font-mono font-medium text-slate-800">
                        ${(client.lifetimeSpend || 0).toLocaleString()}
                      </td>

                      <td className="py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            client.riskScore >= 70
                              ? 'bg-red-100 text-red-800'
                              : client.riskScore >= 30
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {client.riskScore}/100
                        </span>
                      </td>

                      <td className="py-3 text-right pr-4">
                        <button
                          onClick={() => handleOpenDossier(client)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-[#0F1923] hover:text-white text-slate-700 transition-colors"
                        >
                          Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 bg-[#FAFAF7] border-t border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span>Rows per partition:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded border border-[#E8E2D8] bg-white text-slate-700 font-semibold"
            >
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="50">50</option>
            </select>
            <span className="font-mono">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-[#E8E2D8] bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-semibold px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[#E8E2D8] bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 360° Client Profile Dossier Drawer */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-[#E8E2D8] animate-slideInRight">
            {/* Drawer Header */}
            <div className="p-6 bg-[#0F1923] text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    selectedClient.profileImageUrl ||
                    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`
                  }
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover border border-white/20"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-white font-serif">{selectedClient.name}</h2>
                    {selectedClient.verified && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-mono">{selectedClient.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Account Quick Metrics Card */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAFAF7] border border-[#E8E2D8]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Lifetime Spend</span>
                  <p className="text-lg font-mono font-bold text-slate-800 mt-0.5">
                    ${(selectedClient.lifetimeSpend || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Listings / Ads</span>
                  <p className="text-lg font-mono font-bold text-slate-800 mt-0.5">
                    {selectedClient.totalListings} / {selectedClient.activeAds}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Risk Rating</span>
                  <p
                    className={`text-lg font-mono font-bold mt-0.5 ${
                      selectedClient.riskScore >= 70
                        ? 'text-red-600'
                        : selectedClient.riskScore >= 30
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {selectedClient.riskScore} / 100
                  </p>
                </div>
              </div>

              {/* Assignment & Tier Controls Strip */}
              <div className="space-y-4 p-4 rounded-xl border border-[#E8E2D8]">
                <h3 className="text-xs font-bold text-[#0F1923] uppercase tracking-wider">
                  Portfolio Routing & Account Tier
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">
                      Assigned Account Executive:
                    </label>
                    <select
                      value={selectedClient.assignedAgentId || ''}
                      onChange={(e) => handleAssignAgent(e.target.value)}
                      className="w-full text-xs py-2 px-3 rounded-lg border border-[#E8E2D8] bg-white font-semibold text-slate-800"
                    >
                      <option value="">-- Unassigned Queue --</option>
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({ag.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">
                      Account Tier / Privilege:
                    </label>
                    <select
                      value={selectedClient.clientTier}
                      onChange={(e) => handleSetTier(e.target.value as ClientTier)}
                      className="w-full text-xs py-2 px-3 rounded-lg border border-[#E8E2D8] bg-white font-semibold text-slate-800"
                    >
                      <option value="standard">Standard Free</option>
                      <option value="pro">Verified Pro</option>
                      <option value="power">Power Seller</option>
                      <option value="vip">VIP Enterprise</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E8E2D8]/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Security Credentials:</span>
                  <button
                    onClick={handleResetCredentials}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5 mr-1.5" />
                    Reset Temporary Access
                  </button>
                </div>

                {tempCredsNotice && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-amber-700">Generated Temp Password:</p>
                      <p className="font-mono font-bold text-amber-950 mt-0.5">{tempCredsNotice}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tempCredsNotice);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="p-1.5 rounded bg-white border border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Threaded Internal Staff CRM Notes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F1923] uppercase tracking-wider flex items-center">
                    <FileText className="w-4 h-4 mr-1.5 text-[#C9A96E]" />
                    Internal Staff CRM Notes ({selectedClient.crmNotes?.length || 0})
                  </h3>
                  <span className="text-[10px] text-slate-400">Strictly confidential</span>
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Add operational notes, deal negotiations, KYC flags, or SLA remarks..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-[#E8E2D8] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F1923]"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {(['normal', 'urgent', 'internal'] as const).map((urgency) => (
                        <button
                          key={urgency}
                          type="button"
                          onClick={() => setNewNoteUrgency(urgency)}
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                            newNoteUrgency === urgency
                              ? urgency === 'urgent'
                                ? 'bg-red-600 text-white'
                                : urgency === 'internal'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-[#0F1923] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {urgency}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-bold bg-[#0F1923] hover:bg-[#1A3353] text-white disabled:opacity-40 transition-colors"
                    >
                      <Send className="w-3 h-3 mr-1.5" />
                      Append Note
                    </button>
                  </div>
                </form>

                {/* Notes History */}
                <div className="space-y-3 pt-2">
                  {selectedClient.crmNotes && selectedClient.crmNotes.length > 0 ? (
                    selectedClient.crmNotes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-3.5 rounded-xl border space-y-1.5 ${
                          note.urgency === 'urgent'
                            ? 'bg-red-50/50 border-red-200'
                            : note.urgency === 'internal'
                            ? 'bg-indigo-50/50 border-indigo-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900">{note.authorName}</span>
                          <span className="font-mono text-slate-400">
                            {new Date(note.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      No staff notes recorded yet for this client account.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {bulkAgentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E2D8] space-y-4">
            <h3 className="text-base font-bold text-[#0F1923] font-serif">
              Reassign {selectedIds.size} Accounts in Bulk
            </h3>
            <p className="text-xs text-slate-500">
              Select the recipient staff agent or move back to the unassigned pool.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Target Staff Agent
              </label>
              <select
                value={selectedBulkAgentId}
                onChange={(e) => setSelectedBulkAgentId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-white font-semibold text-slate-800"
              >
                <option value="">-- Send to Unassigned Queue --</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.department} - {ag.assignedClientCount}/{ag.maxClientQuota} active)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setBulkAgentModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAssign}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F1923] text-white hover:bg-[#1A3353]"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Tier Modal */}
      {bulkTierModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E2D8] space-y-4">
            <h3 className="text-base font-bold text-[#0F1923] font-serif">
              Batch Tier Upgrade / Downgrade
            </h3>
            <p className="text-xs text-slate-500">
              Apply new service tier to {selectedIds.size} selected client accounts.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Target Tier</label>
              <select
                value={selectedBulkTier}
                onChange={(e) => setSelectedBulkTier(e.target.value as ClientTier)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-white font-semibold text-slate-800"
              >
                <option value="standard">Standard Free</option>
                <option value="pro">Verified Pro</option>
                <option value="power">Power Seller</option>
                <option value="vip">VIP Enterprise</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setBulkTierModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkTier}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C9A96E] text-[#0F1923] hover:bg-[#b89758]"
              >
                Apply Tier Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
