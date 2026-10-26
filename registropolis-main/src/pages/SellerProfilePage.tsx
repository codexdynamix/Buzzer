import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, MessageCircle, Pin, PinOff, Share2 } from 'lucide-react';
import { useUserListings } from '@/context/UserListingsContext';
import { useChatContext } from '@/context/ChatContext';
import { useSellerCompare, buildPinnedSeller } from '@/context/SellerCompareContext';
import { listingDetailPath } from '@/lib/utils';

export default function SellerProfilePage() {
  const { sellerName } = useParams<{ sellerName: string }>();
  const navigate = useNavigate();
  const { getAllListings } = useUserListings();
  const { openChatWithListing } = useChatContext();
  const { isPinned, pin, unpin } = useSellerCompare();

  const requestedName = decodeURIComponent(sellerName ?? '');
  const listings = useMemo(
    () => {
      const allListings = getAllListings();
      const accountListings = allListings.filter(listing => listing.userId === requestedName);
      return accountListings.length > 0
        ? accountListings
        : allListings.filter(listing => listing.seller?.toLocaleLowerCase() === requestedName.toLocaleLowerCase());
    },
    [getAllListings, requestedName],
  );
  const name = listings[0]?.seller ?? requestedName;
  const profile = listings[0]?.owner;

  if (!name || listings.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#F9F7F4' }}>
        <p className="text-sm" style={{ color: '#6E7A8A' }}>No active listings found for this seller.</p>
        <button onClick={() => navigate(-1)} className="text-sm font-semibold" style={{ color: '#1A3353' }}>
          Back to listings
        </button>
      </div>
    );
  }

  const firstListing = listings[0];
  const pinned = isPinned(name);

  const handleMessage = () => openChatWithListing({
    listingId: firstListing.id,
    listingTitle: firstListing.title,
    listingPrice: firstListing.price == null ? '' : String(firstListing.price),
    listingImage: firstListing.image,
    listingCategory: firstListing.category ?? 'Marketplace',
    sellerName: name,
  });

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      window.prompt('Copy this profile link', window.location.href);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6" style={{ backgroundColor: '#F9F7F4' }}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#1A3353' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={handleShare} aria-label="Share seller profile" className="rounded-xl border p-2" style={{ borderColor: '#E8E2D8' }}>
            <Share2 size={16} style={{ color: '#6E7A8A' }} />
          </button>
        </div>

        <section className="rounded-2xl border bg-white p-6" style={{ borderColor: '#E8E2D8' }}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl text-3xl font-bold" style={{ backgroundColor: '#F0EBE1', color: '#1A3353' }}>
              {profile?.profileImageUrl
                ? <img src={profile.profileImageUrl} alt={name} className="h-full w-full object-cover" />
                : name.charAt(0).toLocaleUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold" style={{ color: '#0F1923' }}>{name}</h1>
              {(profile?.location || firstListing.location) && (
                <p className="mt-1 flex items-center gap-1.5 text-sm" style={{ color: '#6E7A8A' }}>
                  <MapPin size={14} /> {profile?.location || firstListing.location}
                </p>
              )}
              {profile?.bio && <p className="mt-2 max-w-2xl text-sm" style={{ color: '#6E7A8A' }}>{profile.bio}</p>}
              <p className="mt-2 text-sm" style={{ color: '#6E7A8A' }}>
                {listings.length} active {listings.length === 1 ? 'listing' : 'listings'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleMessage} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: '#1A3353', color: '#fff' }}>
                <MessageCircle size={15} /> Message seller
              </button>
              <button
                onClick={() => pinned ? unpin(name) : pin(buildPinnedSeller(name, listings))}
                className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
                style={{ borderColor: '#E8E2D8', color: '#6E7A8A' }}
              >
                {pinned ? <PinOff size={15} /> : <Pin size={15} />}
                {pinned ? 'Remove comparison' : 'Compare seller'}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold" style={{ color: '#0F1923' }}>Active listings</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map(listing => (
              <button
                key={`${listing.section}-${listing.id}`}
                onClick={() => navigate(listingDetailPath(listing.section, listing.id, listing), { state: { listing } })}
                className="overflow-hidden rounded-2xl border bg-white text-left"
                style={{ borderColor: '#E8E2D8' }}
              >
                {listing.image && <img src={listing.image} alt={listing.title} className="aspect-[16/10] w-full object-cover" />}
                <div className="space-y-2 p-4">
                  <h3 className="font-semibold" style={{ color: '#0F1923' }}>{listing.title}</h3>
                  {listing.price != null && <p className="font-bold" style={{ color: '#1A3353' }}>{String(listing.price)}</p>}
                  {listing.location && <p className="text-sm" style={{ color: '#6E7A8A' }}>{listing.location}</p>}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
