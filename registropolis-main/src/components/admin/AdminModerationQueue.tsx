import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Filter, 
  Tag, 
  DollarSign, 
  MapPin, 
  User, 
  Sparkles,
  ExternalLink,
  Layers,
  CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { adminCRMAPI } from '@/services/apiService';

export interface ModerationItem {
  id: string;
  section: string;
  userId: string;
  status: string;
  createdAt: string;
  seller: string;
  sellerAvatar?: string;
  activeRestrictionCount: number;
  riskScore: number | null;
  riskFlags: string[];
  riskSummary: string;
  data: {
    image?: string;
    title?: string;
    name?: string;
    price?: string | number;
    salary?: string | number;
    location?: string;
    description?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

export const AdminModerationQueue: React.FC = () => {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVertical, setSelectedVertical] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'speed' | 'table'>('speed');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cannedReason, setCannedReason] = useState('Violates platform community pricing/authenticity guidelines');

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminCRMAPI.getModerationQueue();
      if (data.success) {
        setItems((data.items as ModerationItem[] | undefined) || []);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load moderation queue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Filter items by vertical
  const filteredItems = items.filter(item => {
    if (selectedVertical === 'all') return true;
    return item.section === selectedVertical;
  });

  const currentItem = filteredItems[currentIndex];

  const handleDecision = async (listingId: string, decision: 'approve' | 'reject' | 'flag', reason?: string) => {
    try {
      const data = await adminCRMAPI.decideModeration({ listingId, decision, reason: reason || cannedReason });
      if (data.success) {
        toast.success(
          decision === 'approve' 
            ? 'Listing approved & published' 
            : decision === 'reject' 
              ? 'Listing rejected & archived' 
              : 'Listing escalated to supervisor'
        );
        // Remove from local queue
        setItems(prev => prev.filter(i => i.id !== listingId));
        if (currentIndex >= filteredItems.length - 1 && currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      }
    } catch (err) {
      toast.error('Failed to submit moderation decision');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    try {
      const data = await adminCRMAPI.bulkDecideModeration({ listingIds: Array.from(selectedIds), decision: 'approve' });
      if (data.success) {
        toast.success(data.message || `Batch processed ${data.modifiedCount} listings`);
        const modified = new Set<string>(data.modifiedIds || []);
        setItems(prev => prev.filter(item => !modified.has(item.id)));
        setSelectedIds(new Set(data.failedIds || []));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk approval failed');
    }
  };

  // Keyboard shortcut listener (A = Approve, R = Reject, F = Flag)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (!currentItem) return;

      if (e.key === 'a' || e.key === 'A') {
        handleDecision(currentItem.id, 'approve');
      } else if (e.key === 'r' || e.key === 'R') {
        handleDecision(currentItem.id, 'reject');
      } else if (e.key === 'f' || e.key === 'F') {
        handleDecision(currentItem.id, 'flag');
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < filteredItems.length - 1) setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentItem, currentIndex, filteredItems.length]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#162C48] border border-[#E8E2D8]/20 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/20 text-[#C9A96E] flex items-center justify-center font-bold">
            ⚡
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">OLX-Style Speed Triage Queue</h3>
            <p className="text-xs text-slate-300">
              High-velocity human review pipeline with automated fraud and pricing outlier detection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Vertical filter */}
          <div className="flex items-center gap-1 bg-[#0F1923] p-1 rounded-xl border border-slate-700">
            {['all', 'marketplace', 'real-estate', 'job', 'transport', 'service'].map((sec) => (
              <button
                key={sec}
                onClick={() => { setSelectedVertical(sec); setCurrentIndex(0); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                  selectedVertical === sec 
                    ? 'bg-[#C9A96E] text-[#0F1923] font-bold shadow' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {sec === 'all' ? 'All' : sec.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#0F1923] p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('speed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                viewMode === 'speed' ? 'bg-[#1A3353] text-[#C9A96E]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Speed Deck
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                viewMode === 'table' ? 'bg-[#1A3353] text-[#C9A96E]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Batch Table ({filteredItems.length})
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">Loading moderation stream...</div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-[#162C48] border border-emerald-500/30 rounded-2xl p-12 text-center text-white space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCheck size={28} />
          </div>
          <h4 className="text-xl font-bold">Queue is Clean!</h4>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            All submitted listings for this vertical have been reviewed according to community guidelines.
          </p>
          <button 
            onClick={fetchQueue}
            className="px-4 py-2 bg-[#1A3353] hover:bg-[#203e65] text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            Refresh Stream
          </button>
        </div>
      ) : viewMode === 'speed' ? (
        /* Speed Deck Review Mode */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Inspection Card (7 cols) */}
          <div className="lg:col-span-8 bg-[#162C48] border border-[#E8E2D8]/20 rounded-2xl overflow-hidden shadow-xl">
            {/* Item Header */}
            <div className="p-5 border-b border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-[#C9A96E]/20 text-[#C9A96E] font-bold text-xs uppercase tracking-wider rounded-md">
                  {currentItem.section}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {currentItem.id}
                </span>
                <span className="text-xs text-slate-400">
                  • Posted {new Date(currentItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-xs text-slate-300">
                Item <span className="text-[#C9A96E] font-bold">{currentIndex + 1}</span> of {filteredItems.length}
              </div>
            </div>

            {/* Automated Risk Alert Banner */}
            <div className={`p-4 border-b flex items-start gap-3 ${
              currentItem.riskScore !== null && currentItem.riskScore > 75
                ? 'bg-red-950/40 border-red-800/60 text-red-200' 
                : currentItem.riskScore !== null && currentItem.riskScore > 50
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                  : 'bg-slate-900 border-slate-700/60 text-slate-200'
            }`}>
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">
                    {currentItem.riskScore === null ? 'No automated risk assessment' : `Automated Risk Score: ${currentItem.riskScore}/100`}
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {currentItem.riskFlags.map((flag, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[10px] font-mono font-bold bg-black/40 rounded-full">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  {currentItem.riskSummary}
                </p>
              </div>
            </div>

            {/* Content Preview */}
            <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Visual Image */}
                {currentItem.data?.image && (
                  <div className="w-full md:w-64 h-48 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-slate-700">
                    <img 
                      src={currentItem.data.image} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {/* Title & Metadata */}
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-bold text-white leading-tight">
                    {currentItem.data?.title || currentItem.data?.name || 'Untitled Listing'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-[#C9A96E] font-semibold">
                    <span className="flex items-center gap-1 text-base">
                      <DollarSign size={16} />
                      {currentItem.data?.price || currentItem.data?.salary || 'Contact for price'}
                    </span>
                    {currentItem.data?.location && (
                      <span className="flex items-center gap-1 text-slate-300 font-normal text-xs">
                        <MapPin size={13} /> {currentItem.data.location}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed bg-[#0F1923] p-4 rounded-xl border border-slate-800">
                    {currentItem.data?.description || 'No description provided.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer with Hotkey Legend */}
            <div className="p-4 bg-[#0F1923] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-slate-200">[A]</span> Approve
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-slate-200 ml-2">[R]</span> Reject
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-slate-200 ml-2">[F]</span> Escalate
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono font-bold text-slate-200 ml-2">[←/→]</span> Browse
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDecision(currentItem.id, 'reject')}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle size={15} /> Reject [R]
                </button>
                <button
                  onClick={() => handleDecision(currentItem.id, 'flag')}
                  className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle size={15} /> Escalate [F]
                </button>
                <button
                  onClick={() => handleDecision(currentItem.id, 'approve')}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={15} /> Approve & Publish [A]
                </button>
              </div>
            </div>
          </div>

          {/* Seller & Context Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Poster Reputation */}
            <div className="bg-[#162C48] border border-[#E8E2D8]/20 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <User size={15} className="text-[#C9A96E]" /> Poster Profile & Trust History
              </h4>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border border-[#C9A96E]/40 shrink-0">
                  {currentItem.sellerAvatar ? (
                    <img src={currentItem.sellerAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                      {currentItem.seller[0]}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{currentItem.seller}</div>
                  <div className="text-[11px] text-slate-400">Contact details hidden for moderation</div>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-700/60 pt-3">
                <div className="flex justify-between text-slate-300">
                  <span>Account Trust Rating:</span>
                  <span className="font-bold text-slate-200">
                    {currentItem.riskScore === null ? 'Not assessed' : `${currentItem.riskScore} risk score`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Active restrictions:</span>
                  <span className="font-bold text-slate-200">{currentItem.activeRestrictionCount}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Community Longevity:</span>
                  <span className="font-bold text-slate-200">Active Member</span>
                </div>
              </div>
            </div>

            {/* Canned Rejection Reason Presets */}
            <div className="bg-[#162C48] border border-[#E8E2D8]/20 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-white mb-2">Rejection Pre-set Template</h4>
              <select
                value={cannedReason}
                onChange={(e) => setCannedReason(e.target.value)}
                className="w-full bg-[#0F1923] border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 mb-2"
              >
                <option value="Violates platform community pricing/authenticity guidelines">Price Outlier / Authenticity Concern</option>
                <option value="Contains external contact info or escrow bypass attempt">External Contact / Escrow Bypass</option>
                <option value="Duplicate image or copyright reproduction detected">Duplicate Image / Stolen Photo</option>
                <option value="Prohibited item or regulated service category">Prohibited Item / Service Category</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Selecting a canned reason will automatically notify the seller via in-app message with policy details.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Batch Table Mode */
        <div className="bg-[#162C48] border border-[#E8E2D8]/20 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div className="text-xs text-slate-300">
              Selected <span className="font-bold text-[#C9A96E]">{selectedIds.size}</span> listings
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkApprove}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Bulk Approve Selected ({selectedIds.size})
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-[#0F1923] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(new Set(filteredItems.map(i => i.id)));
                        else setSelectedIds(new Set());
                      }}
                    />
                  </th>
                  <th className="p-3">Vertical</th>
                  <th className="p-3">Title & Price</th>
                  <th className="p-3">Poster</th>
                  <th className="p-3">Risk Assessment</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => {
                          const next = new Set(selectedIds);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          setSelectedIds(next);
                        }}
                      />
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#C9A96E]/20 text-[#C9A96E] rounded font-bold capitalize">
                        {item.section}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white">
                      <div>{item.data?.title || item.data?.name}</div>
                      <div className="text-[11px] text-[#C9A96E]">{item.data?.price || item.data?.salary}</div>
                    </td>
                    <td className="p-3">
                      <div>{item.seller}</div>
                      <div className="text-slate-400 text-[10px]">Contact details hidden</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          item.riskScore !== null && item.riskScore > 75 ? 'bg-red-950 text-red-300' : 'bg-amber-950 text-amber-300'
                        }`}>
                          {item.riskScore === null ? 'Not scored' : `Score: ${item.riskScore}`}
                        </span>
                        <span className="text-[11px] text-slate-300 truncate max-w-xs">{item.riskSummary}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => handleDecision(item.id, 'approve')}
                        className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/60 text-emerald-300 rounded text-[11px] font-bold cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecision(item.id, 'reject')}
                        className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600/60 text-red-300 rounded text-[11px] font-bold cursor-pointer"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
