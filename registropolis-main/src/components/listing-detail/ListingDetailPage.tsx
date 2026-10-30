import React, { useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Heart, Share2, MapPin, Star, CheckCircle2, MessageCircle,
  Calendar, Clock, Users, Ticket, BedDouble, Bath, Maximize2, Phone,
  Building, DollarSign, Gauge, Fuel, Zap, ArrowUpRight, Bookmark,
  BadgeCheck, Timer, Briefcase, ChevronLeft, ChevronRight, Tag, Copy, Check,
  Flag, X, AlertTriangle, Bell, BellOff,
} from 'lucide-react';
import { useChatContext } from '@/context/ChatContext';
import { cn, listingDetailPath } from '@/lib/utils';
import { useSaved } from '@/context/SavedContext';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import { usePriceAlerts } from '@/context/PriceAlertContext';
import { useUserListings } from '@/context/UserListingsContext';
import { useEffect } from 'react';
import ReviewsSection from './ReviewsSection';
import ContactModal from '@/components/shared/ContactModal';
import ShareModal from '@/components/shared/ShareModal';
import { useAuth } from '@/context/AuthContext';
import { useGuestGate } from '@/context/GuestGateContext';
import { listingEngagementAPI, type ListingEngagementStats } from '@/services/listingEngagementService';

function generateDescription(listing: any): string {
  return typeof listing.description === 'string' ? listing.description : '';
}

function ImageGallery({ images }: { images: string[] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const prev = () => setActiveIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setActiveIdx(i => (i + 1) % images.length);

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative rounded-2xl overflow-hidden" style={{ height: '420px', backgroundColor: '#F5F2EC' }}>
        <img
          src={images[activeIdx]}
          alt="Listing"
          className="w-full h-full object-cover transition-all duration-300"
          onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'; }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ backgroundColor: 'rgba(255,255,255,0.92)', boxShadow: '0 2px 8px rgba(15,25,35,0.15)' }}
            >
              <ChevronLeft size={18} style={{ color: '#0F1923' }} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ backgroundColor: 'rgba(255,255,255,0.92)', boxShadow: '0 2px 8px rgba(15,25,35,0.15)' }}
            >
              <ChevronRight size={18} style={{ color: '#0F1923' }} />
            </button>
            <div
              className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: 'rgba(15,25,35,0.65)', color: '#fff' }}
            >
              {activeIdx + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className="flex-1 rounded-xl overflow-hidden transition-all"
              style={{
                height: '72px',
                border: activeIdx === i ? '2px solid #C9A96E' : '2px solid transparent',
                opacity: activeIdx === i ? 1 : 0.6,
              }}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── spec row helper ────────────────────────────────────────────── */
function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid #F0EBE1' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#F5F2EC' }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium" style={{ color: '#6E7A8A' }}>{label}</p>
        <p className="text-sm font-semibold truncate" style={{ color: '#0F1923' }}>{value}</p>
      </div>
    </div>
  );
}

/* ─── helpers ────────────────────────────────────────────────────── */
function encodeListingData(listing: any): string {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(listing)))); } catch { return ''; }
}
function decodeListingData(encoded: string): any | null {
  try { return JSON.parse(decodeURIComponent(escape(atob(encoded)))); } catch { return null; }
}

