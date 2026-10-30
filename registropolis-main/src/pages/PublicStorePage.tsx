import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, MapPin, MessageCircle, Share2, Store,
  Search, QrCode, Phone, Mail, Globe, Check, X, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { sellerWorkspaceAPI, type PublicStore, type PublicStoreListing } from '@/services/sellerWorkspaceService';
import { listingDetailPath } from '@/lib/utils';
import { useChatContext } from '@/context/ChatContext';
import { QRCodeSvg } from '@/components/common/QRCodeSvg';

export default function PublicStorePage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { openChatWithListing } = useChatContext();

  const [store, setStore] = useState<PublicStore | null>(null);
  const [listings, setListings] = useState<PublicStoreListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Interactive filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');
    sellerWorkspaceAPI.getPublicStore(slug)
      .then(result => {
        if (!active) return;
        setStore(result.store);
        setListings(result.listings);
      })
      .catch(error => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Could not load this storefront';
        setLoadError(message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  const categories = useMemo(() => {
    const set = new Set(listings.map(l => l.section));
    return Array.from(set);
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      const matchesCategory = selectedCategory === 'all' || l.section === selectedCategory;
      const title = String(l.data?.title ?? l.data?.name ?? '').toLowerCase();
      const desc = String(l.data?.description ?? '').toLowerCase();
      const cat = String(l.data?.category ?? '').toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || title.includes(q) || desc.includes(q) || cat.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [listings, selectedCategory, searchQuery]);

  const shareStore = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: store?.name || 'Buzzer Storefront',
          text: store?.tagline || `Visit ${store?.name} on Buzzer`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success('Store link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Store link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartChat = () => {
    if (!store) return;
    const firstListing = listings[0];
    openChatWithListing({
      listingId: firstListing ? firstListing.id : `store_${store.id}`,
      listingTitle: firstListing ? String(firstListing.data?.title || firstListing.data?.name || `Inquiry with ${store.name}`) : `Inquiry with ${store.name}`,
      listingPrice: String(firstListing?.data?.priceDisplay || (firstListing?.data?.price ? `$${firstListing.data.price}` : '')),
      listingImage: firstListing?.data?.image ? String(firstListing.data.image) : store.logoUrl,
      listingCategory: firstListing?.section || 'marketplace',
      sellerName: store.name,
      sellerId: store.id,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F7F4] text-sm text-[#6E7A8A]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#1A3353] border-t-transparent" />
          <p className="font-semibold text-[#1A3353]">Opening storefront...</p>
        </div>
      </div>
    );
  }

  if (!store || loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F9F7F4] px-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EBE1] text-[#C9A96E]">
          <Store size={32} />
        </div>
        <h1 className="text-xl font-bold text-[#0F1923]">{loadError ? 'Storefront unavailable' : 'Store not found'}</h1>
        <p className="max-w-md text-sm text-[#6E7A8A]">
          {loadError || 'This store may have moved, been renamed, or is currently taking a break.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/marketplace')}
          className="mt-3 rounded-xl bg-[#1A3353] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#23456d]"
        >
          Browse City Marketplace
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9F7F4] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl border border-[#E8E2D8] bg-white px-3.5 py-2 text-sm font-semibold text-[#1A3353] shadow-xs transition-colors hover:bg-[#F5F2EC]"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#E8E2D8] bg-white px-3.5 py-2 text-sm font-semibold text-[#1A3353] shadow-xs transition-colors hover:bg-[#F5F2EC]"
            >
              <QrCode size={15} /> QR Code
            </button>
            <button
              type="button"
              onClick={() => void shareStore()}
              className="flex items-center gap-1.5 rounded-xl bg-[#1A3353] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#23456d]"
            >
              {copied ? <Check size={15} className="text-emerald-300" /> : <Share2 size={15} />}
              {copied ? 'Copied' : 'Share store'}
            </button>
          </div>
        </div>

        {/* Storefront Hero Banner */}
        <section className="overflow-hidden rounded-3xl border border-[#E8E2D8] bg-white shadow-sm">
          <div
            className="h-44 bg-gradient-to-r from-[#1A3353] via-[#34516E] to-[#C9A96E] bg-cover bg-center sm:h-64"
            style={store.bannerUrl ? { backgroundImage: `linear-gradient(90deg, rgba(26,51,83,.6), rgba(52,81,110,.25)), url("${store.bannerUrl}")` } : undefined}
          />
          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-3.5">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[#F0EBE1] text-3xl font-extrabold text-[#1A3353] shadow-md">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
                  ) : (
                    store.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="pb-1.5">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight text-[#0F1923] sm:text-2xl">{store.name}</h1>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      Verified Merchant
                    </span>
                  </div>
                  {store.tagline && <p className="mt-0.5 text-sm text-[#6E7A8A]">{store.tagline}</p>}
                </div>
              </div>

              {/* Contact & Chat Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartChat}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1A3353] px-4 py-2.5 text-sm font-semibold text-white shadow transition-all hover:bg-[#23456d] active:scale-95"
                >
                  <MessageCircle size={16} /> Chat with seller
                </button>
                {store.contactPhone && (
                  <a
                    href={`tel:${store.contactPhone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E2D8] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1A3353] hover:bg-[#F8F6F1]"
                  >
                    <Phone size={14} /> Call
                  </a>
                )}
              </div>
            </div>

            {/* Merchant Details Row */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#F0EBE1] pt-4 text-xs font-medium text-[#6E7A8A]">
              {store.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} className="text-[#C9A96E]" /> {store.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1 font-semibold text-[#0F1923]">
                <Store size={13} className="text-[#1A3353]" />
                {store.listingCount} {store.listingCount === 1 ? 'active listing' : 'active listings'}
              </span>
              {store.website && (
                <a
                  href={store.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#1A3353] hover:underline"
                >
                  <Globe size={13} /> Official Website <ExternalLink size={11} />
                </a>
              )}
              {store.email && (
                <a href={`mailto:${store.email}`} className="inline-flex items-center gap-1 text-[#1A3353] hover:underline">
                  <Mail size={13} /> {store.email}
                </a>
              )}
            </div>

            {store.description && (
              <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-[#52606D]">
                {store.description}
              </p>
            )}
          </div>
        </section>

        {/* Storefront Catalog Section */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0F1923]">Available Listings</h2>
              <p className="mt-0.5 text-xs text-[#6E7A8A]">
                Browse items, bookings, and services offered by {store.name}
              </p>
            </div>

            {/* In-Store Search */}
            <div className="flex items-center gap-2 rounded-xl border border-[#E8E2D8] bg-white px-3 py-2 sm:w-72">
              <Search size={15} className="text-[#6E7A8A]" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search this shop..."
                className="w-full bg-transparent text-sm text-[#0F1923] outline-none placeholder:text-[#9AA3AE]"
              />
            </div>
          </div>

          {/* Category Filter Pills (if merchant has multi-sector inventory) */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-all ${
                  selectedCategory === 'all'
                    ? 'border-[#1A3353] bg-[#1A3353] text-white shadow-xs'
                    : 'border-[#E8E2D8] bg-white text-[#6E7A8A] hover:border-[#1A3353]'
                }`}
              >
                All items ({listings.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full border px-3.5 py-1 text-xs font-semibold capitalize transition-all ${
                    selectedCategory === cat
                      ? 'border-[#1A3353] bg-[#1A3353] text-white shadow-xs'
                      : 'border-[#E8E2D8] bg-white text-[#6E7A8A] hover:border-[#1A3353]'
                  }`}
                >
                  {cat} ({listings.filter(l => l.section === cat).length})
                </button>
              ))}
            </div>
          )}

          {/* Catalog Grid */}
          {filteredListings.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map(listing => {
                const data = listing.data;
                const title = String(data.title ?? data.name ?? 'Listing');
                const image = typeof data.image === 'string' ? data.image : '';
                const price = String(data.priceDisplay || (data.price ? `$${Number(data.price).toLocaleString()}` : '') || data.salary || data.rate || '');
                const location = data.location ?? data.address ?? '';
                const item = { ...data, id: listing.id, section: listing.section, userId: store.id, seller: store.name };

                return (
                  <button
                    key={listing.id}
                    type="button"
                    onClick={() => navigate(listingDetailPath(listing.section, listing.id, item), { state: { listing: item } })}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#E8E2D8] bg-white text-left shadow-xs transition-all hover:border-[#C9A96E]/60 hover:shadow-md"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F0EBE1]">
                      {image ? (
                        <img
                          src={image}
                          alt={title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#C9A96E]">
                          <Store size={32} />
                        </div>
                      )}
                      <span className="absolute top-2.5 left-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[#1A3353] shadow-xs backdrop-blur-xs">
                        {listing.section}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <p className="line-clamp-2 font-bold text-[#0F1923] group-hover:text-[#1A3353]">{title}</p>
                        {location !== '' && <p className="mt-1 truncate text-xs text-[#6E7A8A]">{String(location)}</p>}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-[#F0EBE1] pt-3">
                        <span className="text-base font-extrabold text-[#1A3353]">{price || 'Inquire'}</span>
                        <span className="text-xs font-semibold text-[#C9A96E] group-hover:underline">View item &rarr;</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D8D0C2] bg-white px-5 py-12 text-center text-sm text-[#6E7A8A]">
              {searchQuery ? 'No items match your search.' : 'This seller has no active listings in this category.'}
            </div>
          )}
        </section>
      </div>

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#E8E2D8] bg-white p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-[#C9A96E]" />
                <h3 className="font-bold text-[#0F1923]">{store.name} QR</h3>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="rounded-lg p-1 text-[#6E7A8A] hover:bg-[#F5F2EC]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="my-5 flex flex-col items-center text-center">
              <QRCodeSvg value={window.location.href} size={180} />
              <p className="mt-3 font-bold text-[#0F1923]">{store.name}</p>
              <p className="mt-0.5 text-xs text-[#6E7A8A]">Scan to browse catalog and message seller</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void shareStore()}
                className="flex-1 rounded-xl border border-[#E8E2D8] py-2 text-xs font-semibold text-[#1A3353] hover:bg-[#F8F6F1]"
              >
                Copy Link
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1A3353] py-2 text-xs font-semibold text-white hover:bg-[#24466e]"
              >
                <Download size={13} /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
