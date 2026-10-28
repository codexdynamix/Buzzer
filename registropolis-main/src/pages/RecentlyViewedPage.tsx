import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingDetailPath } from '@/lib/utils';
import { Clock, ShoppingBag, Briefcase, Building2, Wrench, Calendar, Truck, X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import AppLayout from '@/components/layout/AppLayout';
import { useUserListings } from '@/context/UserListingsContext';
import { useLocalization } from '@/i18n/LocalizationContext';

const SECTION_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  marketplace:   { label: 'Marketplace', icon: ShoppingBag, color: '#C9A96E', bg: '#FDF8F0' },
  jobs:          { label: 'Jobs',         icon: Briefcase,  color: '#1D4ED8', bg: '#EFF6FF' },
  'real-estate': { label: 'Real Estate', icon: Building2,  color: '#15803D', bg: '#F0FDF4' },
  services:      { label: 'Services',    icon: Wrench,     color: '#7C3AED', bg: '#F5F3FF' },
  events:        { label: 'Events',      icon: Calendar,   color: '#B91C1C', bg: '#FEF2F2' },
  transport:     { label: 'Transport',   icon: Truck,      color: '#0F766E', bg: '#F0FDFA' },
};

function getPriceLabel(item: any, section: string): string {
  if (section === 'marketplace') return item.price != null ? `$${item.price.toLocaleString()}` : '';
  if (section === 'jobs') return item.salary ?? '';
  if (section === 'real-estate') return item.priceDisplay ?? '';
  if (section === 'services') return item.rate ?? '';
  if (section === 'events') return item.priceDisplay ?? (item.price === 0 ? 'Free' : item.price != null ? `$${item.price}` : '');
  if (section === 'transport') return item.price != null ? `$${item.price.toLocaleString()}` : '';
  return '';
}

function getSubLabel(item: any, section: string): string {
  if (section === 'marketplace') return `${item.condition ?? ''} · ${item.location ?? ''}`;
  if (section === 'jobs') return `${item.company ?? ''} · ${item.type ?? ''}`;
  if (section === 'real-estate') return `${item.beds ?? ''}bd ${item.baths ?? ''}ba · ${item.address ?? item.location ?? ''}`;
  if (section === 'services') return `${item.category ?? ''} · ${item.location ?? ''}`;
  if (section === 'events') return `${item.date ?? ''} · ${item.location ?? ''}`;
  if (section === 'transport') return `${item.year ?? ''} · ${item.mileage ?? ''} · ${item.location ?? ''}`;
  return item.location ?? '';
}

