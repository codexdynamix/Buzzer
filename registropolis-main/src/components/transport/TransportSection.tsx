import React, { useState } from 'react';
import { Search, Plus, Heart, MapPin, Gauge, Calendar, Fuel, MessageCircle, Phone, SlidersHorizontal, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import CreateListingModal from '@/components/shared/CreateListingModal';
import { useUserListings } from '@/context/UserListingsContext';
import { useChatContext } from '@/context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { useSaved } from '@/context/SavedContext';
import { listingDetailPath } from '@/lib/utils';
import ListingAuthor from '@/components/shared/ListingAuthor';
import { useLocalization } from '@/i18n/LocalizationContext';

const CATEGORIES = ['All', 'Cars', 'Motorcycles', 'Trucks & Vans', 'SUVs', 'Electric'];



const COND: Record<string,{ bg:string; text:string; border:string }> = {
  'New':      { bg:'#F0FDF4', text:'#15803D', border:'#BBF7D0' },
  'Like New': { bg:'#EFF6FF', text:'#1D4ED8', border:'#BFDBFE' },
  'Excellent':{ bg:'#F5F3FF', text:'#6D28D9', border:'#DDD6FE' },
  'Good':     { bg:'#FFFBEB', text:'#B45309', border:'#FDE68A' },
};

export default function TransportSection() {
  const { t } = useLocalization();
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch] = useState('');
  const { isSaved, toggleSaved } = useSaved();
  const [showModal, setShowModal] = useState(false);
  const { getListingsForSection, addListing } = useUserListings();
  const navigate = useNavigate();
  const { openChatWithListing, getUnreadForListing } = useChatContext();
  const userListings = getListingsForSection('transport');

  const allVehicles = userListings;
  const filtered = allVehicles.filter(v =>
    (activeCat === 'All' || v.category === activeCat || (activeCat === 'Electric' && v.electric)) &&
    (v.title ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleNewListing = (data: any) => {
    const vehicle = {
      id: `u_${Date.now()}`,
      ...data,
      electric: data.electric ?? data.fuel === 'Electric',
      price: data.price === '' ? undefined : Number(data.price),
      year: data.year ? Number(data.year) : undefined,
      image: data.imageUrl,
    };
    return addListing('transport', vehicle);
  };

  return (
    <div className="section-padding space-y-6">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="gold-accent mb-3" />
          <h1 className="text-2xl font-bold" style={{ color:'#0F1923', letterSpacing:'-0.03em' }}>{t('Transport')}</h1>
          <p className="text-sm mt-1" style={{ color:'#6E7A8A' }}>Vehicles listed by your community</p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ backgroundColor:'#1A3353', color:'#ffffff' }}
          onClick={() => setShowModal(true)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#142842'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 14px rgba(26,51,83,0.25)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (e.currentTarget as HTMLElement).style.boxShadow=''; }}
        >
          <Plus size={15} strokeWidth={2.5} /> List a Vehicle
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color:'#6E7A8A' }} />
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search makes, models, year…"
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

      <p className="text-xs font-medium" style={{ color:'#6E7A8A' }}>{filtered.length} vehicles listed</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(v => {
          const cond = COND[v.condition] ?? { bg:'#F5F2EC', text:'#6E7A8A', border:'#E8E2D8' };
          return (
            <div key={v.id} className="card-premium group cursor-pointer overflow-hidden" onClick={() => navigate(listingDetailPath('transport', v.id, v), { state: { listing: v } })}>
              {/* Image */}
              <div className="relative h-48 overflow-hidden" style={{ backgroundColor:'#F5F2EC' }}>
                {v.imageUrl ?? v.image ? <img src={v.imageUrl ?? v.image} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : null}

                {/* Condition */}
                {v.condition && <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg border" style={{ backgroundColor:cond.bg, color:cond.text, borderColor:cond.border, backdropFilter:'blur(4px)' }}>
                    {v.condition}
                  </span>
                </div>}

                {v.electric && (
                  <div className="absolute top-3 right-10">
                    <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ backgroundColor:'#F0FDF4', color:'#15803D', border:'1px solid #BBF7D0' }}>
                      <Zap size={9} className="fill-current" /> EV
                    </span>
                  </div>
                )}

                <button
                  onClick={e=>{e.stopPropagation(); toggleSaved('transport', v);}}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor:'rgba(255,255,255,0.96)', boxShadow:'0 1px 4px rgba(15,25,35,0.12)' }}
                >
                  <Heart size={13} style={{ color: isSaved('transport', v.id) ? undefined : '#6E7A8A' }} className={isSaved('transport', v.id) ? 'fill-red-500 text-red-500' : ''} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1" style={{ color:'#0F1923' }}>{v.title}</h3>
                  {v.price != null && <p className="text-xl font-bold" style={{ color:'#0F1923' }}>${Number(v.price).toLocaleString()}</p>}
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-1.5 text-xs" style={{ color:'#6E7A8A' }}>
                  {v.mileage && <span className="flex items-center gap-1"><Gauge size={11} className="shrink-0" />{v.mileage}</span>}
                  {v.year && <span className="flex items-center gap-1"><Calendar size={11} className="shrink-0" />{v.year}</span>}
                  {v.fuel && <span className="flex items-center gap-1"><Fuel size={11} className="shrink-0" />{v.fuel}</span>}
                  {v.location && <span className="flex items-center gap-1"><MapPin size={11} className="shrink-0" />{v.location.split(',')[1]?.trim() ?? v.location}</span>}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3" style={{ borderTop:'1px solid #E8E2D8' }}>
                  <ListingAuthor listing={v} />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openChatWithListing({
                          listingId: v.id,
                          listingTitle: v.title,
                          listingPrice: v.price == null ? '' : `$${Number(v.price).toLocaleString()}`,
                          listingImage: v.imageUrl ?? v.image ?? '',
                          listingCategory: 'Transport',
                          sellerName: v.owner?.name ?? v.seller,
                          sellerUserId: v.owner?.id ?? v.userId,
                        });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ backgroundColor:'#F0EBE1', color:'#1A3353', border:'1px solid #E8D9BC' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (e.currentTarget as HTMLElement).style.color='#ffffff'; (e.currentTarget as HTMLElement).style.borderColor='#1A3353'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#F0EBE1'; (e.currentTarget as HTMLElement).style.color='#1A3353'; (e.currentTarget as HTMLElement).style.borderColor='#E8D9BC'; }}
                    >
                      <Phone size={11} /> Contact
                    </button>
                    <div className="relative">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          openChatWithListing({
                            listingId: v.id,
                            listingTitle: v.title,
                            listingPrice: v.price == null ? '' : `$${Number(v.price).toLocaleString()}`,
                            listingImage: v.imageUrl ?? v.image ?? '',
                            listingCategory: 'Transport',
                            sellerName: v.seller,
                            sellerUserId: v.owner?.id ?? v.userId,
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ backgroundColor:'#1A3353', color:'#ffffff' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#142842'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 12px rgba(26,51,83,0.25)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (e.currentTarget as HTMLElement).style.boxShadow=''; }}
                      >
                        <MessageCircle size={11} /> Chat
                      </button>
                      {getUnreadForListing(v.id, 'Transport') > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white font-bold pointer-events-none" style={{ backgroundColor:'#E53E3E', fontSize:'9px', padding:'0 3px' }}>
                          {getUnreadForListing(v.id, 'Transport')}
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
          <h3 className="font-semibold mb-1" style={{ color:'#0F1923' }}>No vehicles found</h3>
          <p className="text-sm" style={{ color:'#6E7A8A' }}>Try a different search or category</p>
        </div>
      )}
      <CreateListingModal type="transport" open={showModal} onClose={() => setShowModal(false)} onSubmit={handleNewListing} />
    </div>
  );
}
