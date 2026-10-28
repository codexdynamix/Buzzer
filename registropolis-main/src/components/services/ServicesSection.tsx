import React, { useState } from 'react';
import { Search, Plus, Star, Clock, MessageCircle, Phone, MapPin, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import CreateListingModal from '@/components/shared/CreateListingModal';
import { useUserListings } from '@/context/UserListingsContext';
import { useNavigate } from 'react-router-dom';
import { listingDetailPath } from '@/lib/utils';
import ListingAuthor from '@/components/shared/ListingAuthor';
import { useChatContext } from '@/context/ChatContext';
import { useLocalization } from '@/i18n/LocalizationContext';

const CATEGORIES = ['All', 'Home Repair', 'Cleaning', 'Design', 'Tutoring', 'Health', 'Tech Support'];



export default function ServicesSection() {
  const { t } = useLocalization();
  const [activeCat, setActiveCat] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { getListingsForSection, addListing } = useUserListings();
  const { openChatWithListing } = useChatContext();
  const navigate = useNavigate();
  const userListings = getListingsForSection('service');

  const allServices = userListings;
  const filtered = allServices.filter(s =>
    (activeCat === 'All' || s.category === activeCat) &&
    (`${s.name ?? s.seller ?? ''} ${s.title ?? ''}`).toLowerCase().includes(search.toLowerCase())
  );

  const handleNewListing = (data: any) => {
    const service = {
      id: `u_${Date.now()}`,
      ...data,
      tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    };
    return addListing('service', service);
  };

  return (
    <div className="section-padding space-y-6">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="gold-accent mb-3" />
          <h1 className="text-2xl font-bold" style={{ color:'#0F1923', letterSpacing:'-0.03em' }}>{t('Services')}</h1>
          <p className="text-sm mt-1" style={{ color:'#6E7A8A' }}>Services offered by your community</p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ backgroundColor:'#1A3353', color:'#ffffff' }}
          onClick={() => setShowModal(true)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#142842'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 14px rgba(26,51,83,0.25)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (e.currentTarget as HTMLElement).style.boxShadow=''; }}
        >
          <Plus size={15} strokeWidth={2.5} /> Offer a Service
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color:'#6E7A8A' }} />
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search services or providers…"
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

      <p className="text-xs font-medium" style={{ color:'#6E7A8A' }}>{filtered.length} providers</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(svc => (
          <div key={svc.id} className="card-premium group cursor-pointer overflow-hidden" onClick={() => navigate(listingDetailPath('services', svc.id, svc), { state: { listing: svc } })}>
            {/* Photo */}
            <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor:'#F5F2EC' }}>
              {(svc.imageUrl ?? svc.image) && <img src={svc.imageUrl ?? svc.image} alt={svc.name ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
              {/* Availability badge */}
              {typeof svc.available === 'boolean' && <div className="absolute top-3 left-3">
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: svc.available ? '#F0FDF4' : '#F5F2EC',
                    color: svc.available ? '#15803D' : '#6E7A8A',
                    border: `1px solid ${svc.available ? '#BBF7D0' : '#E8E2D8'}`,
                  }}
                >
                  {svc.available ? '● Available' : '○ Busy'}
                </span>
              </div>}
              {svc.verified && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor:'rgba(255,255,255,0.96)', color:'#1A3353' }}>
                  <CheckCircle2 size={11} style={{ color:'#C9A96E' }} /> Verified Pro
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <ListingAuthor listing={svc} />
                  {Number.isFinite(svc.rating) && <div className="flex items-center gap-0.5 shrink-0">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold" style={{ color:'#0F1923' }}>{svc.rating}</span>
                    <span className="text-xs" style={{ color:'#6E7A8A' }}>({svc.reviews})</span>
                  </div>}
                </div>
                <p className="text-xs" style={{ color:'#6E7A8A' }}>{svc.title}</p>
              </div>

              <div className="flex flex-wrap gap-1">
                {(svc.tags ?? []).map((t: string) => (
                  <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor:'#F5F2EC', color:'#1A3353', border:'1px solid #E8E2D8' }}>
                    {t}
                  </span>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs" style={{ color:'#6E7A8A' }}>
                  <MapPin size={11} className="shrink-0" /><span className="truncate">{svc.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3" style={{ borderTop:'1px solid #E8E2D8' }}>
                <div>
                  <span className="text-base font-bold" style={{ color:'#0F1923' }}>{svc.rate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      openChatWithListing({
                        listingId: svc.id,
                        listingTitle: svc.title,
                        listingPrice: svc.rate ?? '',
                        listingImage: svc.imageUrl ?? svc.image ?? '',
                        listingCategory: 'Services',
                        sellerName: svc.owner?.name ?? svc.name,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ backgroundColor:'#F0EBE1', color:'#1A3353', border:'1px solid #E8D9BC' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (e.currentTarget as HTMLElement).style.color='#ffffff'; (e.currentTarget as HTMLElement).style.borderColor='#1A3353'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#F0EBE1'; (e.currentTarget as HTMLElement).style.color='#1A3353'; (e.currentTarget as HTMLElement).style.borderColor='#E8D9BC'; }}
                  >
                    <Phone size={11} /> Contact
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      openChatWithListing({
                        listingId: svc.id,
                        listingTitle: svc.title,
                        listingPrice: svc.rate ?? '',
                        listingImage: svc.imageUrl ?? svc.image ?? '',
                        listingCategory: 'Services',
                        sellerName: svc.owner?.name ?? svc.name,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ backgroundColor:'#C9A96E', color:'#0F1923' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#ba965c'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 12px rgba(201,169,110,0.3)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#C9A96E'; (e.currentTarget as HTMLElement).style.boxShadow=''; }}
                  >
                    <MessageCircle size={11} /> Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="empty-state-icon"><Search size={26} style={{ color:'#6E7A8A' }} /></div>
          <h3 className="font-semibold mb-1" style={{ color:'#0F1923' }}>No providers found</h3>
          <p className="text-sm" style={{ color:'#6E7A8A' }}>Try a different category or search</p>
        </div>
      )}
      <CreateListingModal type="service" open={showModal} onClose={() => setShowModal(false)} onSubmit={handleNewListing} />
    </div>
  );
}
