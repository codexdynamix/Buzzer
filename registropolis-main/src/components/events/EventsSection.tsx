import React, { useState } from 'react';
import { Search, Plus, Calendar, MapPin, Clock, Ticket, Heart, ArrowUpRight, MessageCircle, SlidersHorizontal } from 'lucide-react';
import { useChatContext } from '@/context/ChatContext';
import { cn } from '@/lib/utils';
import CreateListingModal from '@/components/shared/CreateListingModal';
import { useUserListings } from '@/context/UserListingsContext';
import { useNavigate } from 'react-router-dom';
import { useSaved } from '@/context/SavedContext';
import { listingDetailPath } from '@/lib/utils';
import ListingAuthor from '@/components/shared/ListingAuthor';

const CATEGORIES = ['All', 'Music', 'Sports', 'Arts & Culture', 'Business', 'Food & Drink', 'Tech'];



const CAT_STYLE: Record<string,{ bg:string; text:string }> = {
  'Music':       { bg:'#F5F3FF', text:'#6D28D9' },
  'Tech':        { bg:'#EFF6FF', text:'#1D4ED8' },
  'Food & Drink':{ bg:'#FFF7ED', text:'#C2410C' },
  'Sports':      { bg:'#F0FDF4', text:'#15803D' },
  'Arts & Culture':{ bg:'#FDF4FF', text:'#86198F' },
  'Business':    { bg:'#F8FAFC', text:'#475569' },
};

