import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, CheckCircle2, Clock, ShoppingBag, Calendar,
  Shield, TrendingUp, MapPin, Heart, Tag, MessageCircle, X,
} from 'lucide-react';
import { useSellerCompare, PinnedSeller } from '@/context/SellerCompareContext';
import { useChatContext } from '@/context/ChatContext';
import { listingDetailPath } from '@/lib/utils';
import { useSaved } from '@/context/SavedContext';
import { MarketplaceListing } from '@/data/marketplaceData';
import { useLocalization } from '@/i18n/LocalizationContext';

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size} className={s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'} />
      ))}
    </div>
  );
}

function responseToMinutes(rt?: string): number | undefined {
  if (!rt) return undefined;
  if (rt.includes('30 min')) return 30;
  if (rt.includes('1 hour')) return 60;
  if (rt.includes('2 hour')) return 120;
  if (rt.includes('3 hour')) return 180;
  return undefined;
}

function memberSinceToYear(ms?: string): number | undefined {
  if (!ms) return undefined;
  const parts = ms.split(' ');
  return parts.length === 2 ? parseInt(parts[1]) : undefined;
}

const COND: Record<string, { bg: string; text: string; border: string }> = {
  'New':      { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  'Like New': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  'Good':     { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  'Fair':     { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
};

interface CompareRowProps {
  label: string;
  icon: React.ReactNode;
  a: React.ReactNode;
  b: React.ReactNode;
  winner?: 'a' | 'b' | null;
}

function CompareRow({ label, icon, a, b, winner }: CompareRowProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-0" style={{ borderBottom: '1px solid #F0EBE1' }}>
      <div
        className={`p-4 ${winner === 'a' ? 'rounded-l-xl' : ''}`}
        style={{ backgroundColor: winner === 'a' ? 'rgba(201,169,110,0.08)' : 'transparent' }}
      >
        {winner === 'a' && (
          <span className="block text-[10px] font-bold mb-1" style={{ color: '#C9A96E' }}>BETTER ✓</span>
        )}
        {a}
      </div>
      <div className="flex flex-col items-center px-3 py-4 shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1" style={{ backgroundColor: '#F5F2EC' }}>
          {icon}
        </div>
        <span className="text-[10px] font-semibold text-center" style={{ color: '#6E7A8A' }}>{label}</span>
      </div>
      <div
        className={`p-4 text-right ${winner === 'b' ? 'rounded-r-xl' : ''}`}
        style={{ backgroundColor: winner === 'b' ? 'rgba(201,169,110,0.08)' : 'transparent' }}
      >
        {winner === 'b' && (
          <span className="block text-[10px] font-bold mb-1 text-right" style={{ color: '#C9A96E' }}>✓ BETTER</span>
        )}
        {b}
      </div>
    </div>
  );
}

function SellerHeader({ seller, onUnpin, onMessage }: { seller: PinnedSeller; onUnpin: () => void; onMessage: () => void }) {
  return (
    <div className="rounded-2xl p-5 space-y-3 relative" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
      <button
        onClick={onUnpin}
        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
        style={{ backgroundColor: '#F5F2EC' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F5F2EC')}
        title="Remove from comparison"
      >
        <X size={11} style={{ color: '#6E7A8A' }} />
      </button>

      <div className="flex flex-col items-center text-center gap-2">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
          style={{ backgroundColor: '#1A3353', color: '#C9A96E' }}
        >
          {seller.name[0]}
        </div>
        <div>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h2 className="font-bold text-base" style={{ color: '#0F1923' }}>{seller.name}</h2>
            {seller.verified && <CheckCircle2 size={14} style={{ color: '#C9A96E' }} />}
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            {typeof seller.rating === 'number' ? (
              <>
                <StarRow rating={seller.rating} />
                <span className="text-sm font-bold" style={{ color: '#0F1923' }}>{seller.rating.toFixed(1)}</span>
              </>
            ) : <span className="text-xs" style={{ color: '#6E7A8A' }}>No rating yet</span>}
          </div>
        </div>
        <button
          onClick={onMessage}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold w-full justify-center transition-all"
          style={{ backgroundColor: '#1A3353', color: '#fff' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#142842')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1A3353')}
        >
          <MessageCircle size={13} /> Message
        </button>
      </div>
    </div>
  );
}

function MiniListingCard({ listing, navigate, isSaved, toggleSaved }: {
  listing: MarketplaceListing;
  navigate: (path: string, opts?: any) => void;
  isSaved: (section: string, id: string) => boolean;
  toggleSaved: (section: string, listing: MarketplaceListing) => void;
}) {
  const cond = COND[listing.condition] ?? { bg: '#F5F2EC', text: '#6E7A8A', border: '#E8E2D8' };
  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer group"
      style={{ border: '1px solid #E8E2D8' }}
      onClick={() => navigate(listingDetailPath('marketplace', listing.id, listing), { state: { listing } })}
    >
      <div className="relative" style={{ paddingBottom: '62%', position: 'relative', backgroundColor: '#F5F2EC' }}>
        <img
          src={listing.image}
          alt={listing.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <button
          onClick={e => { e.stopPropagation(); toggleSaved('marketplace', listing); }}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
        >
          <Heart size={11} className={isSaved('marketplace', listing.id) ? 'fill-red-500 text-red-500' : ''} style={{ color: isSaved('marketplace', listing.id) ? undefined : '#6E7A8A' }} />
        </button>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold line-clamp-1 mb-1" style={{ color: '#0F1923' }}>{listing.title}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: '#0F1923' }}>${listing.price.toLocaleString()}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: cond.bg, color: cond.text }}>
            {listing.condition}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SellerComparePage() {
  const { t } = useLocalization();
  const { pinned, unpin, clear } = useSellerCompare();
  const { openChatWithListing } = useChatContext();
  const { isSaved, toggleSaved } = useSaved();
  const navigate = useNavigate();

  const [a, b] = pinned;

  if (pinned.length < 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ backgroundColor: '#F9F7F4' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#F0EBE1' }}>
          <ShoppingBag size={28} style={{ color: '#C9A96E' }} />
        </div>
        <h2 className="text-lg font-bold" style={{ color: '#0F1923' }}>{t('Not enough sellers pinned')}</h2>
        <p className="text-sm text-center max-w-xs" style={{ color: '#6E7A8A' }}>
          Pin two sellers from the marketplace or their profile pages, then come back here to compare them side-by-side.
        </p>
        <button
          onClick={() => navigate('/dashboard/marketplace')}
          className="px-6 py-3 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: '#1A3353', color: '#fff' }}
        >
          Go to Marketplace
        </button>
      </div>
    );
  }

  const handleMessage = (seller: PinnedSeller) => {
    if (seller.listings.length > 0) {
      openChatWithListing({
        listingId: seller.listings[0].id,
        listingTitle: seller.listings[0].title,
        listingPrice: `$${seller.listings[0].price.toLocaleString()}`,
        listingImage: seller.listings[0].image,
        listingCategory: 'Marketplace',
        sellerName: seller.name,
        sellerUserId: (seller.listings[0] as any)?.userId ?? (seller as any).id,
      });
    }
  };

  const avgPrice = (s: PinnedSeller) =>
    s.listings.length > 0 ? Math.round(s.listings.reduce((sum, l) => sum + l.price, 0) / s.listings.length) : 0;

  const categories = (s: PinnedSeller) =>
    [...new Set(s.listings.map(l => l.category))];

  const rtA = responseToMinutes(a.meta.responseTime);
  const rtB = responseToMinutes(b.meta.responseTime);
  const msA = memberSinceToYear(a.meta.memberSince);
  const msB = memberSinceToYear(b.meta.memberSince);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
      {/* Sticky bar */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: 'rgba(249,247,244,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E8E2D8' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0EBE1')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
        >
          <ArrowLeft size={17} style={{ color: '#0F1923' }} />
        </button>
        <div className="flex-1">
          <span className="text-sm font-bold" style={{ color: '#0F1923' }}>Seller Comparison</span>
          <p className="text-xs" style={{ color: '#6E7A8A' }}>{a.name} vs {b.name}</p>
        </div>
        <button
          onClick={clear}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A', border: '1px solid #E8E2D8' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F5F2EC')}
        >
          Clear All
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Seller headers */}
        <div className="grid grid-cols-2 gap-4">
          <SellerHeader seller={a} onUnpin={() => { unpin(a.name); navigate(-1); }} onMessage={() => handleMessage(a)} />
          <SellerHeader seller={b} onUnpin={() => { unpin(b.name); navigate(-1); }} onMessage={() => handleMessage(b)} />
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
          <div className="px-4 py-3" style={{ backgroundColor: '#F5F2EC', borderBottom: '1px solid #E8E2D8' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6E7A8A' }}>Head-to-Head</h3>
          </div>

          <CompareRow
            label="Rating"
            icon={<Star size={14} style={{ color: '#6E7A8A' }} />}
            winner={a.rating != null && b.rating != null && a.rating !== b.rating ? a.rating > b.rating ? 'a' : 'b' : null}
            a={
              <div>
                {a.rating != null ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <StarRow rating={a.rating} />
                      <span className="text-sm font-bold" style={{ color: '#0F1923' }}>{a.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#6E7A8A' }}>{a.meta.totalSales ?? '—'} reviews</p>
                  </>
                ) : <span className="text-sm" style={{ color: '#6E7A8A' }}>No rating yet</span>}
              </div>
            }
            b={
              <div className="text-right">
                {b.rating != null ? (
                  <>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-sm font-bold" style={{ color: '#0F1923' }}>{b.rating.toFixed(1)}</span>
                      <StarRow rating={b.rating} />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#6E7A8A' }}>{b.meta.totalSales ?? '—'} reviews</p>
                  </>
                ) : <span className="text-sm" style={{ color: '#6E7A8A' }}>No rating yet</span>}
              </div>
            }
          />

          <CompareRow
            label="Reviews"
            icon={<ShoppingBag size={14} style={{ color: '#6E7A8A' }} />}
            winner={a.meta.totalSales != null && b.meta.totalSales != null && a.meta.totalSales !== b.meta.totalSales ? a.meta.totalSales > b.meta.totalSales ? 'a' : 'b' : null}
            a={<span className="text-base font-bold" style={{ color: '#0F1923' }}>{a.meta.totalSales ?? '—'}</span>}
            b={<span className="text-base font-bold text-right block" style={{ color: '#0F1923' }}>{b.meta.totalSales ?? '—'}</span>}
          />

          <CompareRow
            label="Response"
            icon={<Clock size={14} style={{ color: '#6E7A8A' }} />}
            winner={rtA != null && rtB != null && rtA !== rtB ? rtA < rtB ? 'a' : 'b' : null}
            a={<span className="text-sm font-semibold" style={{ color: '#0F1923' }}>{a.meta.responseTime ?? '—'}</span>}
            b={<span className="text-sm font-semibold text-right block" style={{ color: '#0F1923' }}>{b.meta.responseTime ?? '—'}</span>}
          />

          <CompareRow
            label="Member Since"
            icon={<Calendar size={14} style={{ color: '#6E7A8A' }} />}
            winner={msA != null && msB != null && msA !== msB ? msA < msB ? 'a' : 'b' : null}
            a={<span className="text-sm font-semibold" style={{ color: '#0F1923' }}>{a.meta.memberSince ?? '—'}</span>}
            b={<span className="text-sm font-semibold text-right block" style={{ color: '#0F1923' }}>{b.meta.memberSince ?? '—'}</span>}
          />

          <CompareRow
            label="Listings"
            icon={<Tag size={14} style={{ color: '#6E7A8A' }} />}
            winner={a.listings.length > b.listings.length ? 'a' : b.listings.length > a.listings.length ? 'b' : null}
            a={
              <div>
                <span className="text-base font-bold" style={{ color: '#0F1923' }}>{a.listings.length} active</span>
                {a.listings.length > 0 && <p className="text-xs" style={{ color: '#6E7A8A' }}>avg ${avgPrice(a).toLocaleString()}</p>}
              </div>
            }
            b={
              <div className="text-right">
                <span className="text-base font-bold" style={{ color: '#0F1923' }}>{b.listings.length} active</span>
                {b.listings.length > 0 && <p className="text-xs" style={{ color: '#6E7A8A' }}>avg ${avgPrice(b).toLocaleString()}</p>}
              </div>
            }
          />

          <CompareRow
            label="Verified"
            icon={<Shield size={14} style={{ color: '#6E7A8A' }} />}
            winner={a.verified && !b.verified ? 'a' : !a.verified && b.verified ? 'b' : null}
            a={
              a.verified
                ? <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: '#15803D' }}><CheckCircle2 size={14} /> Verified</span>
                : <span className="text-sm" style={{ color: '#6E7A8A' }}>Not verified</span>
            }
            b={
              b.verified
                ? <span className="flex items-center gap-1 text-sm font-semibold justify-end" style={{ color: '#15803D' }}><CheckCircle2 size={14} /> Verified</span>
                : <span className="text-sm text-right block" style={{ color: '#6E7A8A' }}>Not verified</span>
            }
          />

          <CompareRow
            label="Categories"
            icon={<MapPin size={14} style={{ color: '#6E7A8A' }} />}
            winner={null}
            a={
              <div className="flex flex-wrap gap-1">
                {categories(a).map(c => (
                  <span key={c} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0EBE1', color: '#1A3353' }}>{c}</span>
                ))}
                {categories(a).length === 0 && <span className="text-xs" style={{ color: '#6E7A8A' }}>—</span>}
              </div>
            }
            b={
              <div className="flex flex-wrap gap-1 justify-end">
                {categories(b).map(c => (
                  <span key={c} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0EBE1', color: '#1A3353' }}>{c}</span>
                ))}
                {categories(b).length === 0 && <span className="text-xs" style={{ color: '#6E7A8A' }}>—</span>}
              </div>
            }
          />
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 gap-4">
          {[a, b].map((seller, idx) => (
            <div key={seller.name} className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#6E7A8A' }}>Badges</p>
              <div className="flex flex-col gap-1.5">
                {seller.verified && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
                    <Shield size={11} /> Identity Verified
                  </span>
                )}
                {seller.meta.totalSales != null && seller.meta.totalSales > 50 && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                    <TrendingUp size={11} /> Top Seller
                  </span>
                )}
                {seller.rating != null && seller.rating >= 4.8 && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>
                    <Star size={11} className="fill-amber-400 text-amber-400" /> Top Rated
                  </span>
                )}
                {!seller.verified && (seller.meta.totalSales == null || seller.meta.totalSales <= 50) && (seller.rating == null || seller.rating < 4.8) && (
                  <span className="text-xs" style={{ color: '#6E7A8A' }}>No badges yet</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Listings side-by-side */}
        <div className="grid grid-cols-2 gap-4">
          {[a, b].map(seller => (
            <div key={seller.name}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#6E7A8A' }}>
                {seller.name.split(' ')[0]}'s Listings
              </p>
              {seller.listings.length === 0 ? (
                <div className="rounded-xl flex items-center justify-center py-10" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
                  <p className="text-xs" style={{ color: '#6E7A8A' }}>No listings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {seller.listings.map(l => (
                    <MiniListingCard key={l.id} listing={l} navigate={navigate} isSaved={isSaved} toggleSaved={toggleSaved} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom padding for compare bar */}
        <div className="h-20" />
      </div>
    </div>
  );
}
