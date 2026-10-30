import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Briefcase, Wrench, Building2, Truck, Calendar,
  ArrowUpRight, Package, BedDouble, CheckCircle2, Zap, Trash2, Pencil,
  PauseCircle, PlayCircle, Tag, Heart, Bookmark, Share2, MessageCircle,
  Store, Search, Plus, BarChart3, Eye, CheckSquare, Square,
  SlidersHorizontal, Check, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUserListings, ListingSection, ListingStatus, UserListing } from '@/context/UserListingsContext';
import CreateListingModal, { ListingType } from '@/components/shared/CreateListingModal';
import { useAuth } from '@/context/AuthContext';
import { listingDetailPath } from '@/lib/utils';
import {
  SellerAnalyticsPanel,
  SellerInboxPanel,
  SellerOrdersPanel,
  SellerPromotionsPanel,
  SellerStorefrontSettings,
  SellerWorkspaceOverview,
} from './SellerWorkspacePanels';

type WorkspaceView = 'overview' | 'listings' | 'storefront' | 'inquiries' | 'orders' | 'analytics' | 'promotions';

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
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#F5F2EC]">
        {data.image ? (
          <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6E7A8A]">
            <ShoppingBag size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate text-[#0F1923] group-hover:text-[#1A3353]">{data.title}</p>
        <p className="text-base font-extrabold mt-0.5 text-[#1A3353]">
          ${Number(data.price || 0).toLocaleString()}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {data.condition && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#F5F2EC] text-[#6E7A8A]">
              {data.condition}
            </span>
          )}
          <span className="text-[11px] text-[#6E7A8A] truncate">{data.category}</span>
        </div>
      </div>
    </div>
  );
}

