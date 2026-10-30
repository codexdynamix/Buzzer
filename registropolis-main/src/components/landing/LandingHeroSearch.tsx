import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronDown, Sparkles, Navigation } from 'lucide-react';
import { toast } from 'sonner';

const POPULAR_CITIES = [
  'All Cities',
  'New York, NY',
  'London, UK',
  'Harare, ZW',
  'Berlin, DE',
  'Toronto, CA',
  'San Francisco, CA',
  'Tokyo, JP',
  'Sydney, AU',
  'Johannesburg, ZA',
];

const SECTORS = [
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'jobs', label: 'Careers & Jobs' },
  { id: 'services', label: 'Services' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'transport', label: 'Transport' },
  { id: 'events', label: 'Events' },
];

const TRENDING_TAGS = [
  { label: 'MacBook Pro', sector: 'marketplace' },
  { label: 'Studio Apartment', sector: 'real-estate' },
  { label: 'Electrician', sector: 'services' },
  { label: 'Full Stack Dev', sector: 'jobs' },
  { label: 'Vintage Watch', sector: 'marketplace' },
];

export default function LandingHeroSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [isDetecting, setIsDetecting] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetSection = selectedSector === 'all' ? 'marketplace' : selectedSector;
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (selectedCity && selectedCity !== 'All Cities') params.set('city', selectedCity);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    navigate(`/dashboard/${targetSection}${queryStr}`);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.info('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsDetecting(false);
        // Set to local neighborhood
        setSelectedCity('Near Me (Local Area)');
        toast.success('Location set to your current area!');
      },
      err => {
        setIsDetecting(false);
        setSelectedCity('New York, NY');
        toast.info('Defaulting to New York metro area.');
      },
      { timeout: 6000 }
    );
  };

  const handleTagClick = (tag: typeof TRENDING_TAGS[0]) => {
    navigate(`/dashboard/${tag.sector}?search=${encodeURIComponent(tag.label)}`);
  };

  return (
    <div className="w-full max-w-3xl mt-6">
      <form
        onSubmit={handleSearch}
        className="p-2 sm:p-2.5 rounded-2xl bg-white border border-[#E8E2D8] shadow-lg shadow-[#0F1923]/5 flex flex-col md:flex-row items-stretch gap-2"
      >
        {/* Keyword Search */}
        <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#FAFAF7] border border-[#E8E2D8]/60 focus-within:border-[#C9A96E] transition-colors">
          <Search size={18} className="text-[#C9A96E] shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search items, jobs, services, apartments..."
            className="w-full bg-transparent text-sm placeholder:text-[#9CA3AF] text-[#0F1923] focus:outline-none"
          />
        </div>

        {/* Sector Selector */}
        <div className="relative min-w-[140px] flex items-center px-3 py-2 rounded-xl bg-[#FAFAF7] border border-[#E8E2D8]/60 text-xs font-semibold text-[#0F1923]">
          <select
            value={selectedSector}
            onChange={e => setSelectedSector(e.target.value)}
            className="w-full bg-transparent appearance-none pr-5 text-xs font-semibold text-[#0F1923] focus:outline-none cursor-pointer"
          >
            <option value="all">All Sectors</option>
            {SECTORS.map(sec => (
              <option key={sec.id} value={sec.id}>
                {sec.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="text-[#6E7A8A] absolute right-3 pointer-events-none" />
        </div>

        {/* City Selector */}
        <div className="relative min-w-[150px] flex items-center px-3 py-2 rounded-xl bg-[#FAFAF7] border border-[#E8E2D8]/60 text-xs font-semibold text-[#0F1923]">
          <MapPin size={14} className="text-[#C9A96E] mr-1.5 shrink-0" />
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="w-full bg-transparent appearance-none pr-5 text-xs font-semibold text-[#0F1923] focus:outline-none cursor-pointer"
          >
            {POPULAR_CITIES.map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
            {selectedCity === 'Near Me (Local Area)' && (
              <option value="Near Me (Local Area)">Near Me (Local Area)</option>
            )}
          </select>
          <ChevronDown size={14} className="text-[#6E7A8A] absolute right-3 pointer-events-none" />
        </div>

        {/* Search Action Button */}
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-[#1A3353] hover:bg-[#142842] text-white text-xs font-bold tracking-wide transition-all shrink-0 flex items-center justify-center gap-2 shadow-sm"
        >
          <Search size={14} />
          <span>Search</span>
        </button>
      </form>

      {/* Trending pills + Location detect shortcut */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[#6E7A8A] font-semibold text-[11px] flex items-center gap-1">
            <Sparkles size={12} className="text-[#C9A96E]" /> Popular:
          </span>
          {TRENDING_TAGS.map(tag => (
            <button
              key={tag.label}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="px-2.5 py-1 rounded-full bg-white/80 hover:bg-white border border-[#E8E2D8] hover:border-[#C9A96E] text-[11px] font-medium text-[#4A5568] transition-colors"
            >
              {tag.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isDetecting}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1A3353] hover:text-[#C9A96E] transition-colors cursor-pointer"
        >
          <Navigation size={11} className={isDetecting ? 'animate-spin' : ''} />
          <span>{isDetecting ? 'Detecting...' : 'Use current city'}</span>
        </button>
      </div>

      {/* Live Community Proof Ticker */}
      <div className="mt-4 pt-3 border-t border-[#E8E2D8]/80 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-[#6E7A8A]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-[#0F1923]">65+ Active Community Members</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#C9A96E]">★</span>
          <span>Zero Commission P2P</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#C9A96E]">✓</span>
          <span>Instant Encrypted Chat</span>
        </div>
      </div>
    </div>
  );
}
