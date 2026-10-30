import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Briefcase, Wrench, Building2, Truck, Calendar,
  ArrowUpRight, Package, BedDouble, CheckCircle2, Zap, Trash2, Pencil,
  PauseCircle, PlayCircle, Tag, Heart, Bookmark, Share2, MessageCircle,
  Store, Search, Settings, Plus, BarChart3,
  Eye,
} from 'lucide-react';
import { useUserListings, ListingSection, ListingStatus, UserListing } from '@/context/UserListingsContext';
import CreateListingModal, { ListingType } from '@/components/shared/CreateListingModal';
import { listingEngagementAPI, type ListingEngagement } from '@/services/listingEngagementService';
import { useChatContext } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
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

function ListingEngagementPanel({ listing }: { listing: UserListing }) {
  const { openChatWithListing } = useChatContext();
  const [engagement, setEngagement] = useState<ListingEngagement | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    listingEngagementAPI.get(listing.id)
      .then(result => {
        if (active) setEngagement(result);
      })
      .catch(error => {
        console.error('Could not load seller listing engagement:', error);
        if (active) setLoadError(true);
      });
    return () => { active = false; };
  }, [listing.id]);

  if (loadError) {
    return <p className="mt-3 text-xs text-red-600">Could not load customer and engagement data.</p>;
  }
  if (!engagement) {
    return <p className="mt-3 text-xs text-muted-foreground">Loading customer activity…</p>;
  }

  const metrics = [
    { label: 'Views', value: engagement.stats.views, icon: Eye },
    { label: 'Likes', value: engagement.stats.likes, icon: Heart },
    { label: 'Saves', value: engagement.stats.saves, icon: Bookmark },
    { label: 'Share clicks', value: engagement.stats.shares, icon: Share2 },
    { label: 'Inquiries', value: engagement.stats.inquiries, icon: MessageCircle },
  ];
  const customers = engagement.customers ?? [];
  const title = listing.data?.title ?? listing.data?.name ?? 'Your listing';
  const price = listing.data?.priceDisplay ?? listing.data?.price ?? listing.data?.salary ?? '';

  return (
    <div className="mt-3 border-t border-border pt-3" onClick={event => event.stopPropagation()}>
      <div className="grid grid-cols-5 gap-1">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground" title={label}>
            <Icon size={12} />
            <span className="font-semibold text-foreground">{value}</span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <p className="text-xs font-semibold text-foreground">Customers ({customers.length})</p>
        {customers.length ? (
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
            {customers.map(customer => (
              <div key={customer.id} className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-semibold">
                  {customer.profileImageUrl
                    ? <img src={customer.profileImageUrl} alt="" className="h-full w-full object-cover" />
                    : customer.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{customer.name}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(customer.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-accent"
                  onClick={() => openChatWithListing({
                    listingId: listing.id,
                    listingTitle: title,
                    listingPrice: String(price),
                    listingImage: listing.data?.image,
                    listingCategory: listing.section,
                    sellerName: customer.name,
                    sellerId: customer.id,
                  })}
                  aria-label={`Message ${customer.name}`}
                >
                  <MessageCircle size={11} /> Message
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-[11px] text-muted-foreground">No customer inquiries yet.</p>
        )}
      </div>
    </div>
  );
}

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listings, totalCount, removeListing, updateListing, setListingStatus } = useUserListings();
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('listings');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ListingSection | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ListingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editListing, setEditListing] = useState<UserListing | null>(null);

  const displayedListings = listings.filter(listing => {
    const matchesSection = activeFilter === 'all' || listing.section === activeFilter;
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    const searchableText = [
      listing.data?.title,
      listing.data?.name,
      listing.data?.category,
      listing.data?.location,
      listing.data?.address,
      SECTION_META[listing.section].label,
    ].filter(Boolean).join(' ').toLowerCase();
    return matchesSection && matchesStatus && searchableText.includes(searchQuery.trim().toLowerCase());
  });

  const countBySection = SECTION_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = listings.filter(l => l.section === s).length;
    return acc;
  }, {});
  const statusCounts = {
    active: listings.filter(listing => listing.status === 'active').length,
    paused: listings.filter(listing => listing.status === 'paused').length,
    sold: listings.filter(listing => listing.status === 'sold').length,
  };

  return (
    <div className="section-padding space-y-6">
      <div className="section-header">
        <div>
          <div className="gold-accent mb-3" />
          <h1 className="text-2xl font-bold" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>Seller workspace</h1>
          <p className="text-sm mt-1" style={{ color: '#6E7A8A' }}>Manage your listings, customers, and storefront</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setCreateMenuOpen(open => !open)}
            aria-expanded={createMenuOpen}
            className="flex items-center gap-2 rounded-xl bg-[#1A3353] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#24466e]"
          >
            <Plus size={16} /> New listing
          </button>
          {createMenuOpen && (
            <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-[#E8E2D8] bg-white p-1.5 shadow-lg">
              {SECTION_ORDER.map(section => {
                const { label, icon: Icon, href } = SECTION_META[section];
                return (
                  <button
                    key={section}
                    type="button"
                    onClick={() => { setCreateMenuOpen(false); navigate(href); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#1A3353] hover:bg-[#F8F6F1]"
                  >
                    <Icon size={15} /> {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Total listings', value: totalCount, icon: Package, color: '#1A3353', hint: 'Across all categories' },
          { label: 'Active', value: statusCounts.active, icon: CheckCircle2, color: '#15803D', hint: 'Visible to buyers' },
          { label: 'Paused or sold', value: statusCounts.paused + statusCounts.sold, icon: Tag, color: '#B45309', hint: `${statusCounts.paused} paused · ${statusCounts.sold} sold` },
        ].map(({ label, value, icon: Icon, color, hint }) => (
          <div key={label} className="rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#6E7A8A]">{label}</span>
              <Icon size={17} style={{ color }} />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#0F1923]">{value}</p>
            <p className="mt-1 text-xs text-[#6E7A8A]">{hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#E8E2D8]">
        {[
          { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
          { id: 'listings' as const, label: 'My listings', icon: Package },
          { id: 'storefront' as const, label: 'Storefront', icon: Store },
          { id: 'inquiries' as const, label: 'Inquiries', icon: MessageCircle },
          { id: 'orders' as const, label: 'Orders', icon: ShoppingBag },
          { id: 'analytics' as const, label: 'Analytics', icon: Search },
          { id: 'promotions' as const, label: 'Promotions', icon: Tag },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setWorkspaceView(id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
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

      {workspaceView !== 'listings' && workspaceView !== 'storefront' ? (
        workspaceView === 'overview' ? (
          <SellerWorkspaceOverview onOpen={view => setWorkspaceView(view)} />
        ) : workspaceView === 'inquiries' ? (
          <SellerInboxPanel />
        ) : workspaceView === 'orders' ? (
          <SellerOrdersPanel />
        ) : workspaceView === 'analytics' ? (
          <SellerAnalyticsPanel />
        ) : (
          <SellerPromotionsPanel />
        )
      ) : workspaceView === 'storefront' ? (
        <div className="space-y-5">
          <SellerStorefrontSettings />
          <div className="overflow-hidden rounded-2xl border border-[#E8E2D8] bg-white shadow-sm">
            <div className="h-28 bg-gradient-to-r from-[#1A3353] via-[#34516E] to-[#C9A96E]" />
            <div className="px-5 pb-5">
              <div className="-mt-9 flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-end gap-3">
                  <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[#F5F2EC] text-2xl font-bold text-[#1A3353] shadow-sm">
                    {user?.profileImageUrl
                      ? <img src={user.profileImageUrl} alt="" className="h-full w-full object-cover" />
                      : (user?.name?.[0] ?? 'S').toUpperCase()}
                  </div>
                  <div className="pb-1">
                    <p className="text-lg font-bold text-[#0F1923]">{user?.name || 'Your seller profile'}</p>
                    <p className="text-xs text-[#6E7A8A]">Seller storefront · {totalCount} {totalCount === 1 ? 'listing' : 'listings'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/settings')}
                  className="flex items-center gap-2 rounded-xl border border-[#E8E2D8] px-3 py-2 text-sm font-semibold text-[#1A3353] transition-colors hover:bg-[#F8F6F1]"
                >
                  <Settings size={15} /> Edit profile
                </button>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6E7A8A]">
                {user?.bio || 'Add a short introduction in your profile settings so buyers can learn more about you.'}
              </p>
              {user?.location && <p className="mt-2 text-xs text-[#6E7A8A]">{user.location}</p>}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0F1923]">Your catalog</h2>
                <p className="mt-0.5 text-xs text-[#6E7A8A]">Active listings shown together in your storefront</p>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceView('listings')}
                className="flex items-center gap-1 text-xs font-semibold text-[#1A3353] hover:underline"
              >
                Manage listings <ArrowUpRight size={13} />
              </button>
            </div>
            {listings.filter(listing => listing.status === 'active').length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {listings.filter(listing => listing.status === 'active').map(listing => {
                  const { label, icon: Icon, accent, accentBg } = SECTION_META[listing.section];
                  const CardRenderer = CARD_RENDERERS[listing.section];
                  return (
                    <div key={listing.id} className="rounded-2xl border border-[#E8E2D8] bg-white p-4 shadow-sm">
                      <div className="pt-7">
                        <CardRenderer data={listing.data} />
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 border-t border-[#F0EBE1] pt-3 text-[11px] font-semibold" style={{ color: accent }}>
                        <Icon size={12} />
                        <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: accentBg }}>{label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#D8D0C2] bg-white px-5 py-12 text-center">
                <Store size={24} className="mx-auto text-[#C9A96E]" />
                <p className="mt-3 text-sm font-semibold text-[#0F1923]">Your catalog is ready for its first listing</p>
                <p className="mt-1 text-xs text-[#6E7A8A]">Publish a listing to start building your storefront.</p>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/marketplace')}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1A3353] px-4 py-2 text-sm font-semibold text-white hover:bg-[#24466e]"
                >
                  <Plus size={15} /> Create a listing
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {([
                ['all', 'All', totalCount],
                ['active', 'Active', statusCounts.active],
                ['paused', 'Paused', statusCounts.paused],
                ['sold', 'Sold', statusCounts.sold],
                ['pending_review', 'In review', listings.filter(listing => listing.status === 'pending_review').length],
                ['flagged', 'Flagged', listings.filter(listing => listing.status === 'flagged').length],
                ['rejected', 'Rejected', listings.filter(listing => listing.status === 'rejected').length],
              ] as [ListingStatus | 'all', string, number][]).filter(([, , count]) => count > 0 || statusFilter === 'all').map(([status, label, count]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter === status
                      ? 'border-[#1A3353] bg-[#1A3353] text-white'
                      : 'border-[#E8E2D8] bg-white text-[#6E7A8A] hover:border-[#1A3353]'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
            <label className="flex max-w-md items-center gap-2 rounded-xl border border-[#E8E2D8] bg-white px-3 py-2.5 focus-within:border-[#1A3353]">
              <Search size={16} className="shrink-0 text-[#6E7A8A]" />
              <input
                type="search"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search your listings"
                className="w-full bg-transparent text-sm text-[#0F1923] outline-none placeholder:text-[#9AA3AE]"
                aria-label="Search your listings"
              />
            </label>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveFilter('all')}
              className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: activeFilter === 'all' ? '#1A3353' : '#ffffff',
                color: activeFilter === 'all' ? '#ffffff' : '#6E7A8A',
                borderColor: activeFilter === 'all' ? '#1A3353' : '#E8E2D8',
              }}
            >
              All categories ({totalCount})
            </button>
            {SECTION_ORDER.filter(s => countBySection[s] > 0).map(s => {
              const { label, icon: Icon, accent, accentBg } = SECTION_META[s];
              const isActive = activeFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setActiveFilter(s)}
                  className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: isActive ? accentBg : '#ffffff',
                    color: isActive ? accent : '#6E7A8A',
                    borderColor: isActive ? `${accent}55` : '#E8E2D8',
                  }}
                >
                  <Icon size={12} />
                  {label} ({countBySection[s]})
                </button>
              );
            })}
          </div>

          {displayedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D8D0C2] bg-white px-5 py-16 text-center">
              <Package size={30} className="text-[#C9A96E]" />
              <h2 className="mt-4 text-base font-bold text-[#0F1923]">
                {totalCount === 0 ? 'No listings yet' : 'No listings match these filters'}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-[#6E7A8A]">
                {totalCount === 0
                  ? 'Create your first listing and it will appear here for you to manage.'
                  : 'Try another category or status, or clear your search to see more listings.'}
              </p>
              {totalCount === 0 ? (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/marketplace')}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1A3353] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#24466e]"
                >
                  <Plus size={15} /> Create your first listing
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setActiveFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
                  className="mt-4 text-sm font-semibold text-[#1A3353] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {(activeFilter === 'all' ? SECTION_ORDER : [activeFilter]).map(section => {
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
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 opacity-100 transition-all duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
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
                    <ListingEngagementPanel listing={listing} />
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
                        {listing.promotionEndAt && new Date(listing.promotionEndAt).getTime() > Date.now() && (
                          <span className="rounded-full bg-[#FFF7E6] px-2 py-0.5 text-[10px] font-semibold text-[#9A6700]">
                            Featured
                          </span>
                        )}
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
          )}
        </>
      )}
    </div>
  );
}
