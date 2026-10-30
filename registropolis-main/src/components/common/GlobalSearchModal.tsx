import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, ShoppingBag, Briefcase, Wrench, Home, Truck, Calendar,
  ArrowRight, Store, MessageCircle, PlusCircle, Sparkles, MapPin, Tag
} from 'lucide-react';
import { useUserListings } from '@/context/UserListingsContext';
import { listingDetailPath } from '@/lib/utils';
import { useLocalization } from '@/i18n/LocalizationContext';

const SECTOR_ICONS: Record<string, React.ElementType> = {
  marketplace: ShoppingBag,
  job: Briefcase,
  jobs: Briefcase,
  services: Wrench,
  service: Wrench,
  'real-estate': Home,
  transport: Truck,
  events: Calendar,
  event: Calendar,
};

const SECTOR_LABELS: Record<string, string> = {
  marketplace: 'Marketplace',
  jobs: 'Jobs',
  job: 'Jobs',
  services: 'Services',
  service: 'Services',
  'real-estate': 'Real Estate',
  transport: 'Transport',
  events: 'Events',
  event: 'Events',
};

const QUICK_ACTIONS = [
  { label: 'Post a New Listing', icon: PlusCircle, path: '/dashboard/my-listings' },
  { label: 'Seller Storefront Settings', icon: Store, path: '/dashboard/my-listings' },
  { label: 'Direct Messages', icon: MessageCircle, path: '/dashboard/messages' },
  { label: 'Browse Local Businesses & Ads', icon: Sparkles, path: '/dashboard/business?tab=ads' },
];

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { getAllListings } = useUserListings();
  const [query, setQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedSector('all');
    }
  }, [isOpen]);

  // Global keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const allListings = useMemo(() => getAllListings(), [getAllListings]);

  const matchingListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allListings.filter(item => {
      if (selectedSector !== 'all' && item.section !== selectedSector) return false;
      if (!q) return true;
      const titleMatch = item.title?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const locMatch = item.location?.toLowerCase().includes(q);
      const categoryMatch = item.category?.toLowerCase().includes(q);
      return titleMatch || descMatch || locMatch || categoryMatch;
    }).slice(0, 8);
  }, [allListings, query, selectedSector]);

  if (!isOpen) return null;

  const handleSelectListing = (item: any) => {
    onClose();
    navigate(listingDetailPath(item.section, item.id, item), { state: { listing: item } });
  };

  const handleSelectAction = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24 bg-[#0F1923]/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#FAFAF7] border border-[#E8E2D8] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        style={{ color: '#0F1923' }}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E8E2D8] bg-white">
          <Search size={18} className="text-[#C9A96E] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search listings, jobs, services, apartments, cars, and events..."
            className="flex-1 bg-transparent text-sm placeholder:text-[#9CA3AF] text-[#0F1923] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#9CA3AF] hover:text-[#0F1923] p-1 rounded"
            >
              <X size={15} />
            </button>
          )}
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-[#D1C9BC] text-[10px] text-[#6E7A8A] font-mono">
            ESC
          </span>
        </div>

        {/* Sector Quick Filters */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#E8E2D8] bg-[#F5F2EC] overflow-x-auto text-xs no-scrollbar">
          <button
            onClick={() => setSelectedSector('all')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 ${
              selectedSector === 'all'
                ? 'bg-[#1A3353] text-white'
                : 'bg-white border border-[#D1C9BC] text-[#4A5568] hover:bg-black/5'
            }`}
          >
            All Sectors
          </button>
          {['marketplace', 'jobs', 'services', 'real-estate', 'transport', 'events'].map(sec => {
            const Icon = SECTOR_ICONS[sec] || Tag;
            const active = selectedSector === sec;
            return (
              <button
                key={sec}
                onClick={() => setSelectedSector(active ? 'all' : sec)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 ${
                  active
                    ? 'bg-[#1A3353] text-white'
                    : 'bg-white border border-[#D1C9BC] text-[#4A5568] hover:bg-black/5'
                }`}
              >
                <Icon size={12} />
                <span>{SECTOR_LABELS[sec]}</span>
              </button>
            );
          })}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Matching Listings */}
          <div>
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#6E7A8A] flex items-center justify-between">
              <span>Matching Listings ({matchingListings.length})</span>
              {query && (
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/dashboard/${selectedSector === 'all' ? 'marketplace' : selectedSector}?search=${encodeURIComponent(query)}`);
                  }}
                  className="text-[#C9A96E] hover:underline flex items-center gap-0.5 normal-case font-semibold text-xs"
                >
                  See all results <ArrowRight size={11} />
                </button>
              )}
            </div>

            {matchingListings.length > 0 ? (
              <div className="space-y-1 mt-1">
                {matchingListings.map(item => {
                  const Icon = SECTOR_ICONS[item.section] || Tag;
                  return (
                    <button
                      key={`${item.section}-${item.id}`}
                      onClick={() => handleSelectListing(item)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E8E2D8] transition-all flex items-center gap-3 group"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-11 h-11 rounded-lg object-cover shrink-0 border border-[#E8E2D8]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-[#F0EBE1] text-[#C9A96E] flex items-center justify-center shrink-0">
                          <Icon size={18} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-800">
                            {SECTOR_LABELS[item.section] || item.section}
                          </span>
                          <span className="font-semibold text-xs text-[#0F1923] truncate group-hover:text-[#1A3353]">
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#6E7A8A]">
                          {item.priceDisplay || item.salary || item.rate || (item.price ? `$${item.price}` : '') ? (
                            <span className="font-bold text-[#C9A96E]">
                              {item.priceDisplay || item.salary || item.rate || `$${item.price}`}
                            </span>
                          ) : null}
                          {item.location && (
                            <span className="flex items-center gap-0.5 truncate">
                              <MapPin size={10} /> {item.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-[#9CA3AF] group-hover:text-[#0F1923] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#6E7A8A]">
                No listings matching "{query}". Try a different term or sector.
              </div>
            )}
          </div>

          {/* Quick Platform Shortcuts */}
          {!query && (
            <div className="pt-2 border-t border-[#E8E2D8]">
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#6E7A8A]">
                Quick Shortcuts
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                {QUICK_ACTIONS.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => handleSelectAction(action.path)}
                      className="text-left px-3 py-2 rounded-xl bg-white border border-[#E8E2D8] hover:border-[#C9A96E] hover:bg-[#FAF8F5] transition-all flex items-center gap-2.5 text-xs font-semibold text-[#0F1923]"
                    >
                      <div className="w-6 h-6 rounded-md bg-[#F0EBE1] text-[#C9A96E] flex items-center justify-center shrink-0">
                        <Icon size={13} />
                      </div>
                      <span className="truncate">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-[#E8E2D8] bg-[#F5F2EC] flex items-center justify-between text-[11px] text-[#6E7A8A]">
          <span>Type to search across all community categories</span>
          <span className="font-medium text-[#0F1923]">Buzzer Search</span>
        </div>
      </div>
    </div>
  );
}