/* ─── main component ─────────────────────────────────────────────── */
export default function ListingDetailPage() {
  const navigate = useNavigate();
  const { section, id } = useParams<{ section: string; id: string }>();
  const { state } = useLocation() as { state: { listing: any } | null };
  const [searchParams] = useSearchParams();
  const { openChatWithListing } = useChatContext();
  const { getAllListings } = useUserListings();
  const { isSaved, toggleSaved } = useSaved();
  const { isAuthenticated, user } = useAuth();
  const { requireAuth } = useGuestGate();
  const { isWatched, addWatch, removeWatch: removeWatchAlert } = usePriceAlerts();
  const { recordView } = useRecentlyViewed();
  const [reportOpen, setReportOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [engagement, setEngagement] = useState<ListingEngagementStats>({
    views: 0, likes: 0, saves: 0, shares: 0, inquiries: 0, liked: false, saved: false,
  });

  const listing: any = state?.listing ?? decodeListingData(searchParams.get('d') ?? '');

  useEffect(() => {
    if (listing && section) {
      recordView(section, listing);
      if (isAuthenticated && listing.userId !== user?.id) {
        void listingEngagementAPI.record(listing.id, 'view')
          .catch(error => console.error('Could not record listing view:', error));
      }
    }
  }, [listing?.id, section, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!listing?.id) return;
    let active = true;
    listingEngagementAPI.get(listing.id)
      .then(result => {
        if (active) setEngagement(result.stats);
      })
      .catch(error => {
        console.error('Could not load listing engagement:', error);
      });
    return () => { active = false; };
  }, [listing?.id]);

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32" style={{ color: '#6E7A8A' }}>
        <p className="text-lg font-semibold mb-2" style={{ color: '#0F1923' }}>Listing not found</p>
        <p className="text-sm mb-6">This listing may have been removed or expired.</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: '#1A3353', color: '#fff' }}
        >
          <ArrowLeft size={15} /> Go back
        </button>
      </div>
    );
  }

  const sec = section ?? 'marketplace';
  const isOwnListing = user?.id === listing.userId;
  const sellerListingCount = getAllListings().filter(item =>
    item.seller === listing.seller && item.userId === listing.userId
  ).length;

  const shareUrl = `${window.location.origin}/dashboard/${sec}/${id ?? listing.id}?d=${encodeListingData(listing)}`;

  const handleSave = () => {
    void toggleSaved(sec, listing).then(stats => {
      if (stats) setEngagement(stats);
    });
  };
  const handleLike = () => {
    if (isOwnListing || !requireAuth()) return;
    void listingEngagementAPI.record(listing.id, 'like', !engagement.liked)
      .then(setEngagement)
      .catch(error => console.error('Could not update listing like:', error));
  };
  const recordShare = () => {
    if (!isAuthenticated || isOwnListing) return;
    void listingEngagementAPI.record(listing.id, 'share')
      .then(setEngagement)
      .catch(error => console.error('Could not record listing share:', error));
  };
  const startInquiry = (info: Parameters<typeof openChatWithListing>[0]) => {
    if (isAuthenticated && !isOwnListing) {
      void listingEngagementAPI.record(listing.id, 'inquiry')
        .then(setEngagement)
        .catch(error => console.error('Could not record listing inquiry:', error));
    }
    openChatWithListing(info);
  };
  const submitReport = async (reason: string, details: string) => {
    if (!requireAuth()) throw new Error('Sign in to submit a report.');
    await listingEngagementAPI.report(listing.id, reason, details);
  };

  const gallery = Array.isArray(listing.galleryImages) ? listing.galleryImages : [];
  const images = [listing.image, ...gallery].filter(Boolean);

  const description = generateDescription(listing);

  /* ── MARKETPLACE ───────────────────────────────────────────────── */
  if (sec === 'marketplace') {
    const COND: Record<string, { bg: string; text: string; border: string }> = {
      'New':      { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
      'Like New': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
      'Good':     { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
      'Fair':     { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
    };
    const cond = COND[listing.condition] ?? { bg: '#F5F2EC', text: '#6E7A8A', border: '#E8E2D8' };
    const discount = listing.originalPrice > listing.price
      ? Math.round((1 - listing.price / listing.originalPrice) * 100) : 0;

    return (
      <div className="section-padding">
        <TopBar onBack={() => navigate(`/dashboard/${sec}`)} saved={isSaved(sec, listing.id)} onSave={handleSave} saveCount={engagement.saves} liked={engagement.liked} likeCount={engagement.likes} onLike={!isOwnListing ? handleLike : undefined} shareCount={engagement.shares} shareUrl={shareUrl} onShare={() => setShareOpen(true)} onShareRecord={recordShare} onReport={() => setReportOpen(true)} />
        <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} listingTitle={listing.title ?? listing.name ?? ''} onSubmit={submitReport} />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left */}
          <div className="lg:col-span-3 space-y-6">
            <ImageGallery images={images} />

            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl font-bold leading-tight" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>{listing.title}</h1>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border shrink-0" style={{ backgroundColor: cond.bg, color: cond.text, borderColor: cond.border }}>
                  {listing.condition}
                </span>
              </div>
              {listing.verified && (
                <div className="flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: '#1A3353' }}>
                  <CheckCircle2 size={14} style={{ color: '#C9A96E' }} /> Verified Listing
                </div>
              )}
            </div>

            {/* Specs */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: '#0F1923' }}>Item Details</h3>
              <Spec icon={<Tag size={14} style={{ color: '#C9A96E' }} />} label="Category" value={listing.category} />
              <Spec icon={<MapPin size={14} style={{ color: '#C9A96E' }} />} label="Location" value={listing.location} />
              <Spec icon={<Clock size={14} style={{ color: '#C9A96E' }} />} label="Listed" value={listing.timeAgo} />
              {discount > 0 && (
                <Spec icon={<Tag size={14} style={{ color: '#C9A96E' }} />} label="Discount" value={`${discount}% off original price`} />
              )}
            </div>

            {/* Description */}
            <DescriptionBlock text={description} />

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {['Cash accepted', 'Local pickup', 'Negotiable', listing.condition].map(tag => (
                <span key={tag} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F5F2EC', color: '#1A3353', border: '1px solid #E8E2D8' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right sticky sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              {/* Price card */}
              <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold" style={{ color: '#0F1923' }}>${listing.price?.toLocaleString()}</span>
                    {listing.originalPrice > listing.price && (
                      <span className="text-lg line-through" style={{ color: '#6E7A8A' }}>${listing.originalPrice?.toLocaleString()}</span>
                    )}
                  </div>
                  {discount > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg mt-1 inline-block" style={{ backgroundColor: '#C9A96E', color: '#0F1923' }}>
                      Save ${(listing.originalPrice - listing.price)?.toLocaleString()}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => startInquiry({
                    listingId: listing.id,
                    listingTitle: listing.title,
                    listingPrice: `$${listing.price?.toLocaleString()}`,
                    listingImage: listing.image,
                    listingCategory: listing.category,
                    sellerName: listing.seller,
                    sellerId: listing.userId,
                  })}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: '#1A3353', color: '#fff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'; }}
                >
                  <MessageCircle size={15} /> Message Seller
                </button>

                <button
                  onClick={() => startInquiry({
                    listingId: listing.id,
                    listingTitle: listing.title,
                    listingPrice: `$${listing.price?.toLocaleString()}`,
                    listingImage: listing.image,
                    listingCategory: listing.category,
                    sellerName: listing.seller,
                    sellerId: listing.userId,
                    triggerOffer: true,
                  })}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: '#F0EBE1', color: '#1A3353', border: '1px solid #E8D9BC' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#C9A96E'; (e.currentTarget as HTMLElement).style.color = '#0F1923'; (e.currentTarget as HTMLElement).style.borderColor = '#C9A96E'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F0EBE1'; (e.currentTarget as HTMLElement).style.color = '#1A3353'; (e.currentTarget as HTMLElement).style.borderColor = '#E8D9BC'; }}
                >
                  💰 Make an Offer
                </button>

                {listing.phone && (
                  <button
                    onClick={() => {
                      if (isAuthenticated && !isOwnListing) {
                        void listingEngagementAPI.record(listing.id, 'inquiry')
                          .then(setEngagement)
                          .catch(error => console.error('Could not record listing inquiry:', error));
                      }
                      setContactOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A', border: '1px solid #E8E2D8' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EDE8DF'; (e.currentTarget as HTMLElement).style.color = '#1A3353'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; }}
                  >
                    <Phone size={15} /> Contact Seller
                  </button>
                )}

                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: isSaved(sec!, listing?.id) ? '#FEF2F2' : '#F5F2EC', color: isSaved(sec!, listing?.id) ? '#B91C1C' : '#1A3353', border: `1px solid ${isSaved(sec!, listing?.id) ? '#FECACA' : '#E8E2D8'}` }}
                >
                  <Heart size={15} className={isSaved(sec!, listing?.id) ? 'fill-red-500' : ''} /> {isSaved(sec!, listing?.id) ? 'Saved' : 'Save Listing'}
                </button>

                {sec === 'marketplace' && listing?.price && (
                  <button
                    onClick={() => {
                      if (isWatched(sec!, listing.id)) {
                        removeWatchAlert(sec!, listing.id);
                      } else {
                        addWatch(sec!, {
                          id: listing.id,
                          title: listing.title,
                          image: listing.image,
                          seller: listing.seller,
                          price: listing.price,
                        });
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: isWatched(sec!, listing.id) ? '#FFFBEB' : '#F5F2EC',
                      color: isWatched(sec!, listing.id) ? '#92400E' : '#6E7A8A',
                      border: `1px solid ${isWatched(sec!, listing.id) ? '#FDE68A' : '#E8E2D8'}`,
                    }}
                    onMouseEnter={e => { if (!isWatched(sec!, listing.id)) { (e.currentTarget as HTMLElement).style.backgroundColor = '#FFFBEB'; (e.currentTarget as HTMLElement).style.color = '#92400E'; (e.currentTarget as HTMLElement).style.borderColor = '#FDE68A'; } }}
                    onMouseLeave={e => { if (!isWatched(sec!, listing.id)) { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; (e.currentTarget as HTMLElement).style.borderColor = '#E8E2D8'; } }}
                  >
                    {isWatched(sec!, listing.id)
                      ? <><BellOff size={15} /> Stop Watching Price</>
                      : <><Bell size={15} /> Watch for Price Drop</>
                    }
                  </button>
                )}
              </div>

              {/* Seller card */}
              <SellerCard
                name={listing.seller}
                rating={listing.sellerRating}
                verified={listing.verified}
                subtitle="Community Seller"
                stats={[{ label: 'Active listings', value: String(sellerListingCount) }]}
                onViewProfile={() => navigate(`/dashboard/seller/${encodeURIComponent(listing.userId ?? listing.seller)}`)}
              />
              <ListingMap location={listing.location} />
            </div>
          </div>
        </div>
        <ReviewsSection listingId={listing.id} section="marketplace" listingTitle={listing.title} sellerName={listing.seller ?? 'Seller'} />
        <SimilarListings section={sec} currentId={listing.id} category={listing.category} />

        {/* Contact Modal */}
        {contactOpen && (
          <ContactModal
            sellerName={listing.seller}
            phone={listing.phone}
            whatsapp={listing.whatsapp}
            viber={listing.viber}
            telegram={listing.telegram}
            onClose={() => setContactOpen(false)}
          />
        )}

        {/* Share Modal */}
        {shareOpen && (
          <ShareModal
            url={shareUrl}
            title={listing.title}
            onClose={() => setShareOpen(false)}
          />
        )}
      </div>
    );
  }

  /* ── JOBS ──────────────────────────────────────────────────────── */
  if (sec === 'jobs') {
    const TYPE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
      'Full-time': { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
      'Contract':  { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
      'Part-time': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
      'Internship':{ bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
    };
    const typeStyle = TYPE_STYLE[listing.type] ?? { bg: '#F5F2EC', text: '#6E7A8A', border: '#E8E2D8' };

    return (
      <div className="section-padding">
        <TopBar onBack={() => navigate(`/dashboard/${sec}`)} saved={isSaved(sec, listing.id)} onSave={handleSave} saveLabel="Bookmark" saveCount={engagement.saves} liked={engagement.liked} likeCount={engagement.likes} onLike={!isOwnListing ? handleLike : undefined} shareCount={engagement.shares} shareUrl={shareUrl} onShareRecord={recordShare} onReport={() => setReportOpen(true)} />
        <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} listingTitle={listing.title ?? listing.name ?? ''} onSubmit={submitReport} />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {/* Company hero */}
            <div className="rounded-2xl overflow-hidden" style={{ height: '200px', backgroundColor: '#F5F2EC' }}>
              <img src={images[1] ?? images[0]} alt={listing.company} className="w-full h-full object-cover" />
            </div>

            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0" style={{ backgroundColor: listing.color }}>
                {listing.logo}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>{listing.title}</h1>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="flex items-center gap-1 font-medium text-sm" style={{ color: '#1A3353' }}>
                    <Building size={14} style={{ color: '#6E7A8A' }} />{listing.company}
                  </span>
                  <span style={{ color: '#E8E2D8' }}>·</span>
                  <span className="flex items-center gap-1 text-sm" style={{ color: '#6E7A8A' }}>
                    <MapPin size={13} />{listing.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Specs */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: '#0F1923' }}>Role Details</h3>
              <Spec icon={<DollarSign size={14} style={{ color: '#C9A96E' }} />} label="Compensation" value={listing.salary} />
              <Spec icon={<Briefcase size={14} style={{ color: '#C9A96E' }} />} label="Employment Type" value={listing.type} />
              <Spec icon={<MapPin size={14} style={{ color: '#C9A96E' }} />} label="Location" value={listing.location} />
              <Spec icon={<Clock size={14} style={{ color: '#C9A96E' }} />} label="Posted" value={listing.posted} />
              <Spec icon={<Building size={14} style={{ color: '#C9A96E' }} />} label="Department" value={listing.category} />
            </div>

            <DescriptionBlock text={description} title="About This Role" />

            {/* Skills */}
            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#0F1923' }}>Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {listing.tags?.map((tag: string) => (
                  <span key={tag} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F5F2EC', color: '#1A3353', border: '1px solid #E8E2D8' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: '#6E7A8A' }}>Salary Range</p>
                  <p className="text-2xl font-bold" style={{ color: '#0F1923' }}>{listing.salary}</p>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border inline-block mt-2" style={{ backgroundColor: typeStyle.bg, color: typeStyle.text, borderColor: typeStyle.border }}>
                    {listing.type}
                  </span>
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: '#1A3353', color: '#fff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'; }}
                >
                  Apply Now <ArrowUpRight size={15} />
                </button>

                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: isSaved(sec!, listing?.id) ? '#FFFBEB' : '#F5F2EC', color: isSaved(sec!, listing?.id) ? '#B45309' : '#1A3353', border: `1px solid ${isSaved(sec!, listing?.id) ? '#FDE68A' : '#E8E2D8'}` }}
                >
                  <Bookmark size={15} className={isSaved(sec!, listing?.id) ? 'fill-amber-500' : ''} /> {isSaved(sec!, listing?.id) ? 'Bookmarked' : 'Save Job'}
                </button>
              </div>

              <SellerCard
                name={listing.company}
                subtitle="Hiring Company"
                verified={listing.verified}
                avatarLetter={listing.logo}
                avatarBg={listing.color}
              />
              <ListingMap location={listing.location} />
            </div>
          </div>
        </div>
        <SimilarListings section={sec} currentId={listing.id} category={listing.category} />
      </div>
    );
  }

  /* ── REAL ESTATE ───────────────────────────────────────────────── */
  if (sec === 'real-estate') {
    const TAG_STYLE: Record<string, { bg: string; text: string }> = {
      'New Listing':   { bg: '#EFF6FF', text: '#1D4ED8' },
      'Hot Deal':      { bg: '#FEF2F2', text: '#B91C1C' },
      'Price Reduced': { bg: '#FFFBEB', text: '#B45309' },
      'Available Now': { bg: '#F0FDF4', text: '#15803D' },
      'Luxury':        { bg: '#F5F3FF', text: '#6D28D9' },
      'Move-in Ready': { bg: '#F0FDFA', text: '#0F766E' },
    };
    const tagStyle = TAG_STYLE[listing.tag] ?? { bg: '#F5F2EC', text: '#6E7A8A' };
    const pricePerSqft = listing.sqft > 0 ? Math.round(listing.price / listing.sqft) : 0;

    return (
      <div className="section-padding">
        <TopBar onBack={() => navigate(`/dashboard/${sec}`)} saved={isSaved(sec, listing.id)} onSave={handleSave} saveCount={engagement.saves} liked={engagement.liked} likeCount={engagement.likes} onLike={!isOwnListing ? handleLike : undefined} shareCount={engagement.shares} shareUrl={shareUrl} onShareRecord={recordShare} onReport={() => setReportOpen(true)} />
        <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} listingTitle={listing.title ?? listing.name ?? ''} onSubmit={submitReport} />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <ImageGallery images={images} />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: tagStyle.bg, color: tagStyle.text }}>{listing.tag}</span>
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: listing.mode === 'Rent' ? '#EFF6FF' : '#0F1923', color: listing.mode === 'Rent' ? '#1D4ED8' : '#fff' }}
                >
                  For {listing.mode}
                </span>
              </div>
              <h1 className="text-2xl font-bold" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>{listing.title}</h1>
              <div className="flex items-center gap-1.5 mt-1 text-sm" style={{ color: '#6E7A8A' }}>
                <MapPin size={13} className="shrink-0" /> {listing.address}
              </div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <BedDouble size={14} style={{ color: '#C9A96E' }} />, label: 'Bedrooms', value: `${listing.beds} bed${listing.beds !== 1 ? 's' : ''}` },
                { icon: <Bath size={14} style={{ color: '#C9A96E' }} />, label: 'Bathrooms', value: `${listing.baths} bath${listing.baths !== 1 ? 's' : ''}` },
                { icon: <Maximize2 size={14} style={{ color: '#C9A96E' }} />, label: 'Floor Area', value: `${listing.sqft?.toLocaleString()} ft²` },
                { icon: <Tag size={14} style={{ color: '#C9A96E' }} />, label: 'Price / ft²', value: pricePerSqft > 0 ? `$${pricePerSqft.toLocaleString()}/ft²` : '—' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#F5F2EC', border: '1px solid #E8E2D8' }}>
                  {s.icon}
                  <div>
                    <p className="text-[11px]" style={{ color: '#6E7A8A' }}>{s.label}</p>
                    <p className="text-sm font-bold" style={{ color: '#0F1923' }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <DescriptionBlock text={description} />

            {/* Features */}
            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#0F1923' }}>Property Features</h3>
              <div className="flex flex-wrap gap-2">
                {['Central A/C', 'In-unit Laundry', 'Dedicated Parking', 'Open Floor Plan', 'Hardwood Floors', 'Stainless Appliances', 'Walk-in Closet', 'High Ceilings'].map(f => (
                  <span key={f} className="text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ backgroundColor: '#F5F2EC', color: '#1A3353', border: '1px solid #E8E2D8' }}>
                    <CheckCircle2 size={11} style={{ color: '#C9A96E' }} /> {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#C9A96E' }}>{listing.priceDisplay}</p>
                  <p className="text-xs mt-1" style={{ color: '#6E7A8A' }}>{listing.mode === 'Rent' ? 'Monthly rent' : 'Listing price'}</p>
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: '#1A3353', color: '#fff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'; }}
                >
                  <Phone size={15} /> Schedule a Viewing
                </button>

                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: isSaved(sec!, listing?.id) ? '#FEF2F2' : '#F5F2EC', color: isSaved(sec!, listing?.id) ? '#B91C1C' : '#1A3353', border: `1px solid ${isSaved(sec!, listing?.id) ? '#FECACA' : '#E8E2D8'}` }}
                >
                  <Heart size={15} className={isSaved(sec!, listing?.id) ? 'fill-red-500' : ''} /> {isSaved(sec!, listing?.id) ? 'Saved' : 'Save Property'}
                </button>
              </div>

              {/* Agent card */}
              <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
                <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#6E7A8A' }}>Listed By</h3>
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white" style={{ backgroundColor: '#1A3353', border: '2px solid #E8E2D8' }}>
                    {listing.agent?.[0] ?? listing.owner?.name?.[0] ?? listing.seller?.[0] ?? 'A'}
                    {(listing.agentImg ?? listing.owner?.profileImageUrl ?? listing.profileImageUrl) && (
                      <img
                        src={listing.agentImg ?? listing.owner?.profileImageUrl ?? listing.profileImageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={event => { event.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#0F1923' }}>{listing.agent ?? listing.owner?.name ?? listing.seller ?? 'Agent'}</p>
                    <div className="flex items-center gap-1 text-xs" style={{ color: '#6E7A8A' }}>
                      <CheckCircle2 size={11} style={{ color: '#C9A96E' }} /> Licensed Agent
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[{ label: 'Response', value: '< 2 hrs' }, { label: 'Listings', value: '18 active' }].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#F5F2EC' }}>
                      <p className="text-sm font-bold" style={{ color: '#0F1923' }}>{s.value}</p>
                      <p className="text-[10px]" style={{ color: '#6E7A8A' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <ListingMap location={listing.address} />
            </div>
          </div>
        </div>
        <SimilarListings section={sec} currentId={listing.id} category={listing.mode} />
      </div>
    );
  }

  /* ── SERVICES ──────────────────────────────────────────────────── */
  if (sec === 'services') {
    return (
      <div className="section-padding">
        <TopBar onBack={() => navigate(`/dashboard/${sec}`)} saved={isSaved(sec, listing.id)} onSave={handleSave} saveCount={engagement.saves} liked={engagement.liked} likeCount={engagement.likes} onLike={!isOwnListing ? handleLike : undefined} shareCount={engagement.shares} shareUrl={shareUrl} onShareRecord={recordShare} onReport={() => setReportOpen(true)} />
        <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} listingTitle={listing.title ?? listing.name ?? ''} onSubmit={submitReport} />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <ImageGallery images={images} />

            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <img src={listing.image} alt={listing.name} className="w-16 h-16 rounded-2xl object-cover" style={{ border: '2px solid #E8E2D8' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'; }}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white"
                  style={{ backgroundColor: listing.available ? '#22C55E' : '#9CA3AF' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold" style={{ color: '#0F1923', letterSpacing: '-0.02em' }}>{listing.name}</h1>
                  {listing.verified && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                      <BadgeCheck size={11} /> Verified Pro
                    </span>
                  )}
                </div>
                <p className="text-sm mt-0.5" style={{ color: '#6E7A8A' }}>{listing.title}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold" style={{ color: '#0F1923' }}>{listing.rating}</span>
                  <span className="text-xs" style={{ color: '#6E7A8A' }}>({listing.reviews} reviews)</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: '#0F1923' }}>Provider Info</h3>
              <Spec icon={<MapPin size={14} style={{ color: '#C9A96E' }} />} label="Location" value={listing.location} />
              <Spec icon={<Briefcase size={14} style={{ color: '#C9A96E' }} />} label="Jobs Completed" value={`${listing.jobs}+ projects`} />
              <Spec icon={<Timer size={14} style={{ color: '#C9A96E' }} />} label="Response Time" value="Usually within 2 hours" />
              <Spec icon={<Clock size={14} style={{ color: '#C9A96E' }} />} label="Availability" value={listing.available ? 'Currently available' : 'Currently busy'} />
            </div>

            <DescriptionBlock text={description} title="About This Provider" />

            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#0F1923' }}>Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {listing.tags?.map((tag: string) => (
                  <span key={tag} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F5F2EC', color: '#1A3353', border: '1px solid #E8E2D8' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Live reviews */}
            <ReviewsSection listingId={listing.id} section={sec} listingTitle={listing.title ?? listing.name ?? ''} sellerName={listing.name ?? listing.seller ?? 'Provider'} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#0F1923' }}>{listing.rate}</p>
                  <p className="text-xs mt-1" style={{ color: '#6E7A8A' }}>Starting rate · Final price may vary</p>
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: '#C9A96E', color: '#0F1923' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ba965c'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#C9A96E'; }}
                >
                  <Calendar size={15} /> Book Now
                </button>

                <button
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: '#F5F2EC', color: '#1A3353', border: '1px solid #E8E2D8' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; (e.currentTarget as HTMLElement).style.color = '#1A3353'; }}
                >
                  <MessageCircle size={15} /> Send Message
                </button>

                <div className="flex items-center gap-2 justify-center py-2" style={{ borderTop: '1px solid #F0EBE1' }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: listing.available ? '#22C55E' : '#9CA3AF' }} />
                  <span className="text-xs font-medium" style={{ color: '#6E7A8A' }}>
                    {listing.available ? 'Available for new bookings' : 'Currently busy'}
                  </span>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: '#F5F2EC', border: '1px solid #E8E2D8' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold" style={{ color: '#0F1923' }}>{listing.rating} / 5.0</span>
                </div>
                {[5, 4, 3].map(n => (
                  <div key={n} className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs w-4" style={{ color: '#6E7A8A' }}>{n}★</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E2D8' }}>
                      <div className="h-full rounded-full" style={{ width: n === 5 ? '78%' : n === 4 ? '16%' : '6%', backgroundColor: '#C9A96E' }} />
                    </div>
                    <span className="text-xs w-6 text-right" style={{ color: '#6E7A8A' }}>{n === 5 ? '78%' : n === 4 ? '16%' : '6%'}</span>
                  </div>
                ))}
              </div>
              <ListingMap location={listing.location} />
            </div>
          </div>
        </div>
        <SimilarListings section={sec} currentId={listing.id} category={listing.category} />
      </div>
    );
  }

  /* ── EVENTS ────────────────────────────────────────────────────── */
  if (sec === 'events') {
    const TAG_STYLE: Record<string, { bg: string; text: string }> = {
      'Trending':      { bg: '#FEF2F2', text: '#B91C1C' },
      'Must Attend':   { bg: '#F5F3FF', text: '#6D28D9' },
      'Limited Seats': { bg: '#FFFBEB', text: '#B45309' },
      'Hot':           { bg: '#FFF7ED', text: '#C2410C' },
      'Premium':       { bg: '#EFF6FF', text: '#1D4ED8' },
    };
    const tagStyle = TAG_STYLE[listing.tag] ?? { bg: '#F5F2EC', text: '#6E7A8A' };

    return (
      <div className="section-padding">
        <TopBar onBack={() => navigate(`/dashboard/${sec}`)} saved={isSaved(sec, listing.id)} onSave={handleSave} saveCount={engagement.saves} liked={engagement.liked} likeCount={engagement.likes} onLike={!isOwnListing ? handleLike : undefined} shareCount={engagement.shares} shareUrl={shareUrl} onShareRecord={recordShare} onReport={() => setReportOpen(true)} />
        <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} listingTitle={listing.title ?? listing.name ?? ''} onSubmit={submitReport} />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <ImageGallery images={images} />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: tagStyle.bg, color: tagStyle.text }}>{listing.tag}</span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A' }}>{listing.category}</span>
              </div>
              <h1 className="text-2xl font-bold" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>{listing.title}</h1>
              <p className="text-sm mt-1" style={{ color: '#6E7A8A' }}>Hosted by {listing.host}</p>
            </div>

            <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: '#0F1923' }}>Event Details</h3>
              <Spec icon={<Calendar size={14} style={{ color: '#C9A96E' }} />} label="Date" value={listing.date} />
              <Spec icon={<Clock size={14} style={{ color: '#C9A96E' }} />} label="Time" value={listing.time} />
              <Spec icon={<MapPin size={14} style={{ color: '#C9A96E' }} />} label="Location" value={listing.location} />
              <Spec icon={<Users size={14} style={{ color: '#C9A96E' }} />} label="Attendees" value={`${listing.attendees?.toLocaleString()} registered`} />
            </div>

            <DescriptionBlock text={description} title="About This Event" />

            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#0F1923' }}>What's Included</h3>
              <div className="flex flex-wrap gap-2">
                {['General Admission', 'Event Program', 'Food & Beverages', 'Artist Meet & Greet (VIP)', 'Commemorative Merch', 'Parking Pass (VIP)'].map(f => (
                  <span key={f} className="text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ backgroundColor: '#F5F2EC', color: '#1A3353', border: '1px solid #E8E2D8' }}>
                    <CheckCircle2 size={11} style={{ color: '#C9A96E' }} /> {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#0F1923' }}>{listing.priceDisplay}</p>
                  <p className="text-xs mt-1" style={{ color: '#6E7A8A' }}>per person · General Admission</p>
                </div>

                {/* Ticket tiers */}
                <div className="space-y-2">
                  {[
                    { tier: 'General Admission', price: listing.priceDisplay },
                    { tier: 'VIP Package', price: listing.price === 0 ? 'Free' : `$${(listing.price * 2.5).toLocaleString()}` },
                    { tier: 'Premium Experience', price: listing.price === 0 ? 'Free' : `$${(listing.price * 5).toLocaleString()}` },
                  ].map(t => (
                    <div key={t.tier} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: '#F5F2EC', border: '1px solid #E8E2D8' }}>
                      <span className="text-xs font-medium" style={{ color: '#1A3353' }}>{t.tier}</span>
                      <span className="text-xs font-bold" style={{ color: '#0F1923' }}>{t.price}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: '#C9A96E', color: '#0F1923' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ba965c'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#C9A96E'; }}
                >
                  <Ticket size={15} /> Get Tickets <ArrowUpRight size={15} />
                </button>

                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: isSaved(sec!, listing?.id) ? '#FEF2F2' : '#F5F2EC', color: isSaved(sec!, listing?.id) ? '#B91C1C' : '#1A3353', border: `1px solid ${isSaved(sec!, listing?.id) ? '#FECACA' : '#E8E2D8'}` }}
                >
                  <Heart size={15} className={isSaved(sec!, listing?.id) ? 'fill-red-500' : ''} /> {isSaved(sec!, listing?.id) ? 'Saved' : 'Save Event'}
                </button>
              </div>

              <SellerCard
                name={listing.host}
                subtitle="Event Organizer"
                verified={listing.verified}
              />
              <ListingMap location={listing.location} />
            </div>
          </div>
        </div>
        <SimilarListings section={sec} currentId={listing.id} category={listing.category} />
      </div>
    );
  }

  /* ── TRANSPORT ─────────────────────────────────────────────────── */
  if (sec === 'transport') {
    const COND: Record<string, { bg: string; text: string; border: string }> = {
      'New':       { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
      'Like New':  { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
      'Excellent': { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
      'Good':      { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
    };
    const cond = COND[listing.condition] ?? { bg: '#F5F2EC', text: '#6E7A8A', border: '#E8E2D8' };

    return (
      <div className="section-padding">
        <TopBar onBack={() => navigate(`/dashboard/${sec}`)} saved={isSaved(sec, listing.id)} onSave={handleSave} saveCount={engagement.saves} liked={engagement.liked} likeCount={engagement.likes} onLike={!isOwnListing ? handleLike : undefined} shareCount={engagement.shares} shareUrl={shareUrl} onShareRecord={recordShare} onReport={() => setReportOpen(true)} />
        <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} listingTitle={listing.title ?? listing.name ?? ''} onSubmit={submitReport} />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <ImageGallery images={images} />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border" style={{ backgroundColor: cond.bg, color: cond.text, borderColor: cond.border }}>
                  {listing.condition}
                </span>
                {listing.electric && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                    <Zap size={10} /> Electric
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>{listing.title}</h1>
              <div className="flex items-center gap-1.5 mt-1 text-sm" style={{ color: '#6E7A8A' }}>
                <MapPin size={13} /> {listing.location}
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: '#0F1923' }}>Vehicle Specs</h3>
              <Spec icon={<Gauge size={14} style={{ color: '#C9A96E' }} />} label="Mileage" value={listing.mileage} />
              <Spec icon={<Calendar size={14} style={{ color: '#C9A96E' }} />} label="Year" value={String(listing.year)} />
              <Spec icon={<Fuel size={14} style={{ color: '#C9A96E' }} />} label="Fuel Type" value={listing.fuel} />
              <Spec icon={<Tag size={14} style={{ color: '#C9A96E' }} />} label="Transmission" value={listing.transmission} />
              <Spec icon={<Tag size={14} style={{ color: '#C9A96E' }} />} label="Exterior Color" value={listing.color} />
              <Spec icon={<MapPin size={14} style={{ color: '#C9A96E' }} />} label="Located" value={listing.location} />
            </div>

            <DescriptionBlock text={description} />

            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#0F1923' }}>Vehicle Features</h3>
              <div className="flex flex-wrap gap-2">
                {['Navigation System', 'Backup Camera', 'Bluetooth', 'Heated Seats', 'Sunroof', listing.electric ? 'Fast Charging' : 'Fuel Efficient', 'Lane Assist', 'Apple CarPlay'].map(f => (
                  <span key={f} className="text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ backgroundColor: '#F5F2EC', color: '#1A3353', border: '1px solid #E8E2D8' }}>
                    <CheckCircle2 size={11} style={{ color: '#C9A96E' }} /> {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#0F1923' }}>${listing.price?.toLocaleString()}</p>
                  <p className="text-xs mt-1" style={{ color: '#6E7A8A' }}>Listed price · Negotiable</p>
                </div>

                <button
                  onClick={() => startInquiry({
                    listingId: listing.id,
                    listingTitle: listing.title,
                    listingPrice: `$${listing.price?.toLocaleString()}`,
                    listingImage: listing.image,
                    listingCategory: listing.category,
                    sellerName: listing.seller,
                    sellerId: listing.userId,
                  })}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: '#1A3353', color: '#fff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'; }}
                >
                  <MessageCircle size={15} /> Chat with Seller
                </button>

                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: isSaved(sec!, listing?.id) ? '#FEF2F2' : '#F5F2EC', color: isSaved(sec!, listing?.id) ? '#B91C1C' : '#1A3353', border: `1px solid ${isSaved(sec!, listing?.id) ? '#FECACA' : '#E8E2D8'}` }}
                >
                  <Heart size={15} className={isSaved(sec!, listing?.id) ? 'fill-red-500' : ''} /> {isSaved(sec!, listing?.id) ? 'Saved' : 'Save Vehicle'}
                </button>
              </div>

              <SellerCard
                name={listing.seller}
                subtitle="Vehicle Seller"
                verified={listing.verified}
                stats={[{ label: 'Active listings', value: String(sellerListingCount) }]}
                onViewProfile={() => navigate(`/dashboard/seller/${encodeURIComponent(listing.userId ?? listing.seller)}`)}
              />
              <ListingMap location={listing.location} />
            </div>
          </div>
        </div>
        <SimilarListings section={sec} currentId={listing.id} category={listing.category} />
      </div>
    );
  }

  return null;
}

/* ─── similar listings ───────────────────────────────────────────── */
function getPriceLabel(item: any, section: string): string {
  if (section === 'marketplace') return `$${item.price?.toLocaleString()}`;
  if (section === 'jobs') return item.salary ?? '';
  if (section === 'real-estate') return item.priceDisplay ?? '';
  if (section === 'services') return item.rate ?? '';
  if (section === 'events') return item.priceDisplay ?? '';
  if (section === 'transport') return `$${item.price?.toLocaleString()}`;
  return '';
}

function getSubLabel(item: any, section: string): string {
  if (section === 'marketplace') return `${item.condition} · ${item.category}`;
  if (section === 'jobs') return `${item.company} · ${item.type}`;
  if (section === 'real-estate') return `${item.beds}bd ${item.baths}ba · ${item.mode}`;
  if (section === 'services') return `${item.category} · ${item.rating}★`;
  if (section === 'events') return `${item.date} · ${item.category}`;
  if (section === 'transport') return `${item.year} · ${item.category}`;
  return '';
}

function getDisplayTitle(item: any): string {
  return item.title ?? item.name ?? '';
}

function SimilarListings({ section, currentId, category }: { section: string; currentId: string; category?: string }) {
  const navigate = useNavigate();
  const { getAllListings } = useUserListings();
  const all = getAllListings().filter(item => item.section === section);

  const sameCategory = category ? all.filter(i => i.id !== currentId && (i.category === category || i.mode === category)) : [];
  const others = all.filter(i => i.id !== currentId && !sameCategory.includes(i));
  const items = [...sameCategory, ...others].slice(0, 4);

  if (items.length === 0) return null;

  return (
    <div className="mt-10 pt-8" style={{ borderTop: '1px solid #E8E2D8' }}>
      <h3 className="text-base font-bold mb-5" style={{ color: '#0F1923', letterSpacing: '-0.02em' }}>
        Similar Listings
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map(item => (
          <div
            key={item.id}
            className="group cursor-pointer rounded-2xl overflow-hidden transition-all hover:shadow-md"
            style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}
            onClick={() => navigate(listingDetailPath(section, item.id, item), { state: { listing: item } })}
          >
            {/* Image */}
            <div className="relative overflow-hidden" style={{ height: '120px', backgroundColor: '#F5F2EC' }}>
              <img
                src={item.image}
                alt={getDisplayTitle(item)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'; }}
              />
            </div>

            {/* Info */}
            <div className="p-3 space-y-1">
              <p className="text-xs font-bold leading-snug line-clamp-2" style={{ color: '#0F1923' }}>
                {getDisplayTitle(item)}
              </p>
              <p className="text-xs font-bold" style={{ color: '#C9A96E' }}>
                {getPriceLabel(item, section)}
              </p>
              <p className="text-[10px] leading-tight truncate" style={{ color: '#6E7A8A' }}>
                {getSubLabel(item, section)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── report modal ───────────────────────────────────────────────── */
const REPORT_REASONS = [
  { id: 'spam',        label: 'Spam or scam',           icon: '🚫' },
  { id: 'misleading',  label: 'Misleading information', icon: '⚠️' },
  { id: 'prohibited',  label: 'Prohibited item',        icon: '🔒' },
  { id: 'wrong_cat',   label: 'Wrong category',         icon: '📂' },
  { id: 'inappropriate', label: 'Inappropriate content', icon: '🙈' },
  { id: 'other',       label: 'Other',                  icon: '💬' },
];

function ReportModal({ open, onClose, listingTitle, onSubmit }: {
  open: boolean;
  onClose: () => void;
  listingTitle: string;
  onSubmit: (reason: string, details: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string>('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await onSubmit(selected, details);
      setSubmitted(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not submit report';
      setErrorMessage(message);
      console.error('Listing report submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setSelected('');
      setDetails('');
      setSubmitted(false);
      setSubmitting(false);
      setErrorMessage('');
    }, 300);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,25,35,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #F0EBE1' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FEF2F2' }}>
              <Flag size={15} style={{ color: '#DC2626' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#0F1923' }}>Report Listing</p>
              <p className="text-xs truncate max-w-[220px]" style={{ color: '#6E7A8A' }}>{listingTitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: '#F5F2EC' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EDE8DF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; }}
          >
            <X size={15} style={{ color: '#6E7A8A' }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#F0FDF4' }}>
                <Check size={26} style={{ color: '#15803D' }} />
              </div>
              <p className="text-base font-bold mb-1" style={{ color: '#0F1923' }}>Report submitted</p>
              <p className="text-sm" style={{ color: '#6E7A8A' }}>Thanks for helping keep the community safe. We'll review this listing shortly.</p>
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#1A3353', color: '#fff' }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6E7A8A' }}>
                What's the issue?
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {REPORT_REASONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r.id)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
                    style={{
                      backgroundColor: selected === r.id ? '#FEF2F2' : '#F5F2EC',
                      border: `1.5px solid ${selected === r.id ? '#FECACA' : 'transparent'}`,
                      color: selected === r.id ? '#DC2626' : '#3D4F61',
                    }}
                  >
                    <span className="text-base leading-none">{r.icon}</span>
                    <span className="leading-tight">{r.label}</span>
                  </button>
                ))}
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: '#6E7A8A' }}>
                  Additional details <span style={{ color: '#B0BAC4', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Describe the issue in more detail…"
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none transition-all"
                  style={{
                    backgroundColor: '#F5F2EC',
                    border: '1.5px solid #E8E2D8',
                    color: '#0F1923',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.backgroundColor = '#fff'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#E8E2D8'; e.currentTarget.style.backgroundColor = '#F5F2EC'; }}
                />
                <p className="text-right text-xs mt-1" style={{ color: '#B0BAC4' }}>{details.length}/500</p>
              </div>

              {errorMessage && (
                <p role="alert" className="mb-3 text-xs text-red-600">{errorMessage}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A', border: '1px solid #E8E2D8' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selected || submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: selected && !submitting ? '#DC2626' : '#F5F2EC',
                    color: selected && !submitting ? '#fff' : '#B0BAC4',
                    cursor: selected && !submitting ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Flag size={13} />
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── shared sub-components ──────────────────────────────────────── */
function TopBar({
  onBack,
  saved,
  onSave,
  saveLabel = 'Save',
  saveCount = 0,
  liked = false,
  likeCount = 0,
  onLike,
  shareCount = 0,
  shareUrl,
  onReport,
  onShare,
  onShareRecord,
}: {
  onBack: () => void;
  saved: boolean;
  onSave: () => void;
  saveLabel?: string;
  saveCount?: number;
  liked?: boolean;
  likeCount?: number;
  onLike?: () => void;
  shareCount?: number;
  shareUrl?: string;
  onReport?: () => void;
  onShare?: () => void;
  onShareRecord?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    onShareRecord?.();
    if (onShare) { onShare(); return; }
    const url = shareUrl ?? window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <div className="sticky top-2 z-30 mb-1 flex items-center justify-between">
      <div className="rounded-xl border border-border bg-background p-1 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/40"
        >
          <ArrowLeft size={15} /> Back to listings
        </button>
      </div>

      <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1 shadow-sm">
        {onLike && (
          <button
            type="button"
            onClick={onLike}
            aria-pressed={liked}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors hover:bg-accent/40"
            style={{ color: liked ? '#B91C1C' : '#6E7A8A' }}
            title="Like listing"
          >
            <Heart size={14} className={liked ? 'fill-red-500' : ''} />
            <span>{likeCount}</span>
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent/40"
          style={{ color: saved ? '#B91C1C' : '#6E7A8A' }}
        >
          <Bookmark size={14} className={saved ? 'fill-current' : ''} />
          <span className="hidden sm:inline">{saveLabel}{saveCount > 0 ? ` · ${saveCount}` : ''}</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent/40"
          style={{ color: copied ? '#15803D' : '#6E7A8A' }}
          onClick={handleShare}
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          <span className="hidden sm:inline">{copied ? 'Copied!' : `Share${shareCount > 0 ? ` · ${shareCount}` : ''}`}</span>
        </button>
        {onReport && (
          <button
            onClick={onReport}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
            title="Report this listing"
          >
            <Flag size={14} />
            <span className="hidden sm:inline">Report</span>
          </button>
        )}
      </div>
    </div>
  );
}

function DescriptionBlock({ text, title = 'Description' }: { text: string; title?: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split('\n').filter(Boolean);
  const showMore = lines.length > 5;
  const displayed = expanded ? lines : lines.slice(0, 5);

  return (
    <div>
      <h3 className="text-sm font-bold mb-3" style={{ color: '#0F1923' }}>{title}</h3>
      <div className="space-y-2">
        {displayed.map((line, i) => (
          <p key={i} className="text-sm leading-relaxed" style={{ color: '#3D4F61' }}>{line}</p>
        ))}
      </div>
      {showMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-sm font-semibold mt-3 transition-colors"
          style={{ color: '#C9A96E' }}
        >
          {expanded ? 'Show less ↑' : 'Show more ↓'}
        </button>
      )}
    </div>
  );
}

function ListingMap({ location }: { location?: string }) {
  if (!location) return null;
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed&z=14`;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E2D8' }}>
      <div className="px-4 py-3" style={{ backgroundColor: '#fff' }}>
        <h3 className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: '#6E7A8A' }}>Location</h3>
        <p className="text-sm font-semibold" style={{ color: '#1A3353' }}>{location}</p>
      </div>
      <iframe
        title="Map"
        src={src}
        width="100%"
        height="200"
        style={{ border: 0, display: 'block' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

function SellerCard({
  name, subtitle, verified, avatarLetter, avatarBg, rating, stats, onViewProfile,
}: {
  name: string;
  subtitle: string;
  verified?: boolean;
  avatarLetter?: string;
  avatarBg?: string;
  rating?: number;
  stats?: { label: string; value: string }[];
  onViewProfile?: () => void;
}) {
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}>
      <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#6E7A8A' }}>Contact</h3>
      <div className="flex items-center gap-3">
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 transition-opacity"
          style={{ backgroundColor: avatarBg ?? '#1A3353', opacity: onViewProfile ? 1 : 1 }}
          onClick={onViewProfile}
          title={onViewProfile ? `View ${name}'s profile` : undefined}
        >
          {avatarLetter ?? name?.[0]}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {onViewProfile ? (
              <button
                className="font-semibold text-sm hover:underline text-left"
                style={{ color: '#0F1923' }}
                onClick={onViewProfile}
              >
                {name}
              </button>
            ) : (
              <p className="font-semibold text-sm" style={{ color: '#0F1923' }}>{name}</p>
            )}
            {verified && <CheckCircle2 size={13} style={{ color: '#C9A96E' }} />}
          </div>
          <p className="text-xs" style={{ color: '#6E7A8A' }}>{subtitle}</p>
          {rating && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold" style={{ color: '#0F1923' }}>{rating}</span>
            </div>
          )}
        </div>
        {onViewProfile && (
          <button
            onClick={onViewProfile}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: '#F0EBE1', color: '#1A3353', border: '1px solid #E8D9BC' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#C9A96E'; (e.currentTarget as HTMLElement).style.color = '#0F1923'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F0EBE1'; (e.currentTarget as HTMLElement).style.color = '#1A3353'; }}
          >
            View Profile
          </button>
        )}
      </div>
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          {stats.map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#F5F2EC' }}>
              <p className="text-sm font-bold" style={{ color: '#0F1923' }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: '#6E7A8A' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
