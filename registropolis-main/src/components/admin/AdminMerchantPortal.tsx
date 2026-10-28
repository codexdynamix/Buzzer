import React, { useState, useEffect, useCallback } from 'react';
import { 
  Megaphone, 
  TrendingUp, 
  Eye, 
  MousePointerClick, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  Search,
  ExternalLink,
  Store,
  Phone,
  Mail,
  MapPin,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

export interface MerchantItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  location: string;
  phone: string;
  email: string;
  image: string;
  isSponsored: boolean;
  adHeadline?: string;
  adTag?: string;
  impressions: number | null;
  clicks: number | null;
  ctr: string | null;
  leadsGenerated: number | null;
  tier: string;
}

export const AdminMerchantPortal: React.FC = () => {
  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'sponsored' | 'standard'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchMerchants = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/crm/merchants', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setMerchants(data.merchants || []);
      }
    } catch {
      toast.error('Failed to load merchant data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const toggleSponsor = async (merchantId: string) => {
    try {
      const res = await fetch(`/api/businesses/${merchantId}/sponsor`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({
          adTag: 'Sponsored Partner',
          adHeadline: 'Featured Community Partner • Verified Buzzer Merchant',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Updated merchant ad status');
        setMerchants(prev => prev.map(m => m.id === merchantId ? { ...m, isSponsored: data.isSponsored } : m));
      }
    } catch {
      toast.error('Failed to toggle merchant ad tier');
    }
  };

  const filteredMerchants = merchants.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                          m.category.toLowerCase().includes(search.toLowerCase()) ||
                          m.location.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterTier === 'sponsored') return m.isSponsored;
    if (filterTier === 'standard') return !m.isSponsored;
    return true;
  });

  const sponsoredCount = merchants.filter(m => m.isSponsored).length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#162C48]/40 border border-[#E8E2D8]/20 rounded-2xl p-5 backdrop-blur-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Store size={14} className="text-[#C9A96E]" /> Total Businesses
          </div>
          <div className="text-2xl font-bold text-white">{merchants.length} Active</div>
          <div className="text-xs text-slate-400 mt-1">Across 6 local districts</div>
        </div>

        <div className="bg-[#162C48]/40 border border-[#E8E2D8]/20 rounded-2xl p-5 backdrop-blur-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#C9A96E]" /> Sponsored Partners
          </div>
          <div className="text-2xl font-bold text-[#C9A96E]">{sponsoredCount} Promoted</div>
          <div className="text-xs text-slate-400 mt-1">Receiving premium home placement</div>
        </div>

        <div className="bg-[#162C48]/40 border border-[#E8E2D8]/20 rounded-2xl p-5 backdrop-blur-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Eye size={14} className="text-blue-400" /> Ad Impressions (30d)
          </div>
          <div className="text-2xl font-bold text-white">Not tracked</div>
          <div className="text-xs text-slate-400 mt-1">Impression analytics are not connected</div>
        </div>

        <div className="bg-[#162C48]/40 border border-[#E8E2D8]/20 rounded-2xl p-5 backdrop-blur-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <MousePointerClick size={14} className="text-emerald-400" /> Customer Actions
          </div>
          <div className="text-2xl font-bold text-emerald-400">Not tracked</div>
          <div className="text-xs text-slate-400 mt-1">Lead attribution is not connected</div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-[#162C48]/40 border border-[#E8E2D8]/20 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search business, merchant or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0F1923] border border-slate-700 text-slate-200 text-xs rounded-xl focus:border-[#C9A96E] outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTier('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterTier === 'all' ? 'bg-[#C9A96E] text-[#0F1923]' : 'bg-[#0F1923] text-slate-300'
            }`}
          >
            All Merchants ({merchants.length})
          </button>
          <button
            onClick={() => setFilterTier('sponsored')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterTier === 'sponsored' ? 'bg-[#C9A96E] text-[#0F1923]' : 'bg-[#0F1923] text-slate-300'
            }`}
          >
            Sponsored Only ({sponsoredCount})
          </button>
        </div>
      </div>

      {/* Merchants Table */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">Loading merchant Extranet data...</div>
      ) : (
        <div className="bg-[#162C48]/40 border border-[#E8E2D8]/20 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-[#0F1923]/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-3.5">Business & Category</th>
                  <th className="p-3.5">Location & Contact</th>
                  <th className="p-3.5">Impression Reach</th>
                  <th className="p-3.5">Clicks / Inquiries</th>
                  <th className="p-3.5">CTR Rate</th>
                  <th className="p-3.5">Partner Tier</th>
                  <th className="p-3.5 text-right">Ad Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMerchants.map(merchant => (
                  <tr key={merchant.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img 
                          src={merchant.image} 
                          alt="" 
                          className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            {merchant.name}
                            {merchant.isSponsored && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
                            )}
                          </div>
                          <div className="text-[#C9A96E] text-[11px] font-medium">{merchant.category}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-300">
                      <div className="flex items-center gap-1 text-[11px]">
                        <MapPin size={11} className="text-slate-400" /> {merchant.location}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Phone size={10} /> {merchant.phone}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-200">
                      {merchant.impressions === null ? 'Not tracked' : `${merchant.impressions.toLocaleString()} views`}
                    </td>

                    <td className="p-3.5 font-mono text-emerald-400">
                      {merchant.clicks === null ? 'Not tracked' : `${merchant.clicks} leads`}
                    </td>

                    <td className="p-3.5 font-mono text-slate-200">
                      {merchant.ctr ?? '—'}
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        merchant.isSponsored 
                          ? 'bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/40' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {merchant.tier}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => toggleSponsor(merchant.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          merchant.isSponsored
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                        }`}
                      >
                        {merchant.isSponsored ? 'Demote to Standard' : 'Boost to Sponsored'}
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
