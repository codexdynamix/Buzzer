import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MapPin, MessageCircle, Share2, Store } from 'lucide-react';
import { toast } from 'sonner';
import { sellerWorkspaceAPI, type PublicStore, type PublicStoreListing } from '@/services/sellerWorkspaceService';
import { listingDetailPath } from '@/lib/utils';

export default function PublicStorePage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<PublicStore | null>(null);
  const [listings, setListings] = useState<PublicStoreListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

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

  const shareStore = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Store link copied');
    } catch (error) {
      console.error('Could not copy storefront link:', error);
      toast.error('Could not copy the store link');
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-[#6E7A8A]">Loading storefront…</div>;
  }
  if (!store || loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F9F7F4] px-5 text-center">
        <Store size={32} className="text-[#C9A96E]" />
        <h1 className="text-lg font-bold text-[#0F1923]">{loadError ? 'Storefront unavailable' : 'Store not found'}</h1>
        <p className="max-w-md text-sm text-[#6E7A8A]">{loadError || 'This store may have moved or been removed.'}</p>
        <button type="button" onClick={() => navigate('/dashboard/marketplace')} className="mt-2 text-sm font-semibold text-[#1A3353]">
          Browse listings
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9F7F4] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-[#1A3353]">
            <ArrowLeft size={16} /> Back
          </button>
          <button type="button" onClick={() => void shareStore()} className="flex items-center gap-2 rounded-xl border border-[#E8E2D8] bg-white px-3 py-2 text-sm font-semibold text-[#1A3353]">
            <Share2 size={15} /> Share store
          </button>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#E8E2D8] bg-white">
          <div
            className="h-36 bg-gradient-to-r from-[#1A3353] via-[#34516E] to-[#C9A96E] bg-cover bg-center sm:h-52"
            style={store.bannerUrl ? { backgroundImage: `linear-gradient(90deg, rgba(26,51,83,.58), rgba(52,81,110,.25)), url("${store.bannerUrl}")` } : undefined}
          />
          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-3">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[#F0EBE1] text-2xl font-bold text-[#1A3353] shadow-sm">
                  {store.logoUrl ? <img src={store.logoUrl} alt="" className="h-full w-full object-cover" /> : store.name.charAt(0).toUpperCase()}
                </div>
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-[#0F1923] sm:text-2xl">{store.name}</h1>
                  {store.tagline && <p className="mt-0.5 text-sm text-[#6E7A8A]">{store.tagline}</p>}
                </div>
              </div>
              {store.contactPhone && (
                <a href={`tel:${store.contactPhone}`} className="inline-flex items-center gap-2 rounded-xl bg-[#1A3353] px-4 py-2.5 text-sm font-semibold text-white">
                  <MessageCircle size={15} /> Contact seller
                </a>
              )}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#6E7A8A]">
              {store.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{store.location}</span>}
              <span>{store.listingCount} active {store.listingCount === 1 ? 'listing' : 'listings'}</span>
              {store.website && (
                <a href={store.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#1A3353] hover:underline">
                  Website <ExternalLink size={12} />
                </a>
              )}
              {store.email && <a href={`mailto:${store.email}`} className="text-[#1A3353] hover:underline">{store.email}</a>}
            </div>
            {store.description && <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-6 text-[#52606D]">{store.description}</p>}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F1923]">Available listings</h2>
            <p className="mt-1 text-sm text-[#6E7A8A]">Browse the items and services from this seller.</p>
          </div>
          {listings.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map(listing => {
                const data = listing.data;
                const title = String(data.title ?? data.name ?? 'Listing');
                const image = typeof data.image === 'string' ? data.image : '';
                const price = data.priceDisplay ?? data.price ?? data.salary ?? data.rate ?? '';
                const location = data.location ?? data.address ?? '';
                const item = { ...data, id: listing.id, section: listing.section, userId: store.id, seller: store.name };
                return (
                  <button
                    key={listing.id}
                    type="button"
                    onClick={() => navigate(listingDetailPath(listing.section, listing.id, item), { state: { listing: item } })}
                    className="overflow-hidden rounded-2xl border border-[#E8E2D8] bg-white text-left transition-shadow hover:shadow-md"
                  >
                    {image
                      ? <img src={image} alt={title} className="aspect-[16/10] w-full object-cover" />
                      : <div className="flex aspect-[16/10] items-center justify-center bg-[#F0EBE1]"><Store size={28} className="text-[#C9A96E]" /></div>}
                    <div className="space-y-2 p-4">
                      <p className="line-clamp-2 font-semibold text-[#0F1923]">{title}</p>
                      {price !== '' && <p className="font-bold text-[#1A3353]">{String(price)}</p>}
                      {location !== '' && <p className="truncate text-sm text-[#6E7A8A]">{String(location)}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D8D0C2] bg-white px-5 py-12 text-center text-sm text-[#6E7A8A]">
              This seller has no active listings at the moment.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
