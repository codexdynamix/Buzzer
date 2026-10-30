import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ChevronLeft, ChevronRight, CheckCircle2, Send, Camera, Image } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGuestGate } from '@/context/GuestGateContext';
import { formatDistanceToNow } from 'date-fns';
import { storiesAPI } from '@/services/apiService';
import { toast } from 'sonner';

const STORY_DURATION = 6000;

interface StoryItem {
  id: string;
  image: string;
  caption: string;
  category?: string;
  timeAgo: string;
}

interface StoryRecord {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  media?: { type: 'image' | 'video'; url: string }[];
  content?: string;
  timestamp: string;
  viewers?: string[];
}

interface SellerStory {
  id: string;
  storyIds: string[];
  sellerName: string;
  sellerAvatar: string;
  verified?: boolean;
  seen: boolean;
  stories: StoryItem[];
}

function groupStoryRecords(records: StoryRecord[], viewerId?: string): SellerStory[] {
  const grouped = new Map<string, SellerStory>();
  for (const record of records) {
    const sellerStory = grouped.get(record.userId) ?? {
      id: record.userId,
      storyIds: [],
      sellerName: record.userName,
      sellerAvatar: record.userAvatar ?? '',
      seen: Boolean(viewerId && record.viewers?.includes(viewerId)),
      stories: [],
    };
    const createdAt = new Date(record.timestamp);
    const timeAgo = Number.isNaN(createdAt.getTime()) ? '' : formatDistanceToNow(createdAt);
    sellerStory.storyIds.push(record.id);
    sellerStory.seen = sellerStory.seen && Boolean(viewerId && record.viewers?.includes(viewerId));
    sellerStory.stories.push(...(record.media ?? []).map((item, index) => ({
      id: `${record.id}_${index}`,
      image: item.url,
      caption: record.content ?? '',
      timeAgo,
    })));
    grouped.set(record.userId, sellerStory);
  }
  return [...grouped.values()].filter(story => story.stories.length > 0);
}

