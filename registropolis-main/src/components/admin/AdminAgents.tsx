import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building2,
  Key,
  RefreshCw,
  Copy,
  Check,
  MoreVertical,
  X,
  AlertTriangle,
  ArrowRightLeft,
  Lock,
  Unlock,
  CheckCircle2,
  Briefcase,
  Layers,
  Search,
  Filter,
} from 'lucide-react';
import { adminAgentsAPI } from '../../services/apiService';
import { AgentRecord, StaffRole, StaffDepartment } from '../../types/adminTypes';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export const AdminAgents: React.FC<Props> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentPhone, setNewAgentPhone] = useState('');
  const [newAgentRole, setNewAgentRole] = useState<StaffRole>('account_exec');
  const [newAgentTitle, setNewAgentTitle] = useState('');
  const [newAgentDept, setNewAgentDept] = useState<StaffDepartment>('real-estate');
  const [newAgentQuota, setNewAgentQuota] = useState(250);
  const [newAgentPassword, setNewAgentPassword] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Success Credential Slip Modal
  const [credentialSlip, setCredentialSlip] = useState<{
    name: string;
    email: string;
    password?: string;
    role: string;
    department: string;
  } | null>(null);
  const [copiedSlip, setCopiedSlip] = useState(false);

  // Reassign Portfolio Modal
  const [reassignModal, setReassignModal] = useState<AgentRecord | null>(null);
  const [targetAgentId, setTargetAgentId] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);

  // Reset Credentials Modal
  const [resetModalAgent, setResetModalAgent] = useState<AgentRecord | null>(null);
  const [newTempPass, setNewTempPass] = useState('');

  // Status banner
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await adminAgentsAPI.getAgents(departmentFilter !== 'all' ? departmentFilter : undefined);
      if (res.success && res.agents) {
        setAgents(res.agents);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [departmentFilter]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Generate a random secure password for provisioning
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Buzzer-';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewAgentPassword(res);
  };

  // Handle agent provisioning submit
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentEmail.trim()) {
      alert('Name and work email are required');
      return;
    }
    setCreateSubmitting(true);
    try {
      const passwordToUse = newAgentPassword.trim() || `Agent-${Math.random().toString(36).substring(2, 8)}!2026`;
      const res = await adminAgentsAPI.createAgent({
        name: newAgentName.trim(),
        email: newAgentEmail.trim(),
        contactPhone: newAgentPhone.trim(),
        staffRole: newAgentRole,
        staffTitle: newAgentTitle.trim() || `${newAgentRole.replace('_', ' ').toUpperCase()} Specialist`,
        department: newAgentDept,
        maxClientQuota: newAgentQuota,
        temporaryPassword: passwordToUse,
        assignedSupervisorId: user?.id,
      });

      if (res.success) {
        setShowCreateModal(false);
        setCredentialSlip({
          name: newAgentName,
          email: newAgentEmail,
          password: passwordToUse,
          role: newAgentRole,
          department: newAgentDept,
        });
        // reset form
        setNewAgentName('');
        setNewAgentEmail('');
        setNewAgentPhone('');
        setNewAgentTitle('');
        setNewAgentPassword('');
        fetchAgents();
      } else {
        alert(res.message || 'Failed to create agent');
      }
    } catch (err: any) {
      alert(err.message || 'Network error during agent creation');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handle agent status toggle
  const handleToggleStatus = async (agent: AgentRecord, nextStatus: 'active' | 'away' | 'suspended') => {
    try {
      const res = await adminAgentsAPI.updateStatus(agent.id, nextStatus);
      if (res.success) {
        showToast(`Updated ${agent.name} status to ${nextStatus}`);
        fetchAgents();
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  // Handle credentials reset
  const handleResetCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalAgent) return;
    try {
      const res = await adminAgentsAPI.updateCredentials(resetModalAgent.id, {
        temporaryPassword: newTempPass.trim() || undefined,
      });
      if (res.success) {
        setCredentialSlip({
          name: resetModalAgent.name,
          email: resetModalAgent.email,
          password: res.temporaryPassword || newTempPass,
          role: resetModalAgent.staffRole,
          department: resetModalAgent.department,
        });
        setResetModalAgent(null);
        setNewTempPass('');
        fetchAgents();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reset credentials');
    }
  };

  // Handle portfolio reassignment
  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModal || !targetAgentId) return;
    setReassignLoading(true);
    try {
      const res = await adminAgentsAPI.reassignPortfolio(reassignModal.id, targetAgentId);
      if (res.success) {
        showToast(`Transferred ${res.transferredCount || 0} clients to new agent`);
        setReassignModal(null);
        setTargetAgentId('');
        fetchAgents();
      }
    } catch (err: any) {
      alert(err.message || 'Portfolio transfer failed');
    } finally {
      setReassignLoading(false);
    }
  };

  // Filtered list
  const filteredAgents = agents.filter((ag) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const match =
        ag.name.toLowerCase().includes(q) ||
        ag.email.toLowerCase().includes(q) ||
        ag.staffTitle?.toLowerCase().includes(q) ||
        ag.department.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Capacity stats
  const totalCapacity = agents.reduce((acc, a) => acc + (a.maxClientQuota || 0), 0);
  const totalAssigned = agents.reduce((acc, a) => acc + (a.assignedClientCount || 0), 0);
  const avgUtilization = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Title & Primary Provisioning Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-serif font-bold text-[#0F1923]">Staff & Agent Operations Desk</h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#C9A96E] text-[#0F1923]">
              {agents.length} STAFF MEMBERS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hierarchical delegation architecture: department leads can provision and manage agents to scale beyond 1,000,000 clients.
          </p>
        </div>

        <button
          onClick={() => {
            generateRandomPassword();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0F1923] hover:bg-[#1A3353] text-white transition-all shadow-md active:scale-95"
        >
          <UserPlus className="w-4 h-4 mr-2 text-[#C9A96E]" />
          Provision New Agent
        </button>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
            {toastMsg}
          </span>
          <button onClick={() => setToastMsg(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Staff Capacity & Quota Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8E2D8] shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Staff Active</span>
          <p className="text-2xl font-mono font-bold text-[#0F1923] mt-1">{agents.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across 7 departments</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E8E2D8] shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Client Caseload Quota</span>
          <p className="text-2xl font-mono font-bold text-slate-800 mt-1">{totalCapacity.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Max platform bandwidth</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E8E2D8] shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Book Assigned</span>
          <p className="text-2xl font-mono font-bold text-emerald-600 mt-1">{totalAssigned.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Accounts actively under care</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E8E2D8] shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Desk Utilization</span>
          <p className="text-2xl font-mono font-bold text-[#C9A96E] mt-1">{avgUtilization}%</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Healthy capacity reserve</p>
        </div>
      </div>

      {/* Search & Department Selector */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8] shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search agents by name, email, department, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#E8E2D8] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F1923]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Department Desk:</span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-[#E8E2D8] bg-white font-semibold text-slate-800 focus:outline-none"
          >
            <option value="all">All Departments</option>
            <option value="general">Executive & General Ops</option>
            <option value="real-estate">Real Estate & Properties</option>
            <option value="motors">Motors & Transport</option>
            <option value="marketplace">General Goods Marketplace</option>
            <option value="services">Professional Services</option>
            <option value="jobs">Corporate Jobs & Recruitment</option>
            <option value="kyb">KYB & Compliance</option>
          </select>
        </div>
      </div>

      {/* Agent Roster Table */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#C9A96E] animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Loading Department Roster...
            </p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No agents found for this desk partition</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAFAF7] border-b border-[#E8E2D8] text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 pl-4">Staff Member & Title</th>
                  <th className="py-3.5">Role & Access</th>
                  <th className="py-3.5">Department</th>
                  <th className="py-3.5">Caseload Capacity</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5">Supervisor</th>
                  <th className="py-3.5 text-right pr-4">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]/60">
                {filteredAgents.map((agent) => {
                  const percent = Math.min(
                    100,
                    Math.round((agent.assignedClientCount / (agent.maxClientQuota || 1)) * 100)
                  );
                  return (
                    <tr key={agent.id} className="hover:bg-[#FAFAF7]/80 transition-colors">
                      <td className="py-3 pl-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              agent.profileImageUrl ||
                              `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`
                            }
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover border border-[#E8E2D8]"
                          />
                          <div>
                            <p className="font-bold text-sm text-[#0F1923]">{agent.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{agent.email}</p>
                            <p className="text-[10px] text-[#C9A96E] font-medium">{agent.staffTitle}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F1923] text-white font-mono uppercase">
                          {agent.staffRole.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3">
                        <span className="font-mono text-[11px] uppercase text-slate-600 font-medium">
                          {agent.department}
                        </span>
                      </td>

                      <td className="py-3 w-48">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-bold text-slate-800">{agent.assignedClientCount}</span>
                            <span className="text-slate-400">/ {agent.maxClientQuota} ({percent}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                percent >= 90
                                  ? 'bg-red-500'
                                  : percent > 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            agent.agentStatus === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : agent.agentStatus === 'away'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              agent.agentStatus === 'active'
                                ? 'bg-emerald-500'
                                : agent.agentStatus === 'away'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          />
                          {agent.agentStatus}
                        </span>
                      </td>

                      <td className="py-3">
                        <span className="text-slate-600 text-[11px]">
                          {agent.assignedSupervisorName || 'Executive Suite'}
                        </span>
                      </td>

                      <td className="py-3 text-right pr-4">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Reassign Portfolio Button */}
                          <button
                            title="Reassign Portfolio to another agent"
                            onClick={() => {
                              setReassignModal(agent);
                              setTargetAgentId('');
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0F1923] hover:bg-slate-100 transition-colors"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>

                          {/* Credentials Reset */}
                          <button
                            title="Reset Agent Credentials"
                            onClick={() => {
                              setResetModalAgent(agent);
                              setNewTempPass(`Agent-${Math.random().toString(36).substring(2, 8)}!2026`);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#C9A96E] hover:bg-slate-100 transition-colors"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Status Toggle Dropdown */}
                          <select
                            value={agent.agentStatus}
                            onChange={(e) =>
                              handleToggleStatus(agent, e.target.value as 'active' | 'away' | 'suspended')
                            }
                            className="text-[10px] font-mono py-1 px-1.5 rounded border border-[#E8E2D8] bg-white text-slate-700"
                          >
                            <option value="active">Active</option>
                            <option value="away">Away</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision New Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E8E2D8] space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <h3 className="text-lg font-bold text-[#0F1923] font-serif">
                  Provision New Staff / Agent Account
                </h3>
                <p className="text-xs text-slate-500">
                  Assign role, access permissions, department quota, and generated sign-in credentials.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Miller"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F1923]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="jordan.m@buzzer.com"
                    value={newAgentEmail}
                    onChange={(e) => setNewAgentEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F1923]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Access Role Level *</label>
                  <select
                    value={newAgentRole}
                    onChange={(e) => setNewAgentRole(e.target.value as StaffRole)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-white font-semibold text-slate-800"
                  >
                    <option value="account_exec">Account Executive (Client Care)</option>
                    <option value="support">Tier-2 Support Specialist</option>
                    <option value="moderator">Trust & Safety Moderator</option>
                    <option value="verification">Verification & KYB Officer</option>
                    <option value="department_lead">Department Desk Lead</option>
                    <option value="operations">Regional Operations Manager</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Department Desk *</label>
                  <select
                    value={newAgentDept}
                    onChange={(e) => setNewAgentDept(e.target.value as StaffDepartment)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-white font-semibold text-slate-800"
                  >
                    <option value="real-estate">Real Estate & Properties</option>
                    <option value="motors">Motors & Transport</option>
                    <option value="marketplace">General Goods Marketplace</option>
                    <option value="services">Professional Services</option>
                    <option value="jobs">Corporate Jobs & Recruitment</option>
                    <option value="kyb">KYB & Compliance</option>
                    <option value="general">General Operations</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Staff Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Real Estate Portfolio Lead"
                    value={newAgentTitle}
                    onChange={(e) => setNewAgentTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAFAF7] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Client Quota Capacity
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={2000}
                    value={newAgentQuota}
                    onChange={(e) => setNewAgentQuota(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAFAF7] font-mono focus:bg-white"
                  />
                </div>
              </div>

              {/* Password setup strip */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E8E2D8] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center">
                    <Key className="w-3.5 h-3.5 mr-1 text-[#C9A96E]" />
                    Initial Temporary Access Password
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-[#C9A96E] font-bold hover:underline"
                  >
                    Regenerate Secure Key
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={newAgentPassword}
                  onChange={(e) => setNewAgentPassword(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-[#E8E2D8] bg-white font-bold text-slate-800"
                />
                <p className="text-[10px] text-slate-400">
                  This password will be displayed in the dispatch slip upon submission for the agent's initial login.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0F1923] hover:bg-[#1A3353] text-white disabled:opacity-50 transition-all shadow-md"
                >
                  {createSubmitting ? 'Provisioning...' : 'Provision Agent & Issue Slip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post-Provisioning Credential Dispatch Slip Modal */}
      {credentialSlip && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#C9A96E] space-y-5 animate-scaleUp">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0F1923] font-serif">
                Agent Provisioned Successfully
              </h3>
              <p className="text-xs text-slate-500">
                Dispatch these initial credentials securely to the staff member.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0F1923] text-white font-mono text-xs space-y-2 border border-[#C9A96E]/30">
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Agent Name:</span>
                <span className="font-bold text-white">{credentialSlip.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Login Email:</span>
                <span className="font-bold text-[#C9A96E]">{credentialSlip.email}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Temp Password:</span>
                <span className="font-bold text-emerald-400">{credentialSlip.password}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Access Role:</span>
                <span className="uppercase text-slate-200">{credentialSlip.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Portal Route:</span>
                <span className="text-slate-200">/admin/login</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const text = `BUZZER CRM ACCESS CREDENTIALS\nName: ${credentialSlip.name}\nEmail: ${credentialSlip.email}\nTemporary Password: ${credentialSlip.password}\nRole: ${credentialSlip.role}\nDepartment: ${credentialSlip.department}\nLogin URL: ${window.location.origin}/admin/login`;
                  navigator.clipboard.writeText(text);
                  setCopiedSlip(true);
                  setTimeout(() => setCopiedSlip(false), 2500);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#C9A96E] hover:bg-[#b89758] text-[#0F1923] flex items-center justify-center transition-colors"
              >
                {copiedSlip ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy Credentials Slip
                  </>
                )}
              </button>

              <button
                onClick={() => setCredentialSlip(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Reassignment Modal */}
      {reassignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E2D8] space-y-4">
            <div className="flex items-center space-x-2 text-[#0F1923]">
              <ArrowRightLeft className="w-5 h-5 text-[#C9A96E]" />
              <h3 className="text-base font-bold font-serif">Transfer Client Portfolio</h3>
            </div>
            <p className="text-xs text-slate-500">
              Bulk transfer all <strong className="text-slate-800">{reassignModal.assignedClientCount} accounts</strong> currently assigned to <strong className="text-slate-800">{reassignModal.name}</strong> to another agent.
            </p>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Recipient Staff Agent *
                </label>
                <select
                  required
                  value={targetAgentId}
                  onChange={(e) => setTargetAgentId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-white font-semibold text-slate-800"
                >
                  <option value="">-- Select Recipient Agent --</option>
                  {agents
                    .filter((a) => a.id !== reassignModal.id)
                    .map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} ({ag.department} - {ag.assignedClientCount}/{ag.maxClientQuota} active)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetAgentId || reassignLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F1923] text-white hover:bg-[#1A3353] disabled:opacity-50"
                >
                  {reassignLoading ? 'Transferring...' : 'Execute Full Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Credentials Modal */}
      {resetModalAgent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E2D8] space-y-4">
            <h3 className="text-base font-bold text-[#0F1923] font-serif">
              Reset Credentials for {resetModalAgent.name}
            </h3>
            <p className="text-xs text-slate-500">
              Generate or assign a new temporary password. The agent will be forced to change it upon first login.
            </p>

            <form onSubmit={handleResetCredentialsSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  New Temporary Password
                </label>
                <input
                  type="text"
                  required
                  value={newTempPass}
                  onChange={(e) => setNewTempPass(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAFAF7] font-bold text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalAgent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C9A96E] text-[#0F1923] hover:bg-[#b89758]"
                >
                  Update & Issue Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
