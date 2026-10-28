import React, { useState } from 'react';
import { Search, Plus, MapPin, Clock, DollarSign, Building, Bookmark, ArrowUpRight, MessageCircle, SlidersHorizontal, FileText } from 'lucide-react';
import { useChatContext } from '@/context/ChatContext';
import { cn } from '@/lib/utils';
import CreateListingModal from '@/components/shared/CreateListingModal';
import { useUserListings } from '@/context/UserListingsContext';
import { useNavigate } from 'react-router-dom';
import { useSaved } from '@/context/SavedContext';
import { listingDetailPath } from '@/lib/utils';
import ListingAuthor from '@/components/shared/ListingAuthor';
import { useAuth } from '@/context/AuthContext';
import { useGuestGate } from '@/context/GuestGateContext';
import { jobApplicationsAPI } from '@/services/apiService';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/i18n/LocalizationContext';

interface JobApplication {
  id: string;
  listingId: string;
  coverLetter: string;
  status: string;
  createdAt: string;
  applicant?: {
    name: string;
    email?: string;
    bio?: string;
    location?: string;
    profileImageUrl?: string;
  } | null;
}

const FILTERS = ['All', 'Remote', 'Full-time', 'Part-time', 'Contract', 'Internship'];



const TYPE_STYLE: Record<string,{ bg:string; text:string; border:string }> = {
  'Full-time': { bg:'#F0FDF4', text:'#15803D', border:'#BBF7D0' },
  'Contract':  { bg:'#F5F3FF', text:'#6D28D9', border:'#DDD6FE' },
  'Part-time': { bg:'#EFF6FF', text:'#1D4ED8', border:'#BFDBFE' },
  'Internship':{ bg:'#FFFBEB', text:'#B45309', border:'#FDE68A' },
};

