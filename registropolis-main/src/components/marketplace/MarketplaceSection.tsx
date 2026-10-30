import React, { useState, useEffect } from 'react';
import { Search, Plus, Heart, MessageCircle, MapPin, CheckCircle2, Star, SlidersHorizontal, X, ChevronDown, Pin, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import CreateListingModal from '@/components/shared/CreateListingModal';
import { useUserListings } from '@/context/UserListingsContext';
import { useChatContext } from '@/context/ChatContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSaved } from '@/context/SavedContext';
import { listingDetailPath } from '@/lib/utils';
import { useReviews } from '@/context/ReviewsContext';
import { useSellerCompare, buildPinnedSeller } from '@/context/SellerCompareContext';
import { usePriceAlerts } from '@/context/PriceAlertContext';
import { useLocalization } from '@/i18n/LocalizationContext';

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Home & Living', 'Sports', 'Vehicles', 'Books'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'discount', label: 'Biggest discount' },
];

const COND: Record<string,{ bg:string; text:string; border:string }> = {
  'New':      { bg:'#F0FDF4', text:'#15803D', border:'#BBF7D0' },
  'Like New': { bg:'#EFF6FF', text:'#1D4ED8', border:'#BFDBFE' },
  'Good':     { bg:'#FFFBEB', text:'#B45309', border:'#FDE68A' },
  'Fair':     { bg:'#FFF7ED', text:'#C2410C', border:'#FED7AA' },
};

