import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Briefcase, Wrench, Building2, Truck, Calendar,
  ArrowUpRight, Package, BedDouble, CheckCircle2, Zap, Trash2, Pencil,
  PauseCircle, PlayCircle, Tag,
} from 'lucide-react';
import { useUserListings, ListingSection, ListingStatus, UserListing } from '@/context/UserListingsContext';
import CreateListingModal, { ListingType } from '@/components/shared/CreateListingModal';
import { useLocalization } from '@/i18n/LocalizationContext';

/* ── Section meta ─────────────────────────────────────────────── */
const SECTION_META: Record<ListingSection, {
  label: string;
  icon: React.FC<any>;
  href: string;
  accent: string;
  accentBg: string;
}> = {
  marketplace: { label: 'Marketplace',  icon: ShoppingBag, href: '/dashboard/marketplace', accent: '#1A3353', accentBg: '#EFF6FF' },
  job:         { label: 'Jobs',         icon: Briefcase,   href: '/dashboard/jobs',        accent: '#15803D', accentBg: '#F0FDF4' },
  service:     { label: 'Services',     icon: Wrench,      href: '/dashboard/services',    accent: '#7C3AED', accentBg: '#F5F3FF' },
  'real-estate':{ label: 'Real Estate', icon: Building2,   href: '/dashboard/real-estate', accent: '#B45309', accentBg: '#FFFBEB' },
  transport:   { label: 'Transport',    icon: Truck,       href: '/dashboard/transport',   accent: '#0F766E', accentBg: '#F0FDFA' },
  event:       { label: 'Events',       icon: Calendar,    href: '/dashboard/events',      accent: '#B91C1C', accentBg: '#FEF2F2' },
};

/* ── Section order for display ───────────────────────────────── */
const SECTION_ORDER: ListingSection[] = ['marketplace', 'job', 'service', 'real-estate', 'transport', 'event'];

/* ── Card renderers per section ──────────────────────────────── */
function MarketplaceCard({ data }: { data: any }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#F5F2EC]">
        <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: '#0F1923' }}>{data.title}</p>
        <p className="text-base font-bold mt-0.5" style={{ color: '#1A3353' }}>${Number(data.price).toLocaleString()}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A' }}>{data.condition}</span>
          <span className="text-[11px]" style={{ color: '#6E7A8A' }}>{data.category}</span>
        </div>
      </div>
    </div>
  );
}

function JobCard({ data }: { data: any }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0" style={{ backgroundColor: data.color || '#1A3353', color: '#C9A96E' }}>
        {data.logo || data.company?.[0] || 'J'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: '#0F1923' }}>{data.title}</p>
        <p className="text-xs mt-0.5" style={{ color: '#6E7A8A' }}>{data.company}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-medium" style={{ color: '#15803D' }}>{data.salary}</span>
          {data.remote && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">Remote</span>}
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ data }: { data: any }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-[#F5F2EC]">
        <img src={data.image} alt={data.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: '#0F1923' }}>{data.title}</p>
        <p className="text-xs mt-0.5" style={{ color: '#6E7A8A' }}>{data.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-semibold" style={{ color: '#7C3AED' }}>{data.rate}</span>
          <span className="flex items-center gap-0.5 text-[10px]" style={{ color: data.available ? '#15803D' : '#6E7A8A' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: data.available ? '#15803D' : '#9CA3AF' }} />
            {data.available ? 'Available' : 'Busy'}
          </span>
        </div>
      </div>
    </div>
  );
}

function RealEstateCard({ data }: { data: any }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#F5F2EC]">
        <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: '#0F1923' }}>{data.title}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: '#6E7A8A' }}>{data.address}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-bold" style={{ color: '#B45309' }}>{data.priceDisplay}</span>
          {data.beds > 0 && (
            <span className="flex items-center gap-0.5 text-[11px]" style={{ color: '#6E7A8A' }}>
              <BedDouble size={10} /> {data.beds}bd
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TransportCard({ data }: { data: any }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#F5F2EC]">
        <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: '#0F1923' }}>{data.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-bold" style={{ color: '#0F766E' }}>${Number(data.price).toLocaleString()}</span>
          {data.electric && <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md"><Zap size={9} /> EV</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px]" style={{ color: '#6E7A8A' }}>{data.year} · {data.mileage}</span>
        </div>
      </div>
    </div>
  );
}

function EventCard({ data }: { data: any }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#F5F2EC]">
        <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: '#0F1923' }}>{data.title}</p>
        <div className="flex items-center gap-1 mt-0.5 text-xs" style={{ color: '#6E7A8A' }}>
          <Calendar size={11} /> {data.date}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-semibold" style={{ color: '#B91C1C' }}>{data.priceDisplay}</span>
          <span className="text-[11px]" style={{ color: '#6E7A8A' }}>{data.location}</span>
        </div>
      </div>
    </div>
  );
}

const CARD_RENDERERS: Record<ListingSection, React.FC<{ data: any }>> = {
  marketplace: MarketplaceCard,
  job: JobCard,
  service: ServiceCard,
  'real-estate': RealEstateCard,
  transport: TransportCard,
  event: EventCard,
};