export default function JobsSection() {
  const { t } = useLocalization();
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const { isSaved, toggleSaved } = useSaved();
  const { user } = useAuth();
  const { requireAuth } = useGuestGate();
  const { openChatWithListing, getUnreadForListing } = useChatContext();
  const [showModal, setShowModal] = useState(false);
  const { getListingsForSection, addListing } = useUserListings();
  const userListings = getListingsForSection('job');
  const navigate = useNavigate();
  const [applyingTo, setApplyingTo] = useState<any | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(() => new Set());
  const [viewingApplications, setViewingApplications] = useState<any | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  const allJobs = userListings;
  const filtered = allJobs.filter(j => {
    const match = activeFilter === 'All' || (activeFilter === 'Remote' && j.remote) || j.type === activeFilter;
    return match && (`${j.title ?? ''} ${j.company ?? ''}`).toLowerCase().includes(search.toLowerCase());
  });

  const handleNewListing = (data: any) => {
    const job = {
      id: `u_${Date.now()}`,
      ...data,
      desc: data.description,
      tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    };
    return addListing('job', job);
  };

  const startApplication = async (event: React.MouseEvent, job: any) => {
    event.stopPropagation();
    if (!requireAuth()) return;
    if (job.userId === user?.id) {
      toast.error('You cannot apply to your own job posting.');
      return;
    }
    try {
      const result = await jobApplicationsAPI.getMyApplication(job.id);
      if (result.application) {
        setAppliedJobIds(prev => new Set(prev).add(job.id));
        toast.info('You have already applied to this role.');
        return;
      }
      setCoverLetter('');
      setApplyingTo(job);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not check your application status');
    }
  };

  const submitApplication = async () => {
    if (!applyingTo || !requireAuth()) return;
    const message = coverLetter.trim();
    if (!message) {
      toast.error('Add a short cover letter before applying.');
      return;
    }
    setSubmittingApplication(true);
    try {
      await jobApplicationsAPI.submit(applyingTo.id, message);
      setAppliedJobIds(prev => new Set(prev).add(applyingTo.id));
      setApplyingTo(null);
      toast.success('Your application was sent to the job poster.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit application');
    } finally {
      setSubmittingApplication(false);
    }
  };

  const openApplications = async (event: React.MouseEvent, job: any) => {
    event.stopPropagation();
    setViewingApplications(job);
    setLoadingApplications(true);
    try {
      const result = await jobApplicationsAPI.getForListing(job.id);
      setApplications(result.applications ?? []);
    } catch (error) {
      setViewingApplications(null);
      toast.error(error instanceof Error ? error.message : 'Could not load applications');
    } finally {
      setLoadingApplications(false);
    }
  };

  return (
    <div className="section-padding space-y-6">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="gold-accent mb-3" />
          <h1 className="text-2xl font-bold" style={{ color:'#0F1923', letterSpacing:'-0.03em' }}>{t('Jobs')}</h1>
          <p className="text-sm mt-1" style={{ color:'#6E7A8A' }}>Opportunities posted by your community</p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ backgroundColor:'#1A3353', color:'#ffffff' }}
          onClick={() => setShowModal(true)}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#142842'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 14px rgba(26,51,83,0.25)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (e.currentTarget as HTMLElement).style.boxShadow=''; }}
        >
          <Plus size={15} strokeWidth={2.5} /> Post a Role
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color:'#6E7A8A' }} />
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search roles, companies…"
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

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={()=>setActiveFilter(f)} className={cn('chip', activeFilter===f ? 'chip-active' : 'chip-default')}>
            {f}
          </button>
        ))}
      </div>

      <p className="text-xs font-medium" style={{ color:'#6E7A8A' }}>{filtered.length} positions available</p>

      {/* Job list */}
      <div className="space-y-3">
        {filtered.map(job => {
          const typeStyle = TYPE_STYLE[job.type] ?? { bg:'#F5F2EC', text:'#6E7A8A', border:'#E8E2D8' };
          return (
            <div
              key={job.id}
              className="card-premium p-5 cursor-pointer group"
              style={{ transition:'all 0.2s' }}
              onClick={() => navigate(listingDetailPath('jobs', job.id, job), { state: { listing: job } })}
            >
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
                  style={{ backgroundColor:'#1A3353' }}
                >
                  {job.company?.trim()?.[0]?.toUpperCase() ?? '?'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm leading-tight mb-1" style={{ color:'#0F1923' }}>{job.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 text-sm font-medium" style={{ color:'#1A3353' }}>
                          <Building size={13} style={{ color:'#6E7A8A' }} />{job.company}
                        </span>
                        <span style={{ color:'#E8E2D8' }}>·</span>
                        <span className="flex items-center gap-1 text-xs" style={{ color:'#6E7A8A' }}>
                          <MapPin size={12} />{job.remote ? 'Remote' : job.location}
                        </span>
                        {(job.isSponsored || job.sponsored) && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Sponsored Ad
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <ListingAuthor listing={job} />
                      </div>
                    </div>
                    <button
                      onClick={e=>{e.stopPropagation(); toggleSaved('jobs', job);}}
                      className="shrink-0 p-1 rounded-lg transition-colors"
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor='#F5F2EC'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor=''}
                    >
                      <Bookmark
                        size={16}
                        style={{ color: isSaved('jobs', job.id) ? '#C9A96E' : '#6E7A8A' }}
                        className={isSaved('jobs', job.id) ? 'fill-[#C9A96E]' : ''}
                      />
                    </button>
                  </div>

                  <p className="text-xs leading-relaxed mt-2 line-clamp-2" style={{ color:'#6E7A8A' }}>{job.desc}</p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(job.tags ?? []).map((tag: string) => (
                      <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor:'#F5F2EC', color:'#1A3353', border:'1px solid #E8E2D8' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3.5" style={{ borderTop:'1px solid #E8E2D8' }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border" style={{ backgroundColor:typeStyle.bg, color:typeStyle.text, borderColor:typeStyle.border }}>
                    {job.type}
                  </span>
                  {job.salary && <span className="flex items-center gap-1 text-sm font-semibold" style={{ color:'#0F1923' }}>
                    <DollarSign size={13} style={{ color:'#C9A96E' }} />{job.salary}
                  </span>}
                  {job.createdAt && <span className="flex items-center gap-1 text-xs" style={{ color:'#6E7A8A' }}>
                    <Clock size={11} />{new Date(job.createdAt).toLocaleDateString()}
                  </span>}
                </div>
                <div className="flex items-center gap-2">
                  {job.userId === user?.id && (
                    <button
                      onClick={event => { void openApplications(event, job); }}
                      className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold"
                      style={{ borderColor: '#E8E2D8', color: '#1A3353', backgroundColor: '#fff' }}
                    >
                      <FileText size={13} /> Applications
                    </button>
                  )}
                  <div className="relative">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openChatWithListing({
                          listingId: job.id,
                          listingTitle: job.title,
                          listingPrice: job.salary,
                          listingImage: '',
                          listingCategory: 'Jobs',
                          sellerName: job.company,
                        });
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{ backgroundColor:'#F0EBE1', color:'#1A3353', border:'1px solid #E8D9BC' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (e.currentTarget as HTMLElement).style.color='#ffffff'; (e.currentTarget as HTMLElement).style.borderColor='#1A3353'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#F0EBE1'; (e.currentTarget as HTMLElement).style.color='#1A3353'; (e.currentTarget as HTMLElement).style.borderColor='#E8D9BC'; }}
                    >
                      <MessageCircle size={13} /> Chat
                    </button>
                    {getUnreadForListing(job.id, 'Jobs') > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white font-bold pointer-events-none" style={{ backgroundColor:'#E53E3E', fontSize:'9px', padding:'0 3px' }}>
                        {getUnreadForListing(job.id, 'Jobs')}
                      </span>
                    )}
                  </div>
                  <button
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: appliedJobIds.has(job.id) ? '#F0FDF4' : '#1A3353',
                      color: appliedJobIds.has(job.id) ? '#15803D' : '#ffffff',
                    }}
                    disabled={appliedJobIds.has(job.id) || job.userId === user?.id}
                    onClick={e => { void startApplication(e, job); }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#142842'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 12px rgba(26,51,83,0.25)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor='#1A3353'; (e.currentTarget as HTMLElement).style.boxShadow=''; }}
                  >
                    {appliedJobIds.has(job.id) ? 'Applied' : job.userId === user?.id ? 'Your role' : 'Apply'} <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="empty-state-icon"><Search size={26} style={{ color:'#6E7A8A' }} /></div>
          <h3 className="font-semibold mb-1" style={{ color:'#0F1923' }}>No roles found</h3>
          <p className="text-sm" style={{ color:'#6E7A8A' }}>Try a different filter or search term</p>
        </div>
      )}
      <CreateListingModal type="job" open={showModal} onClose={() => setShowModal(false)} onSubmit={handleNewListing} />

      <Dialog open={!!applyingTo} onOpenChange={open => { if (!open && !submittingApplication) setApplyingTo(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {applyingTo?.title}</DialogTitle>
            <DialogDescription>
              Your application will be shared with {applyingTo?.owner?.name ?? applyingTo?.company}. Use your real experience and contact details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Applying as {user?.name}</p>
            <Textarea
              value={coverLetter}
              onChange={event => setCoverLetter(event.target.value)}
              placeholder="Introduce yourself and explain why you're a good fit."
              maxLength={5000}
              rows={7}
            />
            <p className="text-right text-xs text-slate-500">{coverLetter.length}/5000</p>
            <Button className="w-full" disabled={submittingApplication || !coverLetter.trim()} onClick={() => { void submitApplication(); }}>
              {submittingApplication ? 'Sending application…' : 'Send application'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingApplications} onOpenChange={open => { if (!open) setViewingApplications(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applications: {viewingApplications?.title}</DialogTitle>
            <DialogDescription>Applicants chose to share this information with you for this role.</DialogDescription>
          </DialogHeader>
          {loadingApplications ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading applications…</p>
          ) : applications.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No applications yet.</p>
          ) : (
            <div className="space-y-4">
              {applications.map(application => (
                <article key={application.id} className="space-y-2 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    {application.applicant?.profileImageUrl
                      ? <img src={application.applicant.profileImageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                      : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-semibold">{application.applicant?.name?.[0] ?? '?'}</span>}
                    <div>
                      <p className="font-semibold">{application.applicant?.name ?? 'Account unavailable'}</p>
                      {application.applicant?.email && <a href={`mailto:${application.applicant.email}`} className="text-sm text-blue-700 underline">{application.applicant.email}</a>}
                    </div>
                    <span className="ml-auto text-xs capitalize text-slate-500">{application.status}</span>
                  </div>
                  {application.applicant?.location && <p className="text-sm text-slate-600">{application.applicant.location}</p>}
                  {application.applicant?.bio && <p className="text-sm text-slate-600">{application.applicant.bio}</p>}
                  <p className="whitespace-pre-wrap text-sm text-slate-800">{application.coverLetter}</p>
                  <p className="text-xs text-slate-500">Submitted {new Date(application.createdAt).toLocaleDateString()}</p>
                </article>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
