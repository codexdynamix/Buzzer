import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Briefcase, Wrench, Home, Truck, Calendar,
  ArrowRight, Sparkles, MapPin, CheckCircle2, QrCode, Store
} from 'lucide-react';
import { useUserListings } from '@/context/UserListingsContext';
import { listingDetailPath } from '@/lib/utils';
import { businessesAPI } from '@/services/apiService';
import { useLocalization } from '@/i18n/LocalizationContext';

const SECTORS = [
  { id: 'all', label: 'All Postings' },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { id: 'job', label: 'Careers & Jobs', icon: Briefcase },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'real-estate', label: 'Real Estate', icon: Home },
  { id: 'transport', label: 'Transport', icon: Truck },
  { id: 'events', label: 'Events', icon: Calendar },
];

const SECTOR_META: Record<string, { bg: string; text: string; label: string }> = {
  marketplace: { bg: '#FFF7ED', text: '#C2410C', label: 'Marketplace' },
  job: { bg: '#F0FDF4', text: '#15803D', label: 'Jobs' },
  jobs: { bg: '#F0FDF4', text: '#15803D', label: 'Jobs' },
  'real-estate': { bg: '#EFF6FF', text: '#1D4ED8', label: 'Real Estate' },
  transport: { bg: '#F5F3FF', text: '#7C3AED', label: 'Transport' },
  event: { bg: '#FDF2F8', text: '#BE185D', label: 'Events' },
  events: { bg: '#FDF2F8', text: '#BE185D', label: 'Events' },
  service: { bg: '#ECFDF5', text: '#047857', label: 'Services' },
  services: { bg: '#ECFDF5', text: '#047857', label: 'Services' },
};

function formatPrice(item: any): string {
  if (item.priceDisplay) return item.priceDisplay;
  if (item.salary) return item.salary;
  if (item.rate) return item.rate;
  if (typeof item.price === 'number') {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: item.currency ?? 'USD',
      maximumFractionDigits: 0,
    }).format(item.price);
  }
  return '';
}

export default function LandingCommunityShowcase() {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { getAllListings } = useUserListings();
  const [activeSector, setActiveSector] = useState('all');
  const [sponsoredAds, setSponsoredAds] = useState<any[]>([]);

  useEffect(() => {
    businessesAPI.getAdvertisements()
      .then(res => setSponsoredAds(res.advertisements || res.data || []))
      .catch(() => {});
  }, []);

  const listings = useMemo(
    () => getAllListings()
      .filter(item => item.title)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [getAllListings],
  );

  const filteredListings = useMemo(() => {
    if (activeSector === 'all') return listings.slice(0, 8);
    const matches = listings.filter(item => {
      if (activeSector === 'job') return item.section === 'job' || item.section === 'jobs';
      if (activeSector === 'services') return item.section === 'services' || item.section === 'service';
      if (activeSector === 'events') return item.section === 'events' || item.section === 'event';
      return item.section === activeSector;
    });
    return matches.slice(0, 8);
  }, [listings, activeSector]);

  const handleCardClick = (item: any) => {
    navigate(listingDetailPath(item.section, item.id, item), { state: { listing: item } });
  };

  return (
    <div className="space-y-8">
      {/* Category Pills Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {SECTORS.map(sec => {
            const active = activeSector === sec.id;
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSector(sec.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  active
                    ? 'bg-[#1A3353] text-[#FAFAF7] shadow-sm'
                    : 'bg-white border border-[#E8E2D8] text-[#6E7A8A] hover:border-[#C9A96E] hover:text-[#0F1923]'
                }`}
              >
                {Icon && <Icon size={13} className={active ? 'text-[#C9A96E]' : ''} />}
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => navigate(`/dashboard/${activeSector === 'all' ? 'marketplace' : activeSector}`)}
          className="text-xs font-bold text-[#C9A96E] hover:underline flex items-center gap-1"
        >
          View all in {activeSector === 'all' ? 'catalog' : activeSector} <ArrowRight size={13} />
        </button>
      </div>

      {/* Grid of Listings */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredListings.map(item => {
            const meta = SECTOR_META[item.section] ?? { bg: '#F5F2EC', text: '#6E7A8A', label: item.section };
            return (
              <div
                key={`${item.section}-${item.id}`}
                onClick={() => handleCardClick(item)}
                className="group cursor-pointer rounded-2xl bg-white border border-[#E8E2D8] hover:border-[#C9A96E] overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-[#F5F2EC] overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#9CA3AF]">
                      <ShoppingBag size={28} className="opacity-40" />
                    </div>
                  )}
                  <span
                    className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm"
                    style={{ backgroundColor: meta.bg, color: meta.text }}
                  >
                    {meta.label}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-semibold text-xs leading-snug line-clamp-2 text-[#0F1923] group-hover:text-[#1A3353]">
                      {item.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#C9A96E]">
                      {formatPrice(item) || 'Contact for price'}
                    </span>
                    {item.location && (
                      <span className="text-[11px] text-[#9CA3AF] truncate flex items-center gap-0.5">
                        <MapPin size={10} /> {item.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center rounded-2xl bg-white border border-[#E8E2D8]">
          <p className="text-sm text-[#6E7A8A]">No listings posted in this sector yet.</p>
        </div>
      )}

      {/* Sponsored Ads Strip if available */}
      {sponsoredAds.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-white to-amber-500/5 border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Featured Local Community Sponsors
              </span>
            </div>
            <button
              onClick={() => navigate('/dashboard/business?tab=ads')}
              className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
            >
              Browse All Sponsors <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sponsoredAds.slice(0, 3).map(ad => (
              <div
                key={ad.id}
                onClick={() => navigate('/dashboard/business?tab=ads')}
                className="cursor-pointer p-3 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:shadow-sm transition-all flex items-center gap-3"
              >
                <img
                  src={ad.image}
                  alt={ad.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs text-[#0F1923] truncate">{ad.name}</span>
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 rounded">AD</span>
                  </div>
                  <p className="text-[11px] text-[#6E7A8A] truncate">{ad.adHeadline || ad.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seller Callout Banner */}
      <div className="p-6 rounded-2xl bg-[#0F1923] text-white border border-[#C9A96E]/30 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] text-[11px] font-bold tracking-wider uppercase">
            <Store size={12} /> Sell Local
          </div>
          <h3 className="text-lg font-bold text-[#FAFAF7]">
            Have something to sell, rent, or offer?
          </h3>
          <p className="text-xs text-[#FAFAF7]/70 max-w-xl">
            0% commission, instant custom storefront URL, scannable counter QR codes, and direct in-app buyer chat.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/dashboard/my-listings')}
            className="px-5 py-2.5 rounded-xl bg-[#C9A96E] hover:bg-[#ba965c] text-[#0F1923] text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <span>+ Post Free Listing</span> <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