/* ── Re-apply section transforms on edit save ────────────────── */
function applyTransform(section: ListingSection, existing: any, fd: any): any {
  const id = existing.id;
  switch (section) {
    case 'marketplace':
      return { ...existing, id, title: fd.title || existing.title, price: Number(fd.price) || existing.price, originalPrice: Number(fd.originalPrice) || 0, condition: fd.condition || existing.condition, category: fd.category || existing.category, location: fd.location || existing.location, image: fd.imageUrl || existing.image };
    case 'job': {
      return { ...existing, id, title: fd.title || existing.title, company: fd.company || existing.company, location: fd.location || existing.location, salary: fd.salary || existing.salary, type: fd.type || existing.type, remote: fd.remote ?? existing.remote, tags: fd.tags ? fd.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : existing.tags, logo: ((fd.company || existing.company)?.[0] || 'Y').toUpperCase() };
    }
    case 'service':
      return { ...existing, id, name: fd.name || existing.name, title: fd.title || existing.title, category: fd.category || existing.category, rate: fd.rate || existing.rate, location: fd.location || existing.location, available: fd.available ?? existing.available, tags: fd.tags ? fd.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : existing.tags };
    case 'real-estate': {
      const price = Number(fd.price) || existing.price;
      const isRent = (fd.mode || existing.mode) === 'Rent';
      return { ...existing, id, title: fd.title || existing.title, address: fd.address || existing.address, mode: fd.mode || existing.mode, price, priceDisplay: isRent ? `$${price.toLocaleString()}/mo` : price >= 1_000_000 ? `$${(price / 1_000_000).toFixed(1)}M` : `$${price.toLocaleString()}`, beds: Number(fd.beds) || existing.beds, baths: Number(fd.baths) || existing.baths, sqft: Number(fd.sqft) || existing.sqft, agent: fd.agent || existing.agent };
    }
    case 'transport':
      return { ...existing, id, title: fd.title || existing.title, category: fd.category || existing.category, electric: fd.electric || fd.fuel === 'Electric', price: Number(fd.price) || existing.price, mileage: fd.mileage || existing.mileage, year: Number(fd.year) || existing.year, fuel: fd.fuel || existing.fuel, transmission: fd.transmission || existing.transmission, condition: fd.condition || existing.condition, location: fd.location || existing.location };
    case 'event': {
      const price = Number(fd.price) || 0;
      return { ...existing, id, title: fd.title || existing.title, category: fd.category || existing.category, date: fd.date || existing.date, time: fd.time || existing.time, location: fd.location || existing.location, price, priceDisplay: price === 0 ? 'Free' : `$${price}`, host: fd.host || existing.host };
    }
  }
}

