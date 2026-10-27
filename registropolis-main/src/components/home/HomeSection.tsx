import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, MapPin, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import StoriesStrip from '@/components/social/StoriesStrip';
import { listingDetailPath } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useUserListings } from '@/context/UserListingsContext';
import { businessesAPI } from '@/services/apiService';

const SECTION_META: Record<string, { bg: string; text: string; label: string }> = {
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

const RANK_COLORS = ['#C9A96E', '#9CA3AF', '#CD7F32'];

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

export default function HomeSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getAllListings } = useUserListings();
  const [activeCategory, setActiveCategory] = useState('all');
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

  const categories = useMemo(
    () => [...new Set(listings.map(item => item.section))],
    [listings],
  );

  const filtered = activeCategory === 'all'
    ? listings
    : listings.filter(item => item.section === activeCategory);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const featured = filtered.slice(0, 3);

  const goTo = (item: any) => navigate(
    listingDetailPath(item.section, item.id, item),
    { state: { listing: item } },
  );

  return (
    <div className="section-padding space-y-8">
      <div>
        <div className="gold-accent mb-3" />
        <h1 className="text-2xl font-bold" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>
          {greeting}{user?.name ? `, ${user.name}` : ''} 👋
        </h1>
        {user?.location && (
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin size={13} style={{ color: '#C9A96E' }} />
            <span className="text-sm" style={{ color: '#6E7A8A' }}>{user.location}</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1 w-4 rounded-full" style={{ backgroundColor: '#C9A96E' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6E7A8A' }}>Stories</span>
        </div>
        <StoriesStrip />
      </div>

      <section
        className="rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, #0F1923 0%, #1A3353 100%)',
          border: '1px solid rgba(201,169,110,0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Flame size={18} style={{ color: '#C9A96E' }} />
          <h2 className="text-lg font-bold" style={{ color: '#FAFAF7', letterSpacing: '-0.02em' }}>
            Latest listings
          </h2>
        </div>
        <p className="text-sm mb-5" style={{ color: 'rgba(250,250,247,0.5)' }}>
          Recently posted by your community
        </p>
        {featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {featured.map((item, index) => (
              <button
                key={`${item.section}-${item.id}`}
                onClick={() => goTo(item)}
                className="text-left rounded-xl p-3.5 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
                onMouseEnter={event => { event.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={event => { event.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-xs font-bold" style={{ color: RANK_COLORS[index] }}>#{index + 1}</span>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(201,169,110,0.15)', color: '#C9A96E' }}
                  >
                    {SECTION_META[item.section]?.label ?? item.section}
                  </span>
                </div>
                <p className="text-xs font-semibold leading-snug line-clamp-2 mb-1" style={{ color: '#FAFAF7' }}>
                  {item.title}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(250,250,247,0.6)' }}>
                  {[formatPrice(item), item.location].filter(Boolean).join(' · ')}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm py-4" style={{ color: 'rgba(250,250,247,0.65)' }}>
            No listings have been posted yet.
          </p>
        )}
      </section>

      {/* ── Dynamic Sponsored Advertisements (from Database) ── */}
      {sponsoredAds.length > 0 && (
        <div className="rounded-2xl p-5 border border-amber-200 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Featured Community Advertisements</span>
            </div>
            <button
              onClick={() => navigate('/dashboard/business')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors"
            >
              All Advertisements <ChevronRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sponsoredAds.slice(0, 3).map((ad) => (
              <div
                key={ad.id}
                onClick={() => navigate('/dashboard/business')}
                className="cursor-pointer group flex gap-3 p-3 rounded-xl border border-amber-100 bg-white hover:border-amber-300 hover:shadow-sm transition-all"
              >
                <img
                  src={ad.image}
                  alt={ad.name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#0F1923] truncate">{ad.name}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800 shrink-0">AD</span>
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium line-clamp-1 mt-0.5">
                    {ad.adHeadline || ad.category}
                  </p>
                  <p className="text-[10px] text-[#6E7A8A] truncate mt-1">
                    {ad.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {['all', ...categories].map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: activeCategory === category ? '#1A3353' : '#F5F2EC',
                color: activeCategory === category ? '#FAFAF7' : '#6E7A8A',
                border: `1px solid ${activeCategory === category ? 'transparent' : '#E8E2D8'}`,
              }}
            >
              {category === 'all' ? 'All' : SECTION_META[category]?.label ?? category}
            </button>
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => {
            const section = SECTION_META[item.section] ?? { bg: '#F5F2EC', text: '#6E7A8A', label: item.section };
            return (
              <button
                key={`${item.section}-${item.id}`}
                onClick={() => goTo(item)}
                className="group text-left rounded-2xl overflow-hidden transition-all"
                style={{ border: '1px solid #E8E2D8', background: '#fff' }}
              >
                {item.image && (
                  <div className="relative" style={{ paddingBottom: '62%' }}>
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-3.5 space-y-1.5">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: section.bg, color: section.text }}
                  >
                    {section.label}
                  </span>
                  <p className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: '#0F1923' }}>
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold" style={{ color: '#C9A96E' }}>{formatPrice(item)}</span>
                    {item.location && (
                      <span className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>{item.location}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <TrendingUp size={40} style={{ color: '#E8E2D8' }} />
          <p className="text-sm" style={{ color: '#6E7A8A' }}>No listings in this category yet.</p>
        </div>
      )}
    </div>
  );
}
