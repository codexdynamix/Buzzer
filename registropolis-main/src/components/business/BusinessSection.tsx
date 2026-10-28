import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Globe, 
  ChevronRight, 
  Loader2, 
  Plus, 
  Sparkles, 
  Megaphone, 
  Building2, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  MessageCircle,
  Tag
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import RatingDisplay from '../common/RatingDisplay';
import SaveButton from '../common/SaveButton';
import VerificationBadge from '../common/VerificationBadge';
import FilterPanel from '../common/FilterPanel';
import { businessesAPI } from '@/services/apiService';
import { useAuth } from '@/context/AuthContext';
import { useChatContext } from '@/context/ChatContext';

export interface BusinessItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  location: string;
  distance?: string;
  image: string;
  description: string;
  phone?: string;
  email?: string;
  website?: string;
  hours?: string;
  verified?: boolean;
  isSponsored?: boolean;
  adHeadline?: string;
  adTag?: string;
  ownerId?: string;
  ownerName?: string;
  createdAt?: string;
}

const CATEGORIES = [
  "All Categories",
  "Restaurants",
  "Technology",
  "Home & Garden",
  "Health & Fitness",
  "Professional Services",
  "Retail",
  "Entertainment"
];

const PRESET_IMAGES = [
  { label: 'Restaurant / Cafe', url: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=600&auto=format&fit=crop' },
  { label: 'Tech Company', url: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=600&auto=format&fit=crop' },
  { label: 'Fitness & Gym', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop' },
  { label: 'Architecture & Office', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop' },
  { label: 'Landscaping & Flora', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=600&auto=format&fit=crop' },
  { label: 'Logistics & Fleet', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop' },
];

const BusinessSection: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { openChatWithUser } = useChatContext();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [activeTab, setActiveTab] = useState<'all' | 'ads'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  
  // Create / Advertise Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizCategory, setNewBizCategory] = useState('Technology');
  const [newBizDesc, setNewBizDesc] = useState('');
  const [newBizLocation, setNewBizLocation] = useState(user?.location || 'Downtown Center');
  const [newBizPhone, setNewBizPhone] = useState(user?.contactPhone || '+1 (555) 010-0000');
  const [newBizEmail, setNewBizEmail] = useState(user?.email || '');
  const [newBizWebsite, setNewBizWebsite] = useState('https://');
  const [newBizHours, setNewBizHours] = useState('Mon-Fri: 9AM-6PM');
  const [newBizImage, setNewBizImage] = useState(PRESET_IMAGES[0].url);
  const [newBizIsSponsored, setNewBizIsSponsored] = useState(true);
  const [newBizAdHeadline, setNewBizAdHeadline] = useState('Featured Community Partner • Special Offer for Buzzer Members');

  // Fetch from Database API
  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    try {
      const typeParam = selectedCategory !== 'All Categories' ? selectedCategory : undefined;
      const res = await businessesAPI.getBusinesses(typeParam);
      const list = res.businesses || res.data || [];
      setBusinesses(list);
    } catch (err: any) {
      console.error('Failed to load businesses from API:', err);
      toast.error('Could not load businesses from the database');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const filterOptions = [
    {
      id: 'distance',
      label: 'Distance',
      type: 'range' as const,
      min: 0,
      max: 10,
      step: 0.5
    },
    {
      id: 'rating',
      label: 'Minimum Rating',
      type: 'select' as const,
      options: [
        { value: '3', label: '3+ Stars' },
        { value: '3.5', label: '3.5+ Stars' },
        { value: '4', label: '4+ Stars' },
        { value: '4.5', label: '4.5+ Stars' }
      ]
    },
    {
      id: 'verified',
      label: 'Verified Businesses Only',
      type: 'checkbox' as const,
      options: [{ value: 'true', label: 'Show verified businesses only' }]
    }
  ];

  const handleFilterChange = (filters: Record<string, any>) => {
    if (filters.category) {
      setSelectedCategory(filters.category);
    }
    setAppliedFilters(filters);
  };

  const handleToggleSponsorship = async (bizId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to manage advertisement sponsorships');
      return;
    }
    try {
      const res = await businessesAPI.toggleSponsor(bizId);
      toast.success(res.message || 'Sponsorship status updated');
      fetchBusinesses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update sponsorship');
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to publish a business listing or advertisement');
      return;
    }
    if (!newBizName.trim() || !newBizDesc.trim()) {
      toast.error('Please enter a business name and description');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: newBizName.trim(),
        category: newBizCategory,
        description: newBizDesc.trim(),
        location: newBizLocation.trim(),
        phone: newBizPhone.trim(),
        email: newBizEmail.trim(),
        website: newBizWebsite.trim(),
        hours: newBizHours.trim(),
        image: newBizImage,
        isSponsored: newBizIsSponsored,
        adHeadline: newBizIsSponsored ? newBizAdHeadline.trim() : undefined,
        adTag: newBizIsSponsored ? 'Sponsored Partner' : undefined,
      };

      const res = await businessesAPI.createBusiness(payload);
      toast.success('Business and advertisement registered successfully in the database!');
      setIsCreateOpen(false);
      
      // Reset fields
      setNewBizName('');
      setNewBizDesc('');
      
      // Refresh database listings
      fetchBusinesses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create business listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter businesses in memory after fetching from DB
  const filteredBusinesses = businesses.filter(biz => {
    // Tab filter: all vs sponsored ads only
    if (activeTab === 'ads' && !biz.isSponsored) return false;

    // Search query
    const matchesQuery = 
      biz.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      biz.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (biz.adHeadline && biz.adHeadline.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Category filter
    const matchesCategory = selectedCategory === 'All Categories' || biz.category === selectedCategory;
    
    // Distance filter
    const matchesDistance = !appliedFilters.distance || 
      (parseFloat(biz.distance || '1') <= appliedFilters.distance[1]);
    
    // Rating filter
    const matchesRating = !appliedFilters.rating || 
      biz.rating >= parseFloat(appliedFilters.rating);
    
    // Verification filter
    const matchesVerification = !appliedFilters.verified || biz.verified;
    
    return matchesQuery && matchesCategory && matchesDistance && matchesRating && matchesVerification;
  });

  const sponsoredAdsCount = businesses.filter(b => b.isSponsored).length;

  return (
    <div className="section-padding space-y-8 max-w-7xl mx-auto">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="gold-accent mb-3" />
          <h1 className="text-3xl font-bold tracking-tight text-[#0F1923]">
            Business & Advertising Directory
          </h1>
          <p className="text-sm mt-1 text-[#6E7A8A]">
            Discover verified local enterprises, services, and official sponsored partner advertisements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => navigate('/admin?tab=merchants')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold border-[#C9A96E]/50 text-[#1A3353] bg-amber-50/50 hover:bg-amber-100/70 transition-all shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>Merchant Extranet</span>
          </Button>

          {/* Post Business / Advertisement Modal */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all"
                style={{ backgroundColor: '#1A3353', color: '#ffffff' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'; }}
              >
                <Megaphone className="h-4 w-4" />
                <span>Post Advertisement</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#0F1923]">
                <Megaphone className="h-5 w-5 text-[#C9A96E]" />
                Register Business & Community Advertisement
              </DialogTitle>
              <DialogDescription className="text-sm text-[#6E7A8A]">
                Post your organization to the persistent database. Optionally activate sponsored ad placement for homepage and category spotlights.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateBusiness} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-[#0F1923] block mb-1">Company / Organization Name *</label>
                <Input 
                  value={newBizName} 
                  onChange={e => setNewBizName(e.target.value)} 
                  placeholder="e.g. Skyline Robotics Lab" 
                  required 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0F1923] block mb-1">Industry / Category *</label>
                  <select
                    value={newBizCategory}
                    onChange={e => setNewBizCategory(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-md border border-[#E8E2D8] bg-white text-[#0F1923] focus:outline-none focus:ring-2 focus:ring-[#1A3353]"
                  >
                    {CATEGORIES.filter(c => c !== 'All Categories').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0F1923] block mb-1">District / Location</label>
                  <Input 
                    value={newBizLocation} 
                    onChange={e => setNewBizLocation(e.target.value)} 
                    placeholder="e.g. Innovation Park, Tower A" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F1923] block mb-1">Description & Value Proposition *</label>
                <Textarea 
                  value={newBizDesc} 
                  onChange={e => setNewBizDesc(e.target.value)} 
                  placeholder="Describe your products, specialized services, and what sets you apart..." 
                  rows={3} 
                  required 
                />
              </div>

              {/* Advertisement / Sponsorship Options */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-950">Promote as Sponsored Advertisement</span>
                  </div>
                  <input 
                    type="checkbox" 
                    id="isSponsored"
                    checked={newBizIsSponsored}
                    onChange={e => setNewBizIsSponsored(e.target.checked)}
                    className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-gray-300"
                  />
                </div>

                {newBizIsSponsored && (
                  <div>
                    <label className="text-xs font-semibold text-amber-900 block mb-1">Promotional Headline / Special Offer</label>
                    <Input 
                      value={newBizAdHeadline}
                      onChange={e => setNewBizAdHeadline(e.target.value)}
                      placeholder="e.g. 20% Off First Consultation for Buzzer Members"
                      className="bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0F1923] block mb-1">Contact Phone</label>
                  <Input 
                    value={newBizPhone} 
                    onChange={e => setNewBizPhone(e.target.value)} 
                    placeholder="+1 (555) 123-4567" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F1923] block mb-1">Email</label>
                  <Input 
                    type="email"
                    value={newBizEmail} 
                    onChange={e => setNewBizEmail(e.target.value)} 
                    placeholder="contact@business.com" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0F1923] block mb-1">Website URL</label>
                  <Input 
                    value={newBizWebsite} 
                    onChange={e => setNewBizWebsite(e.target.value)} 
                    placeholder="https://yourcompany.com" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F1923] block mb-1">Hours of Operation</label>
                  <Input 
                    value={newBizHours} 
                    onChange={e => setNewBizHours(e.target.value)} 
                    placeholder="Mon-Fri: 9AM-6PM" 
                  />
                </div>
              </div>

              {/* Photo presets */}
              <div>
                <label className="text-xs font-semibold text-[#0F1923] block mb-1">Visual Banner</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {PRESET_IMAGES.slice(0, 3).map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setNewBizImage(preset.url)}
                      className={`text-left rounded-lg p-1.5 border text-xs transition-all ${
                        newBizImage === preset.url ? 'border-[#1A3353] bg-[#F5F0E8] font-semibold' : 'border-[#E8E2D8]'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-12 object-cover rounded mb-1" />
                      <span className="truncate block">{preset.label}</span>
                    </button>
                  ))}
                </div>
                <Input 
                  value={newBizImage} 
                  onChange={e => setNewBizImage(e.target.value)} 
                  placeholder="Or paste custom image URL..." 
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ backgroundColor: '#1A3353', color: '#fff' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving to Database...
                    </>
                  ) : (
                    'Publish Advertisement'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* ── Search & Filter Bar ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#6E7A8A] h-4 w-4" />
          <Input
            placeholder="Search verified businesses, sponsored ads, keywords..."
            className="pl-10 h-11 bg-white border-[#E8E2D8] text-sm focus:ring-[#1A3353]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <FilterPanel 
          categories={CATEGORIES}
          filters={filterOptions}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* ── Tabs: All Businesses vs Sponsored Ads ─────────────── */}
      <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-[#1A3353] text-white shadow-sm'
                : 'bg-white text-[#6E7A8A] border border-[#E8E2D8] hover:text-[#0F1923]'
            }`}
          >
            All Listings ({businesses.length})
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'ads'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sponsored Ads ({sponsoredAdsCount})</span>
          </button>
        </div>

        <span className="text-xs text-[#6E7A8A] hidden sm:inline">
          Connected to Buzzer Database
        </span>
      </div>

      {/* ── Business & Ad Cards Grid ──────────────────────────── */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#1A3353]" />
          <p className="text-sm text-[#6E7A8A]">Querying database for local businesses and ads...</p>
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBusinesses.map((biz) => {
            const isOwner = user?.id === biz.ownerId;
            const isAdmin = user?.role === 'admin';

            return (
              <Card 
                key={biz.id} 
                className={`overflow-hidden transition-all duration-200 hover:shadow-md border ${
                  biz.isSponsored 
                    ? 'border-amber-200 bg-gradient-to-b from-amber-50/20 to-white' 
                    : 'border-[#E8E2D8] bg-white'
                }`}
              >
                {/* Ad Banner Headline (if sponsored) */}
                {biz.isSponsored && biz.adHeadline && (
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                      {biz.adHeadline}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded font-bold">
                      {biz.adTag || 'Sponsored Ad'}
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row">
                  {/* Business Image */}
                  <div className="sm:w-2/5 h-48 sm:h-auto relative bg-[#F5F0E8] overflow-hidden">
                    <img 
                      src={biz.image} 
                      alt={biz.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2">
                      <SaveButton 
                        itemId={biz.id} 
                        itemType="service"
                      />
                    </div>
                    {biz.isSponsored && (
                      <div className="absolute bottom-2 left-2 bg-[#0F1923]/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                        AD
                      </div>
                    )}
                  </div>

                  {/* Business Details */}
                  <div className="sm:w-3/5 flex flex-col justify-between p-5 space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg font-bold text-[#0F1923] flex items-center gap-1.5 leading-snug">
                            {biz.name}
                            {biz.verified && (
                              <VerificationBadge isVerified={biz.verified} />
                            )}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="bg-[#F5F2EC] text-[#1A3353] border border-[#E8E2D8] text-xs px-2.5 py-0.5 rounded-full font-medium">
                              {biz.category}
                            </span>
                            <RatingDisplay rating={biz.rating} reviews={biz.reviews} />
                          </div>
                        </div>
                        {biz.distance && (
                          <div className="text-xs text-[#6E7A8A] flex items-center shrink-0">
                            <MapPin className="h-3.5 w-3.5 mr-0.5 text-[#C9A96E]" />
                            {biz.distance}
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-[#6E7A8A] line-clamp-2 mt-2 leading-relaxed">
                        {biz.description}
                      </p>

                      <div className="mt-3 space-y-1 text-xs text-[#4A5568]">
                        {biz.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#6E7A8A] shrink-0" />
                            <span className="truncate">{biz.location}</span>
                          </div>
                        )}
                        {biz.hours && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[#6E7A8A] shrink-0" />
                            <span className="truncate">{biz.hours}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {biz.website && (
                          <a 
                            href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-[#E8E2D8] text-[#6E7A8A] hover:text-[#1A3353] hover:bg-[#F5F0E8] transition-colors"
                            title="Visit Official Website"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                        {biz.phone && (
                          <a 
                            href={`tel:${biz.phone}`}
                            className="p-1.5 rounded-lg border border-[#E8E2D8] text-[#6E7A8A] hover:text-[#1A3353] hover:bg-[#F5F0E8] transition-colors"
                            title="Call Business"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                        {biz.email && (
                          <a 
                            href={`mailto:${biz.email}`}
                            className="p-1.5 rounded-lg border border-[#E8E2D8] text-[#6E7A8A] hover:text-[#1A3353] hover:bg-[#F5F0E8] transition-colors"
                            title="Email Business"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {(isOwner || isAdmin) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs h-8 text-amber-700 hover:bg-amber-50"
                            onClick={() => handleToggleSponsorship(biz.id)}
                            title="Toggle Sponsored Advertisement Status"
                          >
                            <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" />
                            {biz.isSponsored ? 'Unsponsor' : 'Promote'}
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          className="h-8 text-xs font-semibold rounded-lg"
                          style={{ backgroundColor: '#1A3353', color: '#fff' }}
                          onClick={() => {
                            if (biz.ownerId) {
                              openChatWithUser(biz.ownerId, biz.ownerName || biz.name);
                            } else {
                              toast.info(`Contacting ${biz.name} via ${biz.email || biz.phone || 'direct inquiry'}`);
                            }
                          }}
                        >
                          <MessageCircle className="h-3.5 w-3.5 mr-1" />
                          Inquire
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E8E2D8] p-8 space-y-3">
          <Building2 className="h-12 w-12 text-[#6E7A8A] mx-auto opacity-40" />
          <p className="text-base font-semibold text-[#0F1923]">No businesses or advertisements found</p>
          <p className="text-xs text-[#6E7A8A] max-w-md mx-auto">
            Try adjusting your search query, selecting "All Categories", or be the first to publish a business advertisement to the community!
          </p>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            size="sm" 
            className="mt-2 text-xs"
            style={{ backgroundColor: '#1A3353', color: '#fff' }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Post First Advertisement
          </Button>
        </div>
      )}
    </div>
  );
};

export default BusinessSection;