/* ── Main Component ───────────────────────────────────────────── */
export default function MyListingsSection() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { listings, totalCount, removeListing, updateListing, setListingStatus } = useUserListings();
  const [activeFilter, setActiveFilter] = useState<ListingSection | 'all'>('all');
  const [editListing, setEditListing] = useState<UserListing | null>(null);

  const displayedListings = activeFilter === 'all'
    ? listings
    : listings.filter(l => l.section === activeFilter);

  const countBySection = SECTION_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = listings.filter(l => l.section === s).length;
    return acc;
  }, {});

  if (totalCount === 0) {
    return (
      <div className="section-padding space-y-6">
        <div className="section-header">
          <div>
            <div className="gold-accent mb-3" />
            <h1 className="text-2xl font-bold" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>{t('My Listings')}</h1>
            <p className="text-sm mt-1" style={{ color: '#6E7A8A' }}>Everything you've posted, in one place</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{ backgroundColor: '#F5F2EC', border: '1px solid #E8E2D8' }}
          >
            <Package size={32} style={{ color: '#C9A96E' }} />
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#0F1923' }}>No listings yet</h3>
          <p className="text-sm max-w-xs mb-8" style={{ color: '#6E7A8A' }}>
            Head to any section and hit the post button to add your first listing. It will appear here instantly.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SECTION_ORDER.map(s => {
              const { label, icon: Icon, href, accent, accentBg } = SECTION_META[s];
              return (
                <button
                  key={s}
                  onClick={() => navigate(href)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ backgroundColor: accentBg, color: accent, border: `1px solid ${accent}22` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding space-y-6">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="gold-accent mb-3" />
          <h1 className="text-2xl font-bold" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>{t('My Listings')}</h1>
          <p className="text-sm mt-1" style={{ color: '#6E7A8A' }}>Everything you've posted, in one place</p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ backgroundColor: '#F5F2EC', border: '1px solid #E8E2D8' }}
        >
          <CheckCircle2 size={14} style={{ color: '#C9A96E' }} />
          <span className="text-sm font-semibold" style={{ color: '#0F1923' }}>
            {totalCount} {totalCount === 1 ? 'listing' : 'listings'}
          </span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveFilter('all')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all"
          style={{
            backgroundColor: activeFilter === 'all' ? '#1A3353' : '#ffffff',
            color: activeFilter === 'all' ? '#ffffff' : '#6E7A8A',
            border: activeFilter === 'all' ? '1px solid #1A3353' : '1px solid #E8E2D8',
          }}
        >
          All ({totalCount})
        </button>
        {SECTION_ORDER.filter(s => countBySection[s] > 0).map(s => {
          const { label, icon: Icon, accent, accentBg } = SECTION_META[s];
          const isActive = activeFilter === s;
          return (
            <button
              key={s}
              onClick={() => setActiveFilter(s)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive ? accentBg : '#ffffff',
                color: isActive ? accent : '#6E7A8A',
                border: `1px solid ${isActive ? accent + '55' : '#E8E2D8'}`,
              }}
            >
              <Icon size={12} />
              {label} ({countBySection[s]})
            </button>
          );
        })}
      </div>

      {/* Edit modal */}
      {editListing && (
        <CreateListingModal
          type={editListing.section as ListingType}
          open={!!editListing}
          onClose={() => setEditListing(null)}
          initialData={editListing.data}
          editId={editListing.id}
          onSubmit={async fd => {
            await updateListing(editListing.id, applyTransform(editListing.section, editListing.data, fd));
            setEditListing(null);
          }}
        />
      )}

      {/* Grouped listings */}
      <AnimatePresence mode="popLayout">
        {(activeFilter === 'all' ? SECTION_ORDER.filter(s => countBySection[s] > 0) : [activeFilter as ListingSection]).map(section => {
          const sectionListings = displayedListings.filter(l => l.section === section);
          if (sectionListings.length === 0) return null;
          const { label, icon: Icon, href, accent, accentBg } = SECTION_META[section];
          const CardRenderer = CARD_RENDERERS[section];

          return (
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {/* Section header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: accentBg }}
                  >
                    <Icon size={14} style={{ color: accent }} />
                  </div>
                  <span className="font-semibold text-sm" style={{ color: '#0F1923' }}>{label}</span>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: accentBg, color: accent }}
                  >
                    {sectionListings.length}
                  </span>
                </div>
                <button
                  onClick={() => navigate(href)}
                  className="flex items-center gap-1 text-xs font-medium transition-colors"
                  style={{ color: '#6E7A8A' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = accent; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; }}
                >
                  View section <ArrowUpRight size={12} />
                </button>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {sectionListings.map(listing => (
                  <motion.div
                    key={listing.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className="card-premium group cursor-pointer p-4 relative"
                    onClick={() => setEditListing(listing)}
                  >
                    {/* Action buttons — visible on hover */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-150 z-10">
                      <button
                        onClick={e => { e.stopPropagation(); setEditListing(listing); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ backgroundColor: '#EFF6FF', color: '#1A3353', border: '1px solid #BFDBFE' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#DBEAFE'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EFF6FF'; }}
                        title="Edit listing"
                        aria-label="Edit listing"
                      >
                        <Pencil size={12} />
                      </button>
                      {(listing.status === 'active' || listing.status === 'paused') && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setListingStatus(listing.id, listing.status === 'paused' ? 'active' : 'paused');
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: listing.status === 'paused' ? '#F0FDF4' : '#FFFBEB',
                            color: listing.status === 'paused' ? '#15803D' : '#B45309',
                            border: `1px solid ${listing.status === 'paused' ? '#BBF7D0' : '#FDE68A'}`,
                          }}
                          title={listing.status === 'paused' ? 'Resume listing' : 'Pause listing'}
                          aria-label={listing.status === 'paused' ? 'Resume listing' : 'Pause listing'}
                        >
                          {listing.status === 'paused' ? <PlayCircle size={12} /> : <PauseCircle size={12} />}
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); removeListing(listing.id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FEE2E2'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FEF2F2'; }}
                        title="Remove listing"
                        aria-label="Remove listing"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <CardRenderer data={listing.data} />
                    <div
                      className="flex items-center justify-between mt-3 pt-3"
                      style={{ borderTop: '1px solid #F0EBE1' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: accentBg, color: accent }}
                        >
                          {label}
                        </span>
                        {listing.status === 'paused' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>
                            Paused
                          </span>
                        )}
                        {listing.status === 'sold' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
                            Sold
                          </span>
                        )}
                        {listing.status === 'pending_review' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
                            Pending review
                          </span>
                        )}
                        {listing.status === 'flagged' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
                            Flagged for review
                          </span>
                        )}
                        {listing.status === 'rejected' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
                            Rejected
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {listing.status === 'active' && (
                          <button
                            onClick={e => { e.stopPropagation(); setListingStatus(listing.id, 'sold'); }}
                            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors"
                            style={{ backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#DCFCE7'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F0FDF4'; }}
                            title="Mark as sold"
                          >
                            <Tag size={9} /> Mark Sold
                          </button>
                        )}
                        <span className="text-[11px]" style={{ color: '#6E7A8A' }}>
                          {new Date(listing.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