export default function EventsSection() {
  const { openChatWithListing, getUnreadForListing } = useChatContext();
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch] = useState('');
  const { isSaved, toggleSaved } = useSaved();
  const [showModal, setShowModal] = useState(false);
  const { getListingsForSection, addListing } = useUserListings();
  const navigate = useNavigate();
  const userListings = getListingsForSection('event');

  const allEvents = userListings;
  const filtered = allEvents.filter(e =>
    (activeCat === 'All' || e.category === activeCat) &&
    (e.title ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const featuredEvent = activeCat === 'All' && !search ? filtered.find(e => e.featured) : null;
  const gridEvents = featuredEvent ? filtered.filter(e => e.id !== featuredEvent.id) : filtered;

  const handleNewListing = (data: any) => {
    const price = Number(data.price) || 0;
    const event = {
      id: `u_${Date.now()}`,
      ...data,
      price,
      priceDisplay: price === 0 ? 'Free' : `$${price}`,
      image: data.imageUrl,
    };
    return addListing('event', event);
  };

  return (
    <div className="section-padding space-y-6">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="gold-accent mb-3" />
          <h1 className="text-2xl font-bold" style={{ color:'#0F1923', letterSpacing:'-0.03em' }}>Events</h1>
          <p className="text-sm mt-1" style={{ color:'#6E7A8A' }}>Events posted by your community</p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ backgroundColor:'#1A3353', color:'#ffffff' }}
          onClick={() => setShowModal(true)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#142842'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 14px rgba(26,51,83,0.25)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (e.currentTarget as HTMLElement).style.boxShadow=''; }}
        >
          <Plus size={15} strokeWidth={2.5} /> Create Event
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color:'#6E7A8A' }} />
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search events, artists, venues…"
            className="w-full pl-10 pr-4 h-10 rounded-xl text-sm focus:outline-none focus:ring-2"
            style={{ backgroundColor:'#ffffff', border:'1px solid #E8E2D8', color:'#0F1923' }}
          />
        </div>
        <button
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium transition-colors"
          style={{ backgroundColor:'#ffffff', border:'1px solid #E8E2D8', color:'#6E7A8A' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#C9A96E'; (e.currentTarget as HTMLElement).style.color='#C9A96E'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#E8E2D8'; (e.currentTarget as HTMLElement).style.color='#6E7A8A'; }}
        >
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={()=>setActiveCat(cat)} className={cn('chip', activeCat===cat ? 'chip-active' : 'chip-default')}>
            {cat}
          </button>
        ))}
      </div>

      <p className="text-xs font-medium" style={{ color:'#6E7A8A' }}>{filtered.length} events</p>

      {/* Featured Hero */}
      {featuredEvent && (() => {
        const catStyle = CAT_STYLE[featuredEvent.category] ?? { bg:'#F5F2EC', text:'#6E7A8A' };
        return (
          <div className="relative rounded-2xl overflow-hidden cursor-pointer group" style={{ height:'240px', border:'1px solid #E8E2D8' }} onClick={() => navigate(listingDetailPath('events', featuredEvent.id, featuredEvent), { state: { listing: featuredEvent } })}>
            {featuredEvent.image && <img src={featuredEvent.image} alt={featuredEvent.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
            <div className="absolute inset-0" style={{ background:'linear-gradient(to right, rgba(15,25,35,0.82) 0%, rgba(15,25,35,0.55) 50%, rgba(15,25,35,0.15) 100%)' }} />
            <div className="absolute inset-0 p-7 flex flex-col justify-end">
              <span className="self-start text-[11px] font-semibold px-2.5 py-1 rounded-lg mb-3" style={{ backgroundColor:catStyle.bg, color:catStyle.text }}>
                {featuredEvent.category}
              </span>
              <h2 className="text-2xl font-bold mb-2" style={{ color:'#ffffff', letterSpacing:'-0.03em' }}>{featuredEvent.title}</h2>
              <div className="flex items-center gap-4 text-sm" style={{ color:'rgba(255,255,255,0.75)' }}>
                <span className="flex items-center gap-1.5"><Calendar size={13} />{featuredEvent.date}</span>
                <span className="flex items-center gap-1.5"><MapPin size={13} />{featuredEvent.location}</span>
                <span className="font-semibold ml-auto" style={{ color:'#C9A96E' }}>{featuredEvent.priceDisplay}</span>
              </div>
            </div>
            <button
              className="absolute top-5 right-5 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor:'#C9A96E', color:'#0F1923' }}
              onClick={() => openChatWithListing({
                listingId: featuredEvent.id,
                listingTitle: featuredEvent.title,
                listingPrice: featuredEvent.priceDisplay ?? '',
                listingImage: featuredEvent.image ?? '',
                listingCategory: 'Events',
                sellerName: featuredEvent.owner?.name ?? featuredEvent.host ?? featuredEvent.seller,
                sellerUserId: featuredEvent.userId ?? featuredEvent.owner?.id ?? featuredEvent.owner?.userId ?? '',
              })}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#ba965c'; (e.currentTarget as HTMLElement).style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#C9A96E'; (e.currentTarget as HTMLElement).style.transform=''; }}
            >
              Contact organizer <ArrowUpRight size={14} />
            </button>
          </div>
        );
      })()}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {gridEvents.map(e => {
          const catStyle = CAT_STYLE[e.category] ?? { bg:'#F5F2EC', text:'#6E7A8A' };
          return (
            <div key={e.id} className="card-premium group cursor-pointer overflow-hidden" onClick={() => navigate(listingDetailPath('events', e.id, e), { state: { listing: e } })}>
              {/* Image */}
              <div className="relative aspect-video overflow-hidden" style={{ backgroundColor:'#F5F2EC' }}>
                {e.image && <img src={e.image} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                <button
                  onClick={ev=>{ev.stopPropagation(); toggleSaved('events', e);}}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor:'rgba(255,255,255,0.96)', boxShadow:'0 1px 4px rgba(15,25,35,0.12)' }}
                >
                  <Heart size={13} style={{ color: isSaved('events', e.id) ? undefined : '#6E7A8A' }} className={isSaved('events', e.id) ? 'fill-red-500 text-red-500' : ''} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor:catStyle.bg, color:catStyle.text }}>
                    {e.category}
                  </span>
                  <h3 className="font-semibold text-sm leading-tight mt-2 line-clamp-2" style={{ color:'#0F1923' }}>{e.title}</h3>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color:'#6E7A8A' }}>
                    <Calendar size={11} className="shrink-0" />{e.date}
                    <span style={{ color:'#E8E2D8' }}>·</span>
                    <Clock size={11} className="shrink-0" />{e.time}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color:'#6E7A8A' }}>
                    <MapPin size={11} className="shrink-0" />{e.location}
                  </div>
                  <ListingAuthor listing={e} />
                </div>

                <div className="flex items-center justify-between pt-3" style={{ borderTop:'1px solid #E8E2D8' }}>
                  <div>
                    <span className="font-bold" style={{ color:'#0F1923', fontSize:'13px' }}>{e.priceDisplay}</span>
                    {e.price === 0 && <span className="text-[10px] font-semibold ml-1.5" style={{ color:'#15803D' }}>FREE</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={ev => {
                          ev.stopPropagation();
                          openChatWithListing({
                            listingId: e.id,
                            listingTitle: e.title,
                            listingPrice: e.priceDisplay,
                            listingImage: e.image,
                            listingCategory: 'Events',
                            sellerName: e.host ?? e.seller,
                            sellerUserId: e.userId ?? e.owner?.id ?? e.owner?.userId ?? '',
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ backgroundColor:'#F0EBE1', color:'#1A3353', border:'1px solid #E8D9BC' }}
                        onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (ev.currentTarget as HTMLElement).style.color='#ffffff'; (ev.currentTarget as HTMLElement).style.borderColor='#1A3353'; }}
                        onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.backgroundColor='#F0EBE1'; (ev.currentTarget as HTMLElement).style.color='#1A3353'; (ev.currentTarget as HTMLElement).style.borderColor='#E8D9BC'; }}
                      >
                        <MessageCircle size={11} /> Chat
                      </button>
                      {getUnreadForListing(e.id, 'Events') > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white font-bold pointer-events-none" style={{ backgroundColor:'#E53E3E', fontSize:'9px', padding:'0 3px' }}>
                          {getUnreadForListing(e.id, 'Events')}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={ev => {
                        ev.stopPropagation();
                        openChatWithListing({
                          listingId: e.id,
                          listingTitle: e.title,
                          listingPrice: e.priceDisplay ?? '',
                          listingImage: e.image ?? '',
                          listingCategory: 'Events',
                          sellerName: e.owner?.name ?? e.host ?? e.seller,
                          sellerUserId: e.userId ?? e.owner?.id ?? e.owner?.userId ?? '',
                        });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ backgroundColor:'#1A3353', color:'#ffffff' }}
                      onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.backgroundColor='#142842'; (ev.currentTarget as HTMLElement).style.boxShadow='0 4px 10px rgba(26,51,83,0.25)'; }}
                      onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (ev.currentTarget as HTMLElement).style.boxShadow=''; }}
                    >
                      <Ticket size={11} /> Ask about tickets
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="empty-state-icon"><Calendar size={26} style={{ color:'#6E7A8A' }} /></div>
          <h3 className="font-semibold mb-1" style={{ color:'#0F1923' }}>No events found</h3>
          <p className="text-sm" style={{ color:'#6E7A8A' }}>Try a different category or search term</p>
        </div>
      )}
      <CreateListingModal type="event" open={showModal} onClose={() => setShowModal(false)} onSubmit={handleNewListing} />
    </div>
  );
}