function JobCard({ data }: { data: any }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0"
        style={{ backgroundColor: data.color || '#1A3353', color: '#C9A96E' }}
      >
        {data.logo || data.company?.[0] || 'J'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate text-[#0F1923] group-hover:text-[#1A3353]">{data.title}</p>
        <p className="text-xs mt-0.5 text-[#6E7A8A] truncate">{data.company}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-semibold text-[#15803D]">{data.salary}</span>
          {data.remote && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
              Remote
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ data }: { data: any }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#F5F2EC]">
        {data.image ? (
          <img src={data.image} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6E7A8A]">
            <Wrench size={18} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate text-[#0F1923] group-hover:text-[#1A3353]">{data.title}</p>
        <p className="text-xs mt-0.5 text-[#6E7A8A] truncate">{data.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-semibold text-[#7C3AED]">{data.rate}</span>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: data.available ? '#15803D' : '#6E7A8A' }}>
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: data.available ? '#15803D' : '#9CA3AF' }}
            />
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
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#F5F2EC]">
        {data.image ? (
          <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6E7A8A]">
            <Building2 size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate text-[#0F1923] group-hover:text-[#1A3353]">{data.title}</p>
        <p className="text-xs mt-0.5 truncate text-[#6E7A8A]">{data.address}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-bold text-[#B45309]">{data.priceDisplay}</span>
          {data.beds > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-[#6E7A8A]">
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
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#F5F2EC]">
        {data.image ? (
          <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6E7A8A]">
            <Truck size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate text-[#0F1923] group-hover:text-[#1A3353]">{data.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-bold text-[#0F766E]">${Number(data.price || 0).toLocaleString()}</span>
          {data.electric && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <Zap size={9} /> EV
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-[#6E7A8A]">{data.year} · {data.mileage}</span>
        </div>
      </div>
    </div>
  );
}

function EventCard({ data }: { data: any }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#F5F2EC]">
        {data.image ? (
          <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6E7A8A]">
            <Calendar size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate text-[#0F1923] group-hover:text-[#1A3353]">{data.title}</p>
        <div className="flex items-center gap-1 mt-0.5 text-xs text-[#6E7A8A]">
          <Calendar size={11} /> {data.date}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-semibold text-[#B91C1C]">{data.priceDisplay}</span>
          <span className="text-[11px] text-[#6E7A8A] truncate">{data.location}</span>
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

/* ── Main Seller Workspace ─────────────────────────────────────── */
export default function MyListingsSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listings, totalCount, addListing, removeListing, updateListing, setListingStatus } = useUserListings();
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('listings');

  // Creation modal inside workspace
  const [newListingType, setNewListingType] = useState<ListingType | null>(null);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState<ListingSection | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ListingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-desc' | 'price-asc' | 'title-asc'>('newest');

  // Edit & Bulk Actions
  const [editListing, setEditListing] = useState<UserListing | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const displayedListings = useMemo(() => {
    let result = listings.filter(listing => {
      const matchesSection = activeFilter === 'all' || listing.section === activeFilter;
      const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
      const searchableText = [
        listing.data?.title,
        listing.data?.name,
        listing.data?.category,
        listing.data?.location,
        listing.data?.address,
        SECTION_META[listing.section]?.label,
      ].filter(Boolean).join(' ').toLowerCase();
      return matchesSection && matchesStatus && searchableText.includes(searchQuery.trim().toLowerCase());
    });

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price-desc':
        result.sort((a, b) => (Number(b.data?.price || 0) - Number(a.data?.price || 0)));
        break;
      case 'price-asc':
        result.sort((a, b) => (Number(a.data?.price || 0) - Number(b.data?.price || 0)));
        break;
      case 'title-asc':
        result.sort((a, b) => (a.data?.title || a.data?.name || '').localeCompare(b.data?.title || b.data?.name || ''));
        break;
    }

    return result;
  }, [listings, activeFilter, statusFilter, searchQuery, sortBy]);

  const countBySection = useMemo(() => {
    return SECTION_ORDER.reduce<Record<string, number>>((acc, s) => {
      acc[s] = listings.filter(l => l.section === s).length;
      return acc;
    }, {});
  }, [listings]);

  const statusCounts = useMemo(() => ({
    active: listings.filter(l => l.status === 'active').length,
    paused: listings.filter(l => l.status === 'paused').length,
    sold: listings.filter(l => l.status === 'sold').length,
    pending: listings.filter(l => l.status === 'pending_review').length,
  }), [listings]);

  // Bulk Actions
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedListings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedListings.map(l => l.id)));
    }
  };

  const handleBulkStatus = async (status: ListingStatus) => {
    if (!selectedIds.size) return;
    setBulkProcessing(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => setListingStatus(id, status)));
      toast.success(`${selectedIds.size} listings marked as ${status}`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Could not update all selected listings');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} listings? This cannot be undone.`)) {
      return;
    }
    setBulkProcessing(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => removeListing(id)));
      toast.success(`${selectedIds.size} listings removed`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Could not delete all selected listings');
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="section-padding space-y-6">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="gold-accent mb-3" />
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1923]">Seller Workspace</h1>
          <p className="text-sm mt-1 text-[#6E7A8A]">
            Manage your inventory, public storefront branding, and customer orders
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setCategoryPickerOpen(open => !open)}
            aria-expanded={categoryPickerOpen}
            className="flex items-center gap-2 rounded-xl bg-[#1A3353] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#24466e] active:scale-95"
          >
            <Plus size={16} /> New listing
          </button>

          {/* In-workspace category picker */}
          {categoryPickerOpen && (
            <div className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-[#E8E2D8] bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6E7A8A]">
                Choose Sector
              </p>
              {SECTION_ORDER.map(section => {
                const { label, icon: Icon, accent, accentBg } = SECTION_META[section];
                return (
                  <button
                    key={section}
                    type="button"
                    onClick={() => {
                      setCategoryPickerOpen(false);
                      setNewListingType(section as ListingType);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#0F1923] transition-colors hover:bg-[#F8F6F1]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: accentBg, color: accent }}>
                      <Icon size={14} />
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Workspace Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Catalog', value: totalCount, icon: Package, color: '#1A3353', hint: 'Across all categories' },
          { label: 'Active Listings', value: statusCounts.active, icon: CheckCircle2, color: '#15803D', hint: 'Live & visible to buyers' },
          { label: 'Paused Inventory', value: statusCounts.paused, icon: PauseCircle, color: '#B45309', hint: 'Hidden from search' },
          { label: 'Items Sold', value: statusCounts.sold, icon: Tag, color: '#0F766E', hint: 'Completed deals' },
        ].map(({ label, value, icon: Icon, color, hint }) => (
          <div key={label} className="rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6E7A8A]">{label}</span>
              <Icon size={17} style={{ color }} />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#0F1923]">{value}</p>
            <p className="mt-1 text-xs text-[#6E7A8A]">{hint}</p>
          </div>
        ))}
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#E8E2D8]">
        {[
          { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
          { id: 'listings' as const, label: `My listings (${totalCount})`, icon: Package },
          { id: 'storefront' as const, label: 'Storefront & Branding', icon: Store },
          { id: 'inquiries' as const, label: 'Customer Inquiries', icon: MessageCircle },
          { id: 'orders' as const, label: 'Orders', icon: ShoppingBag },
          { id: 'analytics' as const, label: 'Analytics', icon: Search },
          { id: 'promotions' as const, label: 'Promotions', icon: Tag },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setWorkspaceView(id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              workspaceView === id
                ? 'border-[#C9A96E] text-[#1A3353]'
                : 'border-transparent text-[#6E7A8A] hover:text-[#1A3353]'
            }`}
            aria-current={workspaceView === id ? 'page' : undefined}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* In-Workspace Listing Creation Modal */}
      {newListingType && (
        <CreateListingModal
          type={newListingType}
          open={Boolean(newListingType)}
          onClose={() => setNewListingType(null)}
          onSubmit={async fd => {
            await addListing(newListingType, fd);
            setNewListingType(null);
            toast.success('Listing published successfully!');
          }}
        />
      )}

      {/* Edit Listing Modal */}
      {editListing && (
        <CreateListingModal
          type={editListing.section as ListingType}
          open={Boolean(editListing)}
          onClose={() => setEditListing(null)}
          initialData={editListing.data}
          editId={editListing.id}
          onSubmit={async fd => {
            await updateListing(editListing.id, applyTransform(editListing.section, editListing.data, fd));
            setEditListing(null);
            toast.success('Listing updated successfully!');
          }}
        />
      )}

      {/* View Switcher */}
      {workspaceView === 'overview' ? (
        <SellerWorkspaceOverview onOpen={view => setWorkspaceView(view)} />
      ) : workspaceView === 'storefront' ? (
        <SellerStorefrontSettings />
      ) : workspaceView === 'inquiries' ? (
        <SellerInboxPanel />
      ) : workspaceView === 'orders' ? (
        <SellerOrdersPanel />
      ) : workspaceView === 'analytics' ? (
        <SellerAnalyticsPanel />
      ) : workspaceView === 'promotions' ? (
        <SellerPromotionsPanel />
      ) : (
        /* MY LISTINGS VIEW */
        <div className="space-y-4">
          {/* Controls Bar: Search, Status, Sorting */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2 max-w-md rounded-xl border border-[#E8E2D8] bg-white px-3 py-2 focus-within:border-[#1A3353]">
              <Search size={16} className="shrink-0 text-[#6E7A8A]" />
              <input
                type="search"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search by title, category, location..."
                className="w-full bg-transparent text-sm text-[#0F1923] outline-none placeholder:text-[#9AA3AE]"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6E7A8A]">
                <SlidersHorizontal size={14} /> Sort:
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-[#E8E2D8] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F1923] outline-none focus:border-[#1A3353]"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="title-asc">Title: A to Z</option>
                </select>
              </label>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              ['all', 'All', totalCount],
              ['active', 'Active', statusCounts.active],
              ['paused', 'Paused', statusCounts.paused],
              ['sold', 'Sold', statusCounts.sold],
              ['pending_review', 'In Review', statusCounts.pending],
            ].map(([status, label, count]) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status as any)}
                className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-all ${
                  statusFilter === status
                    ? 'border-[#1A3353] bg-[#1A3353] text-white shadow-xs'
                    : 'border-[#E8E2D8] bg-white text-[#6E7A8A] hover:border-[#1A3353]'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'border-[#1A3353] bg-[#1A3353] text-white shadow-xs'
                  : 'border-[#E8E2D8] bg-white text-[#6E7A8A] hover:border-[#1A3353]'
              }`}
            >
              All Sectors ({totalCount})
            </button>
            {SECTION_ORDER.map(s => {
              const { label, icon: Icon, accent, accentBg } = SECTION_META[s];
              const isActive = activeFilter === s;
              const count = countBySection[s] || 0;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveFilter(s)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                    isActive
                      ? 'border-[#1A3353] bg-white text-[#1A3353] shadow-xs'
                      : 'border-[#E8E2D8] bg-white text-[#6E7A8A] hover:border-[#1A3353]'
                  }`}
                  style={isActive ? { borderColor: accent, color: accent, backgroundColor: accentBg } : undefined}
                >
                  <Icon size={12} />
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {/* Bulk Action Toolbar */}
          {displayedListings.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8E2D8] bg-[#F8F6F1] px-4 py-2.5">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs font-bold text-[#1A3353] hover:underline"
              >
                {selectedIds.size === displayedListings.length ? (
                  <CheckSquare size={16} className="text-[#1A3353]" />
                ) : (
                  <Square size={16} className="text-[#6E7A8A]" />
                )}
                {selectedIds.size === displayedListings.length
                  ? `Deselect All (${displayedListings.length})`
                  : `Select All (${displayedListings.length})`}
              </button>

              {selectedIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                  <span className="text-xs font-bold text-[#1A3353]">{selectedIds.size} selected</span>
                  <button
                    type="button"
                    disabled={bulkProcessing}
                    onClick={() => void handleBulkStatus('active')}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    Activate
                  </button>
                  <button
                    type="button"
                    disabled={bulkProcessing}
                    onClick={() => void handleBulkStatus('paused')}
                    className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100"
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    disabled={bulkProcessing}
                    onClick={() => void handleBulkStatus('sold')}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 hover:bg-blue-100"
                  >
                    Mark Sold
                  </button>
                  <button
                    type="button"
                    disabled={bulkProcessing}
                    onClick={() => void handleBulkDelete()}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Listings Cards Grid */}
          {displayedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D8D0C2] bg-white px-5 py-16 text-center">
              <Package size={32} className="text-[#C9A96E]" />
              <h2 className="mt-4 text-base font-bold text-[#0F1923]">
                {totalCount === 0 ? 'Your catalog is empty' : 'No listings match your search'}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-[#6E7A8A]">
                {totalCount === 0
                  ? 'Publish your first listing to start selling across the Buzzer city directory.'
                  : 'Try clearing your search query or switching filters to view your items.'}
              </p>
              {totalCount === 0 ? (
                <button
                  type="button"
                  onClick={() => setCategoryPickerOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1A3353] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#24466e]"
                >
                  <Plus size={15} /> Publish your first listing
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setActiveFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
                  className="mt-4 text-sm font-semibold text-[#1A3353] hover:underline"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedListings.map(listing => {
                const { label, icon: Icon, accent, accentBg } = SECTION_META[listing.section];
                const CardRenderer = CARD_RENDERERS[listing.section];
                const isSelected = selectedIds.has(listing.id);
                const detailUrl = listingDetailPath(listing.section, listing.id, listing.data);

                return (
                  <motion.div
                    key={listing.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`card-premium group relative flex flex-col justify-between p-4 transition-all ${
                      isSelected ? 'ring-2 ring-[#1A3353] bg-[#FAF9F6]' : ''
                    }`}
                  >
                    {/* Top Checkbox & Sector Badge */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); toggleSelect(listing.id); }}
                          aria-label={`Select ${listing.data?.title || 'listing'}`}
                          className="text-[#1A3353] transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare size={17} className="text-[#1A3353]" />
                          ) : (
                            <Square size={17} className="text-[#9AA3AE] hover:text-[#1A3353]" />
                          )}
                        </button>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: accentBg, color: accent }}
                        >
                          <Icon size={11} /> {label}
                        </span>
                      </div>

                      {/* Status Pill */}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          listing.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : listing.status === 'paused'
                            ? 'bg-amber-50 text-amber-700'
                            : listing.status === 'sold'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {listing.status === 'active'
                          ? 'Active'
                          : listing.status === 'paused'
                          ? 'Paused'
                          : listing.status === 'sold'
                          ? 'Sold'
                          : listing.status}
                      </span>
                    </div>

                    {/* Card Content - Clicking navigates to live listing */}
                    <div
                      className="cursor-pointer py-3"
                      onClick={() => navigate(detailUrl)}
                      title="Click to view public listing"
                    >
                      <CardRenderer data={listing.data} />
                    </div>

                    {/* Card Footer: Action Controls */}
                    <div className="mt-2 flex items-center justify-between border-t border-[#F0EBE1] pt-3">
                      <div className="flex items-center gap-1">
                        {/* Live View */}
                        <button
                          type="button"
                          onClick={() => navigate(detailUrl)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#1A3353] hover:bg-[#F5F2EC]"
                          title="View live public listing"
                        >
                          <Eye size={13} /> View
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => setEditListing(listing)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#1A3353] hover:bg-[#F5F2EC]"
                          title="Edit details"
                        >
                          <Pencil size={13} /> Edit
                        </button>

                        {/* Pause / Resume */}
                        {(listing.status === 'active' || listing.status === 'paused') && (
                          <button
                            type="button"
                            onClick={() => setListingStatus(listing.id, listing.status === 'paused' ? 'active' : 'paused')}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#52606D] hover:bg-[#F5F2EC]"
                            title={listing.status === 'paused' ? 'Resume listing' : 'Pause listing'}
                          >
                            {listing.status === 'paused' ? (
                              <PlayCircle size={13} className="text-emerald-600" />
                            ) : (
                              <PauseCircle size={13} className="text-amber-600" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Sold & Delete buttons */}
                      <div className="flex items-center gap-1">
                        {listing.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => setListingStatus(listing.id, 'sold')}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                            title="Mark as completed or sold"
                          >
                            Mark Sold
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete this listing?')) {
                              removeListing(listing.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                          title="Delete listing"
                          aria-label="Delete listing"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
