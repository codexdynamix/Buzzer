import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingDetailPath } from '@/lib/utils';
import { Heart, ShoppingBag, Briefcase, Building2, Wrench, Calendar, Truck, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSaved } from '@/context/SavedContext';
import { useLocalization } from '@/i18n/LocalizationContext';
import AppLayout from '@/components/layout/AppLayout';

const SECTION_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  marketplace:  { label: 'Marketplace',  icon: ShoppingBag, color: '#C9A96E', bg: '#FDF8F0' },
  jobs:         { label: 'Jobs',          icon: Briefcase,   color: '#1D4ED8', bg: '#EFF6FF' },
  'real-estate':{ label: 'Real Estate',  icon: Building2,   color: '#15803D', bg: '#F0FDF4' },
  services:     { label: 'Services',     icon: Wrench,      color: '#7C3AED', bg: '#F5F3FF' },
  events:       { label: 'Events',       icon: Calendar,    color: '#B91C1C', bg: '#FEF2F2' },
  transport:    { label: 'Transport',    icon: Truck,       color: '#0F766E', bg: '#F0FDFA' },
};

function getPriceLabel(item: any, section: string): string {
  if (section === 'marketplace') return `$${item.price?.toLocaleString()}`;
  if (section === 'jobs') return item.salary ?? '';
  if (section === 'real-estate') return item.priceDisplay ?? '';
  if (section === 'services') return item.rate ?? '';
  if (section === 'events') return item.priceDisplay ?? (item.price === 0 ? 'Free' : `$${item.price}`);
  if (section === 'transport') return `$${item.price?.toLocaleString()}`;
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

const ALL = 'all';

export default function SavedListingsPage() {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { savedItems, removeSaved, savedCount } = useSaved();
  const [activeSection, setActiveSection] = useState(ALL);

  const sections = [...new Set(savedItems.map(i => i.section))];

  const displayed = activeSection === ALL
    ? savedItems
    : savedItems.filter(i => i.section === activeSection);

  return (
    <AppLayout withSidebar maxWidth="2xl">
      <div className="section-padding">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#FDF8F0', border: '1px solid #E8E2D8' }}>
            <Heart size={18} style={{ color: '#C9A96E' }} className={savedCount > 0 ? 'fill-[#C9A96E]' : ''} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>{t('Saved')}</h1>
            <p className="text-sm" style={{ color: '#6E7A8A' }}>
              {savedCount === 0 ? 'No saved listings yet' : `${savedCount} listing${savedCount !== 1 ? 's' : ''} saved`}
            </p>
          </div>
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
              All · {savedCount}
            </button>
            {sections.map(sec => {
              const meta = SECTION_META[sec];
              const count = savedItems.filter(i => i.section === sec).length;
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
        {savedCount === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4" style={{ backgroundColor: '#F5F2EC', border: '1px solid #E8E2D8' }}>
              <Heart size={28} style={{ color: '#E8E2D8' }} />
            </div>
            <p className="text-base font-bold mb-1" style={{ color: '#0F1923' }}>{t('Nothing saved yet')}</p>
            <p className="text-sm mb-6 max-w-xs" style={{ color: '#6E7A8A' }}>
              Tap the heart icon on any listing to save it here for easy access later.
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

        {/* ── Grid ── */}
        {displayed.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {displayed.map(({ section, listing, savedAt }) => {
                const meta = SECTION_META[section] ?? { label: section, icon: Heart, color: '#6E7A8A', bg: '#F5F2EC' };
                const Icon = meta.icon;
                const price = getPriceLabel(listing, section);
                const sub = getSubLabel(listing, section);
                const title = getDisplayTitle(listing);

                return (
                  <motion.div
                    key={`${section}-${listing.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="group relative rounded-2xl overflow-hidden cursor-pointer"
                    style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}
                    onClick={() => navigate(listingDetailPath(section, listing.id, listing), { state: { listing } })}
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden" style={{ height: 160, backgroundColor: '#F5F2EC' }}>
                      <img
                        src={listing.image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'; }}
                      />
                      {/* Section badge */}
                      <div
                        className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: meta.bg, border: `1px solid ${meta.color}22` }}
                      >
                        <Icon size={9} style={{ color: meta.color }} />
                        <span className="text-[9px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={e => { e.stopPropagation(); removeSaved(section, listing.id); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: 'rgba(15,25,35,0.75)', backdropFilter: 'blur(4px)' }}
                        title="Remove from saved"
                      >
                        <Trash2 size={12} style={{ color: '#f87171' }} />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-3 space-y-1">
                      <p className="text-xs font-bold leading-snug line-clamp-2" style={{ color: '#0F1923' }}>{title}</p>
                      {price && (
                        <p className="text-xs font-bold" style={{ color: '#C9A96E' }}>{price}</p>
                      )}
                      <p className="text-[10px] leading-tight line-clamp-1" style={{ color: '#6E7A8A' }}>{sub}</p>
                      <p className="text-[9px] pt-0.5" style={{ color: '#B0B8C1' }}>
                        Saved {new Date(savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