function getDisplayTitle(item: any): string {
  return item.title ?? item.name ?? '';
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildSuggestions(
  recentItems: { section: string; listing: any }[],
  availableListings: any[],
): { section: string; listing: any }[] {
  if (recentItems.length === 0) {
    return availableListings.slice(0, 8).map(listing => ({ section: listing.section, listing }));
  }

  const viewedIdsBySection: Record<string, Set<string>> = {};
  const sectionCounts: Record<string, number> = {};

  for (const { section, listing } of recentItems) {
    if (!viewedIdsBySection[section]) viewedIdsBySection[section] = new Set();
    viewedIdsBySection[section].add(String(listing.id));
    sectionCounts[section] = (sectionCounts[section] ?? 0) + 1;
  }

  const sortedSections = Object.entries(sectionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([sec]) => sec);

  const PICKS_PER_SECTION = 3;
  const suggestions: { section: string; listing: any }[] = [];

  for (const section of sortedSections) {
    const seenIds = viewedIdsBySection[section] ?? new Set();
    const picks = availableListings
      .filter(item => item.section === section)
      .filter(item => !seenIds.has(String(item.id)))
      .slice(0, PICKS_PER_SECTION);
    for (const listing of picks) {
      suggestions.push({ section, listing });
    }
  }

  return suggestions;
}

function SuggestionStrip({ suggestions }: { suggestions: { section: string; listing: any }[] }) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {suggestions.length > 4 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105"
            style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}
          >
            <ChevronLeft size={15} style={{ color: '#0F1923' }} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105"
            style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}
          >
            <ChevronRight size={15} style={{ color: '#0F1923' }} />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {suggestions.map(({ section, listing }, idx) => {
          const meta = SECTION_META[section] ?? { label: section, icon: Clock, color: '#6E7A8A', bg: '#F5F2EC' };
          const Icon = meta.icon;
          const price = getPriceLabel(listing, section);
          const title = getDisplayTitle(listing);
          const sub = getSubLabel(listing, section);

          return (
            <motion.div
              key={`sugg-${section}-${listing.id}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04, type: 'spring', stiffness: 400, damping: 30 }}
              className="group shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
              style={{ width: 172, backgroundColor: '#fff', border: '1px solid #E8E2D8' }}
              onClick={() => navigate(listingDetailPath(section, listing.id, listing), { state: { listing } })}
            >
              <div className="relative overflow-hidden" style={{ height: 120, backgroundColor: '#F5F2EC' }}>
                <img
                  src={listing.image}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'; }}
                />
                <div
                  className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: meta.bg, border: `1px solid ${meta.color}22` }}
                >
                  <Icon size={8} style={{ color: meta.color }} />
                  <span className="text-[8px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
                </div>
              </div>
              <div className="p-2.5 space-y-0.5">
                <p className="text-[11px] font-bold leading-snug line-clamp-2" style={{ color: '#0F1923' }}>{title}</p>
                {price && (
                  <p className="text-[11px] font-bold" style={{ color: '#C9A96E' }}>{price}</p>
                )}
                <p className="text-[9px] leading-tight line-clamp-1" style={{ color: '#6E7A8A' }}>{sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const ALL = 'all';

export default function RecentlyViewedPage() {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { getAllListings } = useUserListings();
  const { recentItems, recentCount, clearRecent } = useRecentlyViewed();
  const [activeSection, setActiveSection] = useState(ALL);
  const allListings = getAllListings();

  const sections = [...new Set(recentItems.map(i => i.section))];

  const displayed = activeSection === ALL
    ? recentItems
    : recentItems.filter(i => i.section === activeSection);

  const suggestions = useMemo(
    () => buildSuggestions(recentItems, allListings),
    [recentItems, allListings],
  );

  return (
    <AppLayout withSidebar maxWidth="2xl">
      <div className="section-padding">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#F0F4FF', border: '1px solid #C7D7F8' }}>
              <Clock size={18} style={{ color: '#1D4ED8' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>{t('Recently viewed')}</h1>
              <p className="text-sm" style={{ color: '#6E7A8A' }}>
                {recentCount === 0 ? 'No listings viewed yet' : `${recentCount} listing${recentCount !== 1 ? 's' : ''} viewed`}
              </p>
            </div>
          </div>

          {recentCount > 0 && (
            <button
              onClick={clearRecent}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
              style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A', border: '1px solid #E8E2D8' }}
            >
              <X size={12} />
              Clear all
            </button>
          )}
        </div>

        {/* ── Section filter chips ── */}
        {sections.length > 1 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setActiveSection(ALL)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: activeSection === ALL ? '#0F1923' : '#F5F2EC',
                color: activeSection === ALL ? '#FAFAF7' : '#6E7A8A',
                border: '1px solid',
                borderColor: activeSection === ALL ? '#0F1923' : '#E8E2D8',
              }}
            >
              All · {recentCount}
            </button>
            {sections.map(sec => {
              const meta = SECTION_META[sec];
              const count = recentItems.filter(i => i.section === sec).length;
              const isActive = activeSection === sec;
              return (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: isActive ? meta.color : '#F5F2EC',
                    color: isActive ? '#fff' : '#6E7A8A',
                    border: '1px solid',
                    borderColor: isActive ? meta.color : '#E8E2D8',
                  }}
                >
                  {meta.label} · {count}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Empty state ── */}
        {recentCount === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4" style={{ backgroundColor: '#F5F2EC', border: '1px solid #E8E2D8' }}>
              <Clock size={28} style={{ color: '#E8E2D8' }} />
            </div>
            <p className="text-base font-bold mb-1" style={{ color: '#0F1923' }}>{t('Nothing viewed yet')}</p>
            <p className="text-sm mb-6 max-w-xs" style={{ color: '#6E7A8A' }}>
              Listings you tap into will appear here so you can easily pick up where you left off.
            </p>
            <button
              onClick={() => navigate('/dashboard/marketplace')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: '#0F1923', color: '#FAFAF7' }}
            >
              Browse Marketplace
            </button>
          </div>
        )}

        {/* ── Recently viewed grid ── */}
        {displayed.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {displayed.map(({ section, listing, viewedAt }) => {
                const meta = SECTION_META[section] ?? { label: section, icon: Clock, color: '#6E7A8A', bg: '#F5F2EC' };
                const Icon = meta.icon;
                const price = getPriceLabel(listing, section);
                const sub = getSubLabel(listing, section);
                const title = getDisplayTitle(listing);

                return (
                  <motion.div
                    key={`${section}-${listing.id}-${viewedAt}`}
                    layout
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="group relative rounded-2xl overflow-hidden cursor-pointer"
                    style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}
                    onClick={() => navigate(listingDetailPath(section, listing.id, listing), { state: { listing } })}
                  >
                    <div className="relative overflow-hidden" style={{ height: 160, backgroundColor: '#F5F2EC' }}>
                      <img
                        src={listing.image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'; }}
                      />
                      <div
                        className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: meta.bg, border: `1px solid ${meta.color}22` }}
                      >
                        <Icon size={9} style={{ color: meta.color }} />
                        <span className="text-[9px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
                      </div>
                      <div
                        className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(15,25,35,0.6)', backdropFilter: 'blur(4px)' }}
                      >
                        <Clock size={8} style={{ color: '#fff' }} />
                        <span className="text-[9px] font-semibold" style={{ color: '#fff' }}>{timeAgo(viewedAt)}</span>
                      </div>
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-xs font-bold leading-snug line-clamp-2" style={{ color: '#0F1923' }}>{title}</p>
                      {price && (
                        <p className="text-xs font-bold" style={{ color: '#C9A96E' }}>{price}</p>
                      )}
                      <p className="text-[10px] leading-tight line-clamp-1" style={{ color: '#6E7A8A' }}>{sub}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* ── You may also like ── */}
        {suggestions.length > 0 && (
          <div className="mt-10">
            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <Sparkles size={13} style={{ color: '#B45309' }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold" style={{ color: '#0F1923', letterSpacing: '-0.02em' }}>You may also like</h2>
                  <p className="text-[11px]" style={{ color: '#6E7A8A' }}>
                    Based on your browsing across {sections.length > 0 ? sections.length : 'multiple'} {sections.length === 1 ? 'category' : 'categories'}
                  </p>
                </div>
              </div>
              <div className="flex-1 h-px" style={{ backgroundColor: '#F0EBE1' }} />
            </div>

            <SuggestionStrip suggestions={suggestions} />
          </div>
        )}

        {/* Show live listings when there is no browsing history yet. */}
        {recentCount === 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <Sparkles size={13} style={{ color: '#B45309' }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold" style={{ color: '#0F1923', letterSpacing: '-0.02em' }}>Latest listings</h2>
                  <p className="text-[11px]" style={{ color: '#6E7A8A' }}>Recently posted on the platform</p>
                </div>
              </div>
              <div className="flex-1 h-px" style={{ backgroundColor: '#F0EBE1' }} />
            </div>
            {suggestions.length > 0
              ? <SuggestionStrip suggestions={suggestions} />
              : <p className="text-sm" style={{ color: '#6E7A8A' }}>No listings are available yet.</p>}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