function StoryViewer({
  stories, startIdx, onClose, onMarkSeen,
}: {
  stories: SellerStory[];
  startIdx: number;
  onClose: () => void;
  onMarkSeen: (sellerId: string) => void;
}) {
  const [sellerIdx, setSellerIdx] = useState(startIdx);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const seller = stories[sellerIdx];
  const story = seller?.stories[storyIdx];

  useEffect(() => {
    if (seller) onMarkSeen(seller.id);
  }, [sellerIdx]);

  const goNextStory = useCallback(() => {
    if (storyIdx < (seller?.stories.length ?? 1) - 1) {
      setStoryIdx(i => i + 1);
      setProgress(0);
    } else if (sellerIdx < stories.length - 1) {
      setSellerIdx(i => i + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIdx, sellerIdx, seller, stories.length, onClose]);

  const goPrevStory = useCallback(() => {
    if (storyIdx > 0) { setStoryIdx(i => i - 1); setProgress(0); }
    else if (sellerIdx > 0) { setSellerIdx(i => i - 1); setStoryIdx(0); setProgress(0); }
  }, [storyIdx, sellerIdx]);

  useEffect(() => {
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const tick = 100 / (STORY_DURATION / 50);
    intervalRef.current = setInterval(() => {
      if (!paused) {
        setProgress(p => {
          if (p >= 100) { goNextStory(); return 0; }
          return p + tick;
        });
      }
    }, 50);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [sellerIdx, storyIdx, paused]);

  const sendReply = () => {
    if (!replyText.trim()) return;
    setReplySent(true);
    setReplyText('');
    setTimeout(() => setReplySent(false), 2000);
  };

  if (!seller || !story) return null;

  const CATEGORY_COLORS: Record<string, string> = {
    Food: '#C2410C', Electronics: '#1D4ED8', Marketplace: '#C9A96E',
    'Real Estate': '#15803D', Transport: '#7C3AED', Services: '#BE185D',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
    >
      <div
        className="relative w-full max-w-sm h-full sm:max-h-[90vh] sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#0F1923' }}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; setPaused(true); }}
        onTouchEnd={e => {
          if (touchStartX.current === null) return;
          const dx = touchStartX.current - e.changedTouches[0].clientX;
          if (Math.abs(dx) > 60) { if (dx > 0) goNextStory(); else goPrevStory(); }
          setPaused(false);
          touchStartX.current = null;
        }}
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
      >
        {/* Background image */}
        <AnimatePresence mode="wait">
          <motion.img
            key={story.id}
            src={story.image}
            alt={story.caption}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.65)' }}
          />
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-32 z-10" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)' }} />
        <div className="absolute inset-x-0 bottom-0 h-48 z-10" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }} />

        {/* Progress bars */}
        <div className="absolute top-0 inset-x-0 z-20 flex gap-1 p-2 pt-3">
          {seller.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
                  backgroundColor: '#fff',
                  transition: i === storyIdx ? 'none' : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 inset-x-0 z-20 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <img src={seller.sellerAvatar} alt={seller.sellerName} className="h-9 w-9 rounded-full object-cover border-2 border-white" />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-white">{seller.sellerName}</span>
                {seller.verified && <CheckCircle2 size={12} style={{ color: '#C9A96E' }} />}
              </div>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{story.timeAgo} ago</span>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <X size={14} style={{ color: '#fff' }} />
          </button>
        </div>

        {/* Tap zones */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={goPrevStory} />
        <div className="absolute inset-y-0 right-0 w-2/3 z-10" onClick={goNextStory} />

        {/* Caption + Price */}
        <div className="absolute bottom-20 inset-x-0 z-20 px-4">
          {story.category && (
            <span
              className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
              style={{ backgroundColor: CATEGORY_COLORS[story.category] ?? '#C9A96E', color: '#fff' }}
            >
              {story.category}
            </span>
          )}
          <p className="text-sm font-medium text-white leading-snug mb-1">{story.caption}</p>
        </div>

        {/* Reply bar */}
        <div className="absolute bottom-4 inset-x-0 z-20 px-4">
          {replySent ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-full" style={{ backgroundColor: 'rgba(201,169,110,0.2)', border: '1px solid #C9A96E' }}>
              <span className="text-sm font-semibold" style={{ color: '#C9A96E' }}>✓ Reply sent!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendReply()}
                onClick={e => e.stopPropagation()}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                placeholder={`Reply to ${seller.sellerName}…`}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
              <button onClick={e => { e.stopPropagation(); sendReply(); }} className="shrink-0">
                <Send size={16} style={{ color: replyText.trim() ? '#C9A96E' : 'rgba(255,255,255,0.3)' }} />
              </button>
            </div>
          )}
        </div>

        {/* Seller nav arrows (desktop) */}
        {sellerIdx > 0 && (
          <button onClick={e => { e.stopPropagation(); setSellerIdx(i => i - 1); setStoryIdx(0); setProgress(0); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 hidden sm:flex h-9 w-9 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <ChevronLeft size={18} style={{ color: '#fff' }} />
          </button>
        )}
        {sellerIdx < stories.length - 1 && (
          <button onClick={e => { e.stopPropagation(); setSellerIdx(i => i + 1); setStoryIdx(0); setProgress(0); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 hidden sm:flex h-9 w-9 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <ChevronRight size={18} style={{ color: '#fff' }} />
          </button>
        )}
      </div>

      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </motion.div>
  );
}

/* ─── Create Story Modal ───────────────────────────────────────── */
function CreateStoryModal({ onClose, onPublish }: {
  onClose: () => void;
  onPublish: (story: SellerStory) => void;
}) {
  const { user } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Story photos must be 5 MB or smaller');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const publish = () => {
    if (!photo) return;
    const newStory: SellerStory = {
      id: `my_${Date.now()}`,
      storyIds: [],
      sellerName: user?.name ?? '',
      sellerAvatar: user?.profileImageUrl ?? '',
      seen: false,
      stories: [{
        id: `ms_${Date.now()}`,
        image: photo,
        caption: caption.trim(),
        timeAgo: 'now',
      }],
    };
    onPublish(newStory);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ backgroundColor: '#fff', border: '1px solid #E8E2D8' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #F0EBE1' }}>
          <p className="font-bold text-base" style={{ color: '#0F1923' }}>Add to Your Story</p>
          <button onClick={onClose} className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F5F2EC' }}>
            <X size={13} style={{ color: '#6E7A8A' }} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Photo picker */}
          {photo ? (
            <div className="relative rounded-2xl overflow-hidden mx-auto" style={{ height: 200, maxWidth: 160 }}>
              <img src={photo} alt="story preview" className="w-full h-full object-cover" />
              <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <X size={11} style={{ color: '#fff' }} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 py-8 rounded-2xl cursor-pointer" style={{ border: '2px dashed #E8D9BC', backgroundColor: '#FFFDF8' }}>
              <div className="flex gap-3">
                <Camera size={24} style={{ color: '#C9A96E' }} />
                <Image size={24} style={{ color: '#C9A96E' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#C9A96E' }}>Upload a photo</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          )}

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6E7A8A' }}>Caption</label>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Tell buyers what you're showing…"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: '#F9F7F4', border: '1px solid #E8E2D8', color: '#0F1923' }}
            />
          </div>

          <button
            onClick={publish}
            disabled={!photo}
            className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
            style={{ backgroundColor: photo ? '#1A3353' : '#F5F2EC', color: photo ? '#fff' : '#6E7A8A' }}
          >
            Share Story
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Stories Strip ────────────────────────────────────────────── */
export default function StoriesStrip() {
  const { user, isAuthenticated } = useAuth();
  const { requireAuth } = useGuestGate();
  const [stories, setStories] = useState<SellerStory[]>([]);
  const [viewingIdx, setViewingIdx] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const refreshStories = useCallback(async () => {
    if (!isAuthenticated) return;
    const { stories: records } = await storiesAPI.getStories();
    setStories(groupStoryRecords(records ?? [], user?.id));
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setStories([]);
      return;
    }
    let cancelled = false;
    storiesAPI.getStories()
      .then(({ stories: records }) => {
        if (!cancelled) setStories(groupStoryRecords(records ?? [], user?.id));
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'Could not load stories');
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  const markSeen = useCallback((sellerId: string) => {
    const story = stories.find(item => item.id === sellerId);
    if (!story || story.seen) return;
    setStories(prev => prev.map(item => item.id === sellerId ? { ...item, seen: true } : item));
    Promise.all(story.storyIds.map(id => storiesAPI.markViewed(id)))
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not update story view'));
  }, [stories]);

  const addMyStory = async (story: SellerStory) => {
    try {
      await storiesAPI.createStory(
        story.stories.map(item => ({ type: 'image' as const, url: item.image })),
        story.stories[0]?.caption ?? '',
      );
      await refreshStories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not publish story');
    }
  };

  const unseenFirst = [...stories].sort((a, b) => (a.seen === b.seen ? 0 : a.seen ? 1 : -1));

  const userInitials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'ME';

  return (
    <>
      <div className="flex items-center gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* My Story bubble */}
        <button
          onClick={() => requireAuth(() => setShowCreate(true))}
          className="flex flex-col items-center gap-1.5 shrink-0 group"
        >
          <div className="relative">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all group-hover:scale-105"
              style={{ borderColor: '#E8E2D8', backgroundColor: '#F5F2EC' }}
            >
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="me" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold" style={{ color: '#6E7A8A' }}>{userInitials}</span>
              )}
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full flex items-center justify-center border-2 border-white"
              style={{ backgroundColor: '#C9A96E' }}
            >
              <Plus size={10} style={{ color: '#fff' }} strokeWidth={3} />
            </div>
          </div>
          <span className="text-[10px] font-medium w-14 text-center truncate" style={{ color: '#6E7A8A' }}>
            Your Story
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-10 shrink-0" style={{ backgroundColor: '#E8E2D8' }} />

        {/* Seller stories */}
        {unseenFirst.map((seller, i) => (
          <button
            key={seller.id}
            onClick={() => setViewingIdx(unseenFirst.indexOf(seller))}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div
              className="h-14 w-14 rounded-full overflow-hidden transition-all group-hover:scale-105"
              style={{
                padding: seller.seen ? 2 : 2,
                background: seller.seen
                  ? '#E8E2D8'
                  : 'linear-gradient(135deg, #C9A96E 0%, #E8B94A 50%, #C9A96E 100%)',
              }}
            >
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                {seller.sellerAvatar ? (
                  <img src={seller.sellerAvatar} alt={seller.sellerName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F5F2EC' }}>
                    <span className="text-sm font-bold" style={{ color: '#C9A96E' }}>{seller.sellerName[0]}</span>
                  </div>
                )}
              </div>
            </div>
            <span
              className="text-[10px] w-14 text-center truncate"
              style={{ color: seller.seen ? '#9CA3AF' : '#0F1923', fontWeight: seller.seen ? 400 : 600 }}
            >
              {seller.sellerName.split(' ')[0]}
            </span>
          </button>
        ))}
        {unseenFirst.length === 0 && (
          <p className="text-xs py-2" style={{ color: '#6E7A8A' }}>
            {isAuthenticated ? 'No community stories yet.' : 'Sign in to view community stories.'}
          </p>
        )}
      </div>

      {/* Story viewer */}
      <AnimatePresence>
        {viewingIdx !== null && (
          <StoryViewer
            stories={unseenFirst}
            startIdx={viewingIdx}
            onClose={() => setViewingIdx(null)}
            onMarkSeen={markSeen}
          />
        )}
      </AnimatePresence>

      {/* Create story modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateStoryModal
            onClose={() => setShowCreate(false)}
            onPublish={story => { void addMyStory(story); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