function formatTimeAgo(value?: Date | string): string {
  if (!value) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function MarketplaceSection() {
  const { t } = useLocalization();
  const [searchParams] = useSearchParams();
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch] = useState(() => searchParams.get('search') || '');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const [showModal, setShowModal] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const { getListingsForSection, addListing } = useUserListings();
  const { openChatWithListing, getUnreadForListing } = useChatContext();
  const userListings = getListingsForSection('marketplace');
  const navigate = useNavigate();
  const { isSaved, toggleSaved } = useSaved();
  const { getRatingStats } = useReviews();
  const { isPinned, pin, unpin } = useSellerCompare();
  const { isWatched, addWatch, removeWatch: removeWatchAlert } = usePriceAlerts();

  const allProducts = userListings;

  const applyFilters = () => {
    let count = 0;
    if (priceRange[0] > 0 || priceRange[1] < 5000) count++;
    if (selectedConditions.length > 0) count++;
    if (sortBy !== 'newest') count++;
    setActiveFiltersCount(count);
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setPriceRange([0, 5000]);
    setSelectedConditions([]);
    setSortBy('newest');
    setActiveFiltersCount(0);
    setFilterOpen(false);
  };

  const toggleCondition = (c: string) => {
    setSelectedConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  let filtered = allProducts.filter(p =>
    (activeCat === 'All' || p.category === activeCat) &&
    p.title.toLowerCase().includes(search.toLowerCase()) &&
    p.price >= priceRange[0] && p.price <= priceRange[1] &&
    (selectedConditions.length === 0 || selectedConditions.includes(p.condition))
  );

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'rating') return (b.sellerRating ?? 0) - (a.sellerRating ?? 0);
    if (sortBy === 'discount') {
      const da = a.originalPrice > a.price ? (a.originalPrice - a.price) / a.originalPrice : 0;
      const db = b.originalPrice > b.price ? (b.originalPrice - b.price) / b.originalPrice : 0;
      return db - da;
    }
    return 0;
  });

  const handleNewListing = (data: any) => {
    const item = {
      id: `u_${Date.now()}`,
      ...data,
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
      image: data.imageUrl,
    };
    return addListing('marketplace', item);
  };

  return (
    <div className="section-padding space-y-6">
      {/* Filter Drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setFilterOpen(false)}>
          <div className="flex-1" style={{ backgroundColor: 'rgba(15,25,35,0.45)' }} />
          <div
            className="w-80 h-full flex flex-col shadow-2xl overflow-y-auto"
            style={{ backgroundColor: '#fff', borderLeft: '1px solid #E8E2D8' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F0EBE1' }}>
              <h3 className="font-bold text-base" style={{ color: '#0F1923' }}>Filters</h3>
              <button onClick={() => setFilterOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A' }}>
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 px-5 py-5 space-y-6">
              {/* Price range */}
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#0F1923' }}>Price Range</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-medium block mb-1" style={{ color: '#6E7A8A' }}>Min ($)</label>
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2"
                      style={{ backgroundColor: '#F9F7F4', border: '1px solid #E8E2D8', color: '#0F1923', '--tw-ring-color': '#C9A96E' } as React.CSSProperties}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-medium block mb-1" style={{ color: '#6E7A8A' }}>Max ($)</label>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2"
                      style={{ backgroundColor: '#F9F7F4', border: '1px solid #E8E2D8', color: '#0F1923', '--tw-ring-color': '#C9A96E' } as React.CSSProperties}
                    />
                  </div>
                </div>
                {/* Quick price presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[['Under $100', 0, 100], ['$100–$500', 100, 500], ['$500–$1500', 500, 1500], ['$1500+', 1500, 5000]].map(([label, min, max]) => (
                    <button
                      key={label as string}
                      onClick={() => setPriceRange([min as number, max as number])}
                      className="text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors"
                      style={{
                        backgroundColor: priceRange[0] === min && priceRange[1] === max ? '#1A3353' : '#F5F2EC',
                        color: priceRange[0] === min && priceRange[1] === max ? '#fff' : '#6E7A8A',
                        border: '1px solid #E8E2D8',
                      }}
                    >
                      {label as string}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#0F1923' }}>Condition</p>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map(c => {
                    const cond = COND[c];
                    const active = selectedConditions.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleCondition(c)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: active ? cond.bg : '#F9F7F4',
                          color: active ? cond.text : '#6E7A8A',
                          border: `1px solid ${active ? cond.border : '#E8E2D8'}`,
                        }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort */}
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#0F1923' }}>Sort By</p>
                <div className="space-y-1.5">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all"
                      style={{
                        backgroundColor: sortBy === opt.value ? '#F0EBE1' : '#F9F7F4',
                        color: sortBy === opt.value ? '#1A3353' : '#6E7A8A',
                        border: `1px solid ${sortBy === opt.value ? '#C9A96E' : '#E8E2D8'}`,
                        fontWeight: sortBy === opt.value ? 600 : 400,
                      }}
                    >
                      {opt.label}
                      {sortBy === opt.value && <span style={{ color: '#C9A96E' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 flex gap-2.5" style={{ borderTop: '1px solid #F0EBE1' }}>
              <button
                onClick={resetFilters}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A', border: '1px solid #E8E2D8' }}
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="flex-2 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ backgroundColor: '#1A3353', color: '#fff' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="section-header">
        <div>
          <div className="gold-accent mb-3" />
          <h1 className="text-2xl font-bold" style={{ color:'#0F1923', letterSpacing:'-0.03em' }}>{t('Marketplace')}</h1>
          <p className="text-sm mt-1" style={{ color:'#6E7A8A' }}>Discover curated deals from your community</p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ backgroundColor:'#1A3353', color:'#ffffff' }}
          onClick={() => setShowModal(true)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#142842'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 14px rgba(26,51,83,0.25)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (e.currentTarget as HTMLElement).style.boxShadow=''; }}
        >
          <Plus size={15} strokeWidth={2.5} /> List an Item
        </button>
        <CreateListingModal type="marketplace" open={showModal} onClose={() => setShowModal(false)} onSubmit={handleNewListing} />
      </div>

      {/* Search + filter row */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color:'#6E7A8A' }} />
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search marketplace…"
            className="w-full pl-10 pr-4 h-10 rounded-xl text-sm transition-shadow focus:outline-none focus:ring-2"
            style={{ backgroundColor:'#ffffff', border:'1px solid #E8E2D8', color:'#0F1923', '--tw-ring-color':'#C9A96E' } as React.CSSProperties}
          />
        </div>
        <div className="flex gap-2 items-center">
          {/* Sort quick select */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 cursor-pointer"
              style={{ backgroundColor:'#ffffff', border:'1px solid #E8E2D8', color:'#0F1923', '--tw-ring-color':'#C9A96E' } as React.CSSProperties}
            >
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'#6E7A8A' }} />
          </div>

          {/* Filters button */}
          <button
            onClick={() => setFilterOpen(true)}
            className="relative flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeFiltersCount > 0 ? '#F0EBE1' : '#ffffff',
              border: activeFiltersCount > 0 ? '1px solid #C9A96E' : '1px solid #E8E2D8',
              color: activeFiltersCount > 0 ? '#1A3353' : '#6E7A8A',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#C9A96E'; (e.currentTarget as HTMLElement).style.color='#C9A96E'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor= activeFiltersCount > 0 ? '#C9A96E' : '#E8E2D8'; (e.currentTarget as HTMLElement).style.color= activeFiltersCount > 0 ? '#1A3353' : '#6E7A8A'; }}
          >
            <SlidersHorizontal size={14} /> Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold" style={{ backgroundColor: '#C9A96E', fontSize: '9px' }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active filter summary */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium" style={{ color: '#6E7A8A' }}>Active filters:</span>
          {(priceRange[0] > 0 || priceRange[1] < 5000) && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F0EBE1', color: '#1A3353', border: '1px solid #E8D9BC' }}>
              ${priceRange[0].toLocaleString()} – ${priceRange[1].toLocaleString()}
            </span>
          )}
          {selectedConditions.map(c => (
            <span key={c} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F0EBE1', color: '#1A3353', border: '1px solid #E8D9BC' }}>
              {c}
            </span>
          ))}
          <button onClick={resetFilters} className="text-xs font-medium transition-colors" style={{ color: '#B91C1C' }}>
            Clear all
          </button>
        </div>
      )}

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={()=>setActiveCat(cat)} className={cn('chip', activeCat===cat ? 'chip-active' : 'chip-default')}>
            {cat}
          </button>
        ))}
      </div>

      <p className="text-xs font-medium" style={{ color:'#6E7A8A' }}>{filtered.length} items</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(p => {
          const cond = COND[p.condition] ?? { bg:'#F5F2EC', text:'#6E7A8A', border:'#E8E2D8' };
          const discount = p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
          const reviewStats = getRatingStats(p.id, 'marketplace');
          return (
            <div key={p.id} className="card-premium group cursor-pointer overflow-hidden" onClick={() => navigate(listingDetailPath('marketplace', p.id, p), { state: { listing: p } })}>
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor:'#F5F2EC' }}>
                <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {discount > 0 && (
                  <div className="absolute top-3 left-3">
                    <span className="text-[11px] font-bold px-2 py-1 rounded-lg" style={{ backgroundColor:'#C9A96E', color:'#0F1923' }}>
                      −{discount}%
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                  <button
                    onClick={e=>{e.stopPropagation(); toggleSaved('marketplace', p);}}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor:'rgba(255,255,255,0.96)', boxShadow:'0 1px 4px rgba(15,25,35,0.12)' }}
                    title={isSaved('marketplace', p.id) ? 'Unsave' : 'Save'}
                  >
                    <Heart size={14} className={isSaved('marketplace', p.id) ? 'fill-red-500 text-red-500' : ''} style={{ color: isSaved('marketplace', p.id) ? undefined : '#6E7A8A' }} />
                  </button>
                  <button
                    onClick={e=>{e.stopPropagation(); isWatched('marketplace', p.id) ? removeWatchAlert('marketplace', p.id) : addWatch('marketplace', { id: p.id, title: p.title, image: p.image, seller: p.seller, price: p.price });}}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: isWatched('marketplace', p.id) ? 'rgba(201,169,110,0.95)' : 'rgba(255,255,255,0.96)', boxShadow:'0 1px 4px rgba(15,25,35,0.12)' }}
                    title={isWatched('marketplace', p.id) ? 'Stop watching price' : 'Watch for price drop'}
                  >
                    <Bell size={13} style={{ color: isWatched('marketplace', p.id) ? '#0F1923' : '#6E7A8A' }} className={isWatched('marketplace', p.id) ? 'fill-[#0F1923]' : ''} />
                  </button>
                </div>
                {p.verified && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor:'rgba(255,255,255,0.96)', color:'#1A3353' }}>
                    <CheckCircle2 size={11} style={{ color:'#C9A96E' }} /> Verified
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm leading-tight flex-1 line-clamp-2" style={{ color:'#0F1923' }}>{p.title}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border flex-shrink-0" style={{ backgroundColor:cond.bg, color:cond.text, borderColor:cond.border }}>
                    {p.condition}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-lg font-bold" style={{ color:'#0F1923' }}>${p.price.toLocaleString()}</span>
                  {p.originalPrice > p.price && <span className="text-sm line-through" style={{ color:'#6E7A8A' }}>${p.originalPrice.toLocaleString()}</span>}
                </div>

                {/* Live rating from reviews */}
                {reviewStats.count > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={10} className={s <= Math.round(reviewStats.avg) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color:'#6E7A8A' }}>{reviewStats.avg.toFixed(1)} ({reviewStats.count})</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs mb-3" style={{ color:'#6E7A8A' }}>
                  <MapPin size={11} className="shrink-0" />
                  <span className="truncate">{p.location}</span>
                  <span className="ml-auto shrink-0">{formatTimeAgo(p.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop:'1px solid #E8E2D8' }}>
                  <div className="flex items-center gap-1">
                    <button
                      className="flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors"
                      style={{ background: 'none' }}
                      onClick={e => { e.stopPropagation(); navigate(`/dashboard/seller/${encodeURIComponent(p.userId ?? p.seller)}`); }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0EBE1')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      title={`View ${p.seller}'s profile`}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ backgroundColor:'#1A3353', color:'#C9A96E' }}>
                        {p.seller[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold leading-none" style={{ color:'#0F1923' }}>{p.seller}</p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          <span className="text-[10px]" style={{ color:'#6E7A8A' }}>{p.sellerRating}</span>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (isPinned(p.seller)) {
                          unpin(p.seller);
                        } else {
                          pin(buildPinnedSeller(p.seller, userListings));
                        }
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: isPinned(p.seller) ? '#F0EBE1' : 'transparent',
                        color: isPinned(p.seller) ? '#C9A96E' : '#6E7A8A',
                        border: isPinned(p.seller) ? '1px solid #E8D9BC' : '1px solid transparent',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F0EBE1'; (e.currentTarget as HTMLElement).style.color = '#C9A96E'; (e.currentTarget as HTMLElement).style.borderColor = '#E8D9BC'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isPinned(p.seller) ? '#F0EBE1' : 'transparent'; (e.currentTarget as HTMLElement).style.color = isPinned(p.seller) ? '#C9A96E' : '#6E7A8A'; (e.currentTarget as HTMLElement).style.borderColor = isPinned(p.seller) ? '#E8D9BC' : 'transparent'; }}
                      title={isPinned(p.seller) ? 'Unpin seller' : 'Pin to compare'}
                    >
                      <Pin size={11} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openChatWithListing({
                          listingId: p.id,
                          listingTitle: p.title,
                          listingPrice: `$${p.price.toLocaleString()}`,
                          listingImage: p.image,
                          listingCategory: 'Marketplace',
                          sellerName: p.seller,
                          sellerId: p.userId,
                          triggerOffer: true,
                        });
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ backgroundColor:'#F0EBE1', color:'#1A3353', border:'1px solid #E8D9BC' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#C9A96E'; (e.currentTarget as HTMLElement).style.color='#0F1923'; (e.currentTarget as HTMLElement).style.borderColor='#C9A96E'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#F0EBE1'; (e.currentTarget as HTMLElement).style.color='#1A3353'; (e.currentTarget as HTMLElement).style.borderColor='#E8D9BC'; }}
                      title="Make an Offer"
                    >
                      💰 Offer
                    </button>
                    <div className="relative">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          openChatWithListing({
                            listingId: p.id,
                            listingTitle: p.title,
                            listingPrice: `$${p.price.toLocaleString()}`,
                            listingImage: p.image,
                            listingCategory: 'Marketplace',
                            sellerName: p.seller,
                            sellerId: p.userId,
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ backgroundColor:'#1A3353', color:'#ffffff' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#142842'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 12px rgba(26,51,83,0.25)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (e.currentTarget as HTMLElement).style.boxShadow=''; }}
                      >
                        <MessageCircle size={11} /> Chat
                      </button>
                      {getUnreadForListing(p.id, 'Marketplace') > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white font-bold pointer-events-none" style={{ backgroundColor:'#E53E3E', fontSize:'9px', padding:'0 3px' }}>
                          {getUnreadForListing(p.id, 'Marketplace')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="empty-state-icon"><Search size={26} style={{ color:'#6E7A8A' }} /></div>
          <h3 className="font-semibold mb-1" style={{ color:'#0F1923' }}>No results found</h3>
          <p className="text-sm mb-3" style={{ color:'#6E7A8A' }}>Try a different search, category, or filter</p>
          {activeFiltersCount > 0 && (
            <button onClick={resetFilters} className="text-sm font-semibold px-4 py-2 rounded-xl" style={{ backgroundColor: '#F0EBE1', color: '#1A3353' }}>
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
