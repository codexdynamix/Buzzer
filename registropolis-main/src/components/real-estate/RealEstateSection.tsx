import React, { useState } from 'react';
import { Search, Plus, Heart, MapPin, BedDouble, Bath, Maximize2, Phone, MessageCircle, SlidersHorizontal } from 'lucide-react';
import { useChatContext } from '@/context/ChatContext';
import { cn } from '@/lib/utils';
import CreateListingModal from '@/components/shared/CreateListingModal';
import { useUserListings } from '@/context/UserListingsContext';
import { useNavigate } from 'react-router-dom';
import { useSaved } from '@/context/SavedContext';
import { listingDetailPath } from '@/lib/utils';
import ListingAuthor from '@/components/shared/ListingAuthor';

const TYPES = ['All', 'Buy', 'Rent', 'Commercial'];
const BEDS = ['Any', '1+', '2+', '3+', '4+'];

export default function RealEstateSection() {
  const [mode, setMode] = useState('All');
  const [activeBeds, setActiveBeds] = useState('Any');
  const [search, setSearch] = useState('');
  const { isSaved, toggleSaved } = useSaved();
  const [showModal, setShowModal] = useState(false);
  const { getListingsForSection, addListing } = useUserListings();
  const { openChatWithListing, getUnreadForListing } = useChatContext();
  const userListings = getListingsForSection('real-estate');
  const navigate = useNavigate();

  const allProperties = userListings;
  const filtered = allProperties.filter(p =>
    (mode === 'All' || p.mode === mode) &&
    (activeBeds === 'Any' || p.beds >= parseInt(activeBeds)) &&
    (`${p.title ?? ''} ${p.address ?? ''} ${p.location ?? ''}`).toLowerCase().includes(search.toLowerCase())
  );

  const handleNewListing = (data: any) => {
    const price = data.price === '' ? undefined : Number(data.price);
    const isRent = data.mode === 'Rent';
    const property = {
      id: `u_${Date.now()}`,
      ...data,
      price,
      priceDisplay: price === undefined ? undefined : isRent
        ? `$${price.toLocaleString()}/mo`
        : price >= 1_000_000
          ? `$${(price / 1_000_000).toFixed(1)}M`
          : `$${price.toLocaleString()}`,
      beds: data.beds === '' ? undefined : Number(data.beds),
      baths: data.baths === '' ? undefined : Number(data.baths),
      sqft: data.sqft === '' ? undefined : Number(data.sqft),
      image: data.imageUrl,
    };
    return addListing('real-estate', property);
  };

  return (
    <div className="section-padding space-y-6">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="gold-accent mb-3" />
          <h1 className="text-2xl font-bold" style={{ color:'#0F1923', letterSpacing:'-0.03em' }}>Real Estate</h1>
          <p className="text-sm mt-1" style={{ color:'#6E7A8A' }}>Properties listed by your community</p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ backgroundColor:'#1A3353', color:'#ffffff' }}
          onClick={() => setShowModal(true)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#142842'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 14px rgba(26,51,83,0.25)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (e.currentTarget as HTMLElement).style.boxShadow=''; }}
        >
          <Plus size={15} strokeWidth={2.5} /> List Property
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color:'#6E7A8A' }} />
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by address, city, or listing…"
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

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {TYPES.map(t => (
            <button key={t} onClick={()=>setMode(t)} className={cn('chip', mode===t ? 'chip-active' : 'chip-default')}>
              {t}
            </button>
          ))}
        </div>
        <div className="h-5 w-px" style={{ backgroundColor:'#E8E2D8' }} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color:'#6E7A8A' }}>Beds:</span>
          {BEDS.map(b => (
            <button key={b} onClick={()=>setActiveBeds(b)} className={cn('chip text-xs px-2.5 py-1', activeBeds===b ? 'chip-active' : 'chip-default')}>
              {b}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs font-medium" style={{ color:'#6E7A8A' }}>{filtered.length} properties</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(p => {
          return (
            <div key={p.id} className="card-premium group cursor-pointer overflow-hidden" onClick={() => navigate(listingDetailPath('real-estate', p.id, p), { state: { listing: p } })}>
              {/* Image */}
              <div className="relative h-52 overflow-hidden" style={{ backgroundColor:'#F5F2EC' }}>
                {(p.imageUrl ?? p.image) && <img src={p.imageUrl ?? p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}

                {/* Overlaid badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor:'#F5F2EC', color:'#1A3353' }}>
                    {p.mode}
                  </span>
                </div>
                <span
                  className="absolute top-3 right-10 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                  style={{
                    backgroundColor: p.mode === 'Rent' ? '#EFF6FF' : '#0F1923',
                    color: p.mode === 'Rent' ? '#1D4ED8' : '#ffffff',
                  }}
                >
                  For {p.mode}
                </span>
                {/* Save */}
                <button
                  onClick={e=>{e.stopPropagation(); toggleSaved('real-estate', p);}}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor:'rgba(255,255,255,0.96)', boxShadow:'0 1px 4px rgba(15,25,35,0.12)' }}
                >
                  <Heart size={13} style={{ color: isSaved('real-estate', p.id) ? undefined : '#6E7A8A' }} className={isSaved('real-estate', p.id) ? 'fill-red-500 text-red-500' : ''} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm leading-tight" style={{ color:'#0F1923' }}>{p.title}</h3>
                    {p.priceDisplay && <span className="text-base font-bold shrink-0" style={{ color:'#C9A96E' }}>{p.priceDisplay}</span>}
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color:'#6E7A8A' }}>
                    <MapPin size={11} className="shrink-0" />
                    <span className="truncate">{p.address}</span>
                  </div>
                </div>

                {/* Specs */}
                <div className="flex items-center gap-4">
                  {p.beds != null && <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color:'#0F1923' }}>
                    <BedDouble size={14} style={{ color:'#6E7A8A' }} />{p.beds}
                  </span>}
                  {p.baths != null && <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color:'#0F1923' }}>
                    <Bath size={14} style={{ color:'#6E7A8A' }} />{p.baths}
                  </span>}
                  {p.sqft != null && <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color:'#0F1923' }}>
                    <Maximize2 size={14} style={{ color:'#6E7A8A' }} />{p.sqft.toLocaleString()} ft²
                  </span>}
                </div>

                {/* Agent */}
                <div className="flex items-center justify-between pt-3" style={{ borderTop:'1px solid #E8E2D8' }}>
                  <div className="flex items-center gap-2">
                    <ListingAuthor listing={p} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openChatWithListing({
                          listingId: p.id,
                          listingTitle: p.title,
                          listingPrice: p.priceDisplay ?? '',
                          listingImage: p.imageUrl ?? p.image ?? '',
                          listingCategory: 'Real Estate',
                          sellerName: p.owner?.name ?? p.seller,
                          sellerUserId: p.userId ?? p.owner?.id ?? p.owner?.userId ?? '',
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
                            listingId: p.id,
                            listingTitle: p.title,
                            listingPrice: p.priceDisplay,
                            listingImage: p.imageUrl ?? p.image,
                            listingCategory: 'Real Estate',
                            sellerName: p.agent ?? p.seller,
                            sellerUserId: p.userId ?? p.owner?.id ?? p.owner?.userId ?? '',
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ backgroundColor:'#1A3353', color:'#ffffff' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#142842'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 12px rgba(26,51,83,0.25)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (e.currentTarget as HTMLElement).style.boxShadow=''; }}
                      >
                        <MessageCircle size={11} /> Chat
                      </button>
                      {getUnreadForListing(p.id, 'Real Estate') > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white font-bold pointer-events-none" style={{ backgroundColor:'#E53E3E', fontSize:'9px', padding:'0 3px' }}>
                          {getUnreadForListing(p.id, 'Real Estate')}
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
          <h3 className="font-semibold mb-1" style={{ color:'#0F1923' }}>No properties found</h3>
          <p className="text-sm" style={{ color:'#6E7A8A' }}>Adjust your filters to see more listings</p>
        </div>
      )}
      <CreateListingModal type="real-estate" open={showModal} onClose={() => setShowModal(false)} onSubmit={handleNewListing} />
    </div>
  );
}
