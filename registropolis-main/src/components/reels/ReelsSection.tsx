import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Play, Pause,
  ChevronUp, ChevronDown, ShoppingBag, MapPin, CheckCircle2, X, Send,
  Plus, Camera, Upload, Music, Link, Image, Trash2, ChevronRight,
  Eye, MoreHorizontal, Copy,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChatContext } from '@/context/ChatContext';
import { useGuestGate } from '@/context/GuestGateContext';
import { useAuth } from '@/context/AuthContext';
import { reelsAPI } from '@/services/apiService';
import type { CreateReelPayload, ReelComment, ReelRecord, UploadedReelMedia } from '@/types/reelTypes';
import { toast } from 'sonner';

const REEL_DURATION = 30;

/* ─── Types ───────────────────────────────────────────────────── */
type Comment = ReelComment;
type Reel = ReelRecord;

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  emoji: string;
  url: string;
  color: string;
}

/* ─── Mock Data ────────────────────────────────────────────────── */
const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'm1', name: 'Beats in the Sky', artist: 'Mixkit', emoji: '🎵', url: 'https://assets.mixkit.co/music/preview/mixkit-beats-in-the-sky-134.mp3', color: '#7C3AED' },
  { id: 'm2', name: 'Cool Business', artist: 'Mixkit', emoji: '💼', url: 'https://assets.mixkit.co/music/preview/mixkit-cool-business-181.mp3', color: '#1A3353' },
  { id: 'm3', name: 'Summer Fun', artist: 'Mixkit', emoji: '🌊', url: 'https://assets.mixkit.co/music/preview/mixkit-summer-fun-13.mp3', color: '#0891B2' },
  { id: 'm4', name: 'Hip Hop Vibes', artist: 'Mixkit', emoji: '🎤', url: 'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3', color: '#B45309' },
  { id: 'm5', name: 'Beautiful Dream', artist: 'Mixkit', emoji: '✨', url: 'https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-493.mp3', color: '#BE185D' },
  { id: 'm6', name: 'Tech House', artist: 'Mixkit', emoji: '🔊', url: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3', color: '#065F46' },
];

const REEL_CATEGORY_OPTIONS = ['Marketplace', 'Food', 'Real Estate', 'Electronics', 'Services'];

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatTimeAgo(createdAt: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* ─── Animated Reel (Photo Slideshow) ─────────────────────────── */
function AnimatedReel({ photos, isActive }: { photos: string[]; isActive: boolean }) {
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    if (!isActive) { setPhotoIdx(0); return; }
    const t = setInterval(() => setPhotoIdx(i => (i + 1) % photos.length), 3000);
    return () => clearInterval(t);
  }, [isActive, photos.length]);

  const transforms = [
    'scale(1.12) translate(-3%, -2%)',
    'scale(1.08) translate(3%, 2%)',
    'scale(1.15) translate(0%, -4%)',
    'scale(1.1) translate(-2%, 3%)',
  ];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {photos.map((src, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            opacity: i === photoIdx ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
          }}
        >
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover"
            style={{
              filter: 'brightness(0.72)',
              transform: i === photoIdx ? transforms[i % transforms.length] : 'scale(1)',
              transition: 'transform 3.5s ease-in-out, opacity 0.8s ease-in-out',
            }}
          />
        </div>
      ))}
      {/* Photo count indicator */}
      <div className="absolute top-1/2 right-3 -translate-y-1/2 z-10 flex flex-col gap-1">
        {photos.map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full transition-all"
            style={{ height: i === photoIdx ? 20 : 6, backgroundColor: i === photoIdx ? '#C9A96E' : 'rgba(255,255,255,0.3)' }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Comments Panel ───────────────────────────────────────────── */
function CommentsPanel({
  reelId,
  comments,
  onClose,
  onAddComment,
  onToggleLikeComment,
}: {
  reelId: string;
  comments: Comment[];
  onClose: () => void;
  onAddComment: (reelId: string, text: string) => Promise<boolean>;
  onToggleLikeComment: (reelId: string, commentId: string) => void;
}) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 400); }, []);

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    if (await onAddComment(reelId, t)) setText('');
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="absolute inset-x-0 bottom-0 z-40 flex flex-col rounded-t-3xl overflow-hidden"
      style={{ height: '65%', background: 'rgba(13,19,27,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      {/* Handle + header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-10 h-1 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
        <span className="font-bold text-sm" style={{ color: '#fff' }}>Comments · {comments.length}</span>
        <button onClick={onClose} className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
          <X size={13} />
        </button>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {comments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
            <MessageCircle size={28} style={{ color: '#6E7A8A' }} />
            <p className="text-xs" style={{ color: '#6E7A8A' }}>No comments yet — be the first!</p>
          </div>
        )}
        {comments.map(c => (
          <div key={c.id} className="flex items-start gap-3">
            <img src={c.avatar} alt={c.user} className="h-8 w-8 rounded-full object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold" style={{ color: '#fff' }}>{c.user}</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{formatTimeAgo(c.createdAt)}</span>
              </div>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{c.text}</p>
            </div>
            <button
              onClick={() => onToggleLikeComment(reelId, c.id)}
              className="flex flex-col items-center gap-0.5 shrink-0"
            >
              <Heart size={13} fill={c.likedByMe ? '#EF4444' : 'none'} style={{ color: c.likedByMe ? '#EF4444' : 'rgba(255,255,255,0.4)' }} />
              {c.likes > 0 && <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.likes}</span>}
            </button>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'linear-gradient(135deg,#C9A96E,#a8834e)', color: '#0F1923' }}>
          Me
        </div>
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Add a comment…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: '#fff' }}
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="h-8 w-8 rounded-full flex items-center justify-center transition-all"
          style={{ backgroundColor: text.trim() ? '#C9A96E' : 'rgba(255,255,255,0.1)', color: text.trim() ? '#0F1923' : 'rgba(255,255,255,0.3)' }}
        >
          <Send size={13} />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Share Sheet ──────────────────────────────────────────────── */
function ShareSheet({ reel, onClose }: { reel: Reel; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/dashboard/reels?reel=${encodeURIComponent(reel.id)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => { setCopied(false); onClose(); }, 1400);
  };

  const shareOptions = [
    { label: 'WhatsApp', emoji: '💬', color: '#25D366', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this deal on Buzzer: ${reel.productTitle} for $${reel.price} — ${link}`)}`, '_blank') },
    { label: 'Copy Link', emoji: copied ? '✅' : '🔗', color: '#C9A96E', action: copyLink },
    { label: 'Instagram', emoji: '📸', color: '#E1306C', action: () => navigator.clipboard.writeText(link) },
    { label: 'Facebook', emoji: '👍', color: '#1877F2', action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank') },
    { label: 'Twitter/X', emoji: '🐦', color: '#1DA1F2', action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${reel.productTitle} on Buzzer — $${reel.price}`)}&url=${encodeURIComponent(link)}`, '_blank') },
    { label: 'More', emoji: '⋯', color: '#6E7A8A', action: () => { if (navigator.share) navigator.share({ title: reel.productTitle, url: link }); } },
  ];

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="absolute inset-x-0 bottom-0 z-40 rounded-t-3xl overflow-hidden"
      style={{ background: 'rgba(13,19,27,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
      <div className="px-5 pb-2">
        <p className="font-bold text-sm mb-1" style={{ color: '#fff' }}>Share Reel</p>
        <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{reel.productTitle}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 px-5 py-4">
        {shareOptions.map(opt => (
          <button
            key={opt.label}
            onClick={opt.action}
            className="flex flex-col items-center gap-2 py-3 rounded-2xl transition-all active:scale-95"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>{opt.label}</span>
          </button>
        ))}
      </div>
      {/* Link preview */}
      <div className="mx-5 mb-5 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Link size={12} style={{ color: '#C9A96E', flexShrink: 0 }} />
        <span className="text-[10px] flex-1 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{link}</span>
        <button onClick={copyLink} className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all" style={{ backgroundColor: copied ? '#C9A96E' : 'rgba(201,169,110,0.2)', color: copied ? '#0F1923' : '#C9A96E' }}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <button onClick={onClose} className="w-full py-4 text-sm font-semibold transition-colors" style={{ color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        Cancel
      </button>
    </motion.div>
  );
}

/* ─── Create Reel Modal ────────────────────────────────────────── */
function CreateReelModal({
  onClose,
  onPublish,
}: {
  onClose: () => void;
  onPublish: (payload: CreateReelPayload, files: File[]) => Promise<void>;
}) {
  const [step, setStep] = useState<'type' | 'media' | 'music' | 'details' | 'preview'>('type');
  const [mediaType, setMediaType] = useState<'upload' | 'animation' | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState('Marketplace');
  const [description, setDescription] = useState('');
  const [animPhotoIdx, setAnimPhotoIdx] = useState(0);
  const previewUrls = useRef(new Set<string>());

  useEffect(() => {
    if (uploadedPhotos.length < 2) return;
    const t = setInterval(() => setAnimPhotoIdx(i => (i + 1) % uploadedPhotos.length), 2500);
    return () => clearInterval(t);
  }, [uploadedPhotos.length]);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    return () => { audioRef.current?.pause(); };
  }, []);

  useEffect(() => () => {
    previewUrls.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  const previewUrlFor = (file: File) => {
    const url = URL.createObjectURL(file);
    previewUrls.current.add(url);
    return url;
  };

  const removePreviewUrl = (url: string) => {
    URL.revokeObjectURL(url);
    previewUrls.current.delete(url);
  };

  const clearMedia = () => {
    uploadedPhotos.forEach(removePreviewUrl);
    setUploadedPhotos([]);
    setUploadedFiles([]);
  };

  const previewTrack = (track: MusicTrack) => {
    if (!audioRef.current) return;
    if (previewAudio === track.id) {
      audioRef.current.pause();
      setPreviewAudio(null);
      return;
    }
    audioRef.current.src = track.url;
    audioRef.current.volume = 0.4;
    audioRef.current.play().catch(() => {});
    setPreviewAudio(track.id);
  };

  const selectTrack = (track: MusicTrack) => {
    setSelectedMusic(track);
    audioRef.current?.pause();
    setPreviewAudio(null);
  };

  const addPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = Math.max(0, 5 - uploadedFiles.length);
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const validFiles = files.filter(file => {
      if (!allowedTypes.has(file.type) || file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: choose a JPEG, PNG, or WebP image up to 10MB`);
        return false;
      }
      return true;
    }).slice(0, remaining);
    if (files.length > remaining) toast.error('A reel can contain at most 5 photos');
    setUploadedFiles(prev => [...prev, ...validFiles]);
    setUploadedPhotos(prev => [...prev, ...validFiles.map(previewUrlFor)]);
    e.target.value = '';
  };

  const publish = async () => {
    if (isPublishing) return;
    if (!title.trim() || !price || Number(price) <= 0) {
      toast.error('Enter a title and a valid price before publishing');
      return;
    }
    if (!mediaType || uploadedFiles.length === 0) {
      toast.error('Select your reel media before publishing');
      return;
    }
    if (mediaType === 'animation' && (uploadedFiles.length < 2 || uploadedFiles.length > 5)) {
      toast.error('Choose 2 to 5 photos for an animated reel');
      return;
    }
    const payload: CreateReelPayload = {
      productTitle: title,
      price: Number(price),
      ...(originalPrice ? { originalPrice: Number(originalPrice) } : {}),
      category,
      description,
      mediaType: mediaType === 'animation' ? 'animation' : 'video',
      mediaPaths: [],
      ...(selectedMusic ? { musicTrackId: selectedMusic.id } : {}),
    };
    setIsPublishing(true);
    try {
      await onPublish(payload, uploadedFiles);
      toast.success('Your reel is live');
      onClose();
    } catch (error) {
      console.error('Reel publishing failed:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to publish reel');
    } finally {
      setIsPublishing(false);
    }
  };

  const steps = ['type', 'media', 'music', 'details', 'preview'];
  const stepIdx = steps.indexOf(step);
  const isStepInvalid =
    (step === 'media' && (!mediaType || uploadedFiles.length === 0 ||
      (mediaType === 'animation' && uploadedFiles.length < 2))) ||
    (step === 'details' && (!title.trim() || Number(price) <= 0 ||
      (originalPrice !== '' && Number(originalPrice) <= Number(price))));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: '#0d1318', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <p className="font-bold text-sm" style={{ color: '#fff' }}>Create Reel</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Step {stepIdx + 1} of {steps.length}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full transition-all duration-500" style={{ width: `${((stepIdx + 1) / steps.length) * 100}%`, backgroundColor: '#C9A96E' }} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── Step 1: Type ── */}
          {step === 'type' && (
            <div className="p-5 space-y-3">
              <p className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>How do you want to create your reel?</p>
              {[
                { key: 'upload' as const, icon: Upload, label: 'Upload a Video', desc: 'Use a video you\'ve already recorded', color: '#1A3353' },
                { key: 'animation' as const, icon: Image, label: 'Create Animation', desc: 'Turn your product photos into an animated reel with music', color: '#7C3AED' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { clearMedia(); setMediaType(opt.key); setStep('media'); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-98 hover:opacity-90"
                  style={{ backgroundColor: `${opt.color}33`, border: `1px solid ${opt.color}55` }}
                >
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: opt.color }}>
                    <opt.icon size={20} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#fff' }}>{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{opt.desc}</p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          )}

          {/* ── Step 2: Media ── */}
          {step === 'media' && mediaType === 'upload' && (
            <div className="p-5">
              <p className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Upload your product video</p>
              <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl cursor-pointer transition-all" style={{ border: '2px dashed rgba(201,169,110,0.4)', backgroundColor: 'rgba(201,169,110,0.06)' }}>
                <Camera size={32} style={{ color: '#C9A96E' }} />
                <div className="text-center">
                  <p className="font-semibold text-sm" style={{ color: '#C9A96E' }}>Tap to select video</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>MP4, MOV, WebM · max 30s · up to 50MB</p>
                </div>
                <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={async e => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type) || file.size > 50 * 1024 * 1024) {
                    toast.error('Choose an MP4, MOV, or WebM video up to 50MB');
                    return;
                  }
                  const metadataUrl = URL.createObjectURL(file);
                  const probe = document.createElement('video');
                  probe.preload = 'metadata';
                  const duration = await new Promise<number>(resolve => {
                    probe.onloadedmetadata = () => resolve(probe.duration);
                    probe.onerror = () => resolve(Number.NaN);
                    probe.src = metadataUrl;
                  });
                  URL.revokeObjectURL(metadataUrl);
                  if (!Number.isFinite(duration) || duration <= 0 || duration > REEL_DURATION) {
                    toast.error('Choose a video that plays and is no longer than 30 seconds');
                    return;
                  }
                  clearMedia();
                  setUploadedFiles([file]);
                  setUploadedPhotos([previewUrlFor(file)]);
                }} />
              </label>
              {uploadedPhotos.length > 0 && (
                <div className="mt-4 p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <video src={uploadedPhotos[0]} className="h-12 w-16 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: '#fff' }}>Video selected ✓</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Ready to continue</p>
                  </div>
                  <button onClick={() => clearMedia()}><Trash2 size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /></button>
                </div>
              )}
            </div>
          )}

          {step === 'media' && mediaType === 'animation' && (
            <div className="p-5">
              <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Add your product photos</p>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Upload 2–5 photos. We'll animate them with a Ken Burns effect.</p>

              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {uploadedPhotos.map((src, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        removePreviewUrl(uploadedPhotos[i]);
                        setUploadedPhotos(prev => prev.filter((_, j) => j !== i));
                        setUploadedFiles(prev => prev.filter((_, j) => j !== i));
                      }}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                    >
                      <X size={10} style={{ color: '#fff' }} />
                    </button>
                    <div className="absolute bottom-1 left-1 text-[9px] font-bold px-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}>{i + 1}</div>
                  </div>
                ))}
                {uploadedPhotos.length < 5 && (
                  <label className="flex flex-col items-center justify-center rounded-xl cursor-pointer" style={{ aspectRatio: '3/4', border: '2px dashed rgba(201,169,110,0.35)', backgroundColor: 'rgba(201,169,110,0.05)' }}>
                    <Plus size={20} style={{ color: '#C9A96E' }} />
                    <span className="text-[10px] mt-1" style={{ color: '#C9A96E' }}>Add photo</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addPhotos} />
                  </label>
                )}
              </div>

              {/* Animation preview */}
              {uploadedPhotos.length >= 2 && (
                <div>
                  <p className="text-[10px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>PREVIEW</p>
                  <div className="relative rounded-2xl overflow-hidden mx-auto" style={{ height: 200, width: 112 }}>
                    {uploadedPhotos.map((src, i) => (
                      <div key={i} className="absolute inset-0" style={{ opacity: i === animPhotoIdx ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }}>
                        <img src={src} alt="" className="w-full h-full object-cover" style={{ transform: i === animPhotoIdx ? 'scale(1.12) translate(-2%,-2%)' : 'scale(1)', transition: 'transform 3s ease-in-out' }} />
                      </div>
                    ))}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                      {uploadedPhotos.map((_, i) => <div key={i} className="h-1 rounded-full transition-all" style={{ width: i === animPhotoIdx ? 16 : 4, backgroundColor: i === animPhotoIdx ? '#C9A96E' : 'rgba(255,255,255,0.3)' }} />)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Music ── */}
          {step === 'music' && (
            <div className="p-5">
              <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Add background music</p>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Tap ▶ to preview, then select your track.</p>
              <div className="space-y-2">
                {MUSIC_TRACKS.map(track => {
                  const isPreviewing = previewAudio === track.id;
                  const isSelected = selectedMusic?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                      style={{ backgroundColor: isSelected ? `${track.color}33` : 'rgba(255,255,255,0.04)', border: `1px solid ${isSelected ? track.color + '66' : 'rgba(255,255,255,0.06)'}` }}
                    >
                      <button
                        onClick={() => previewTrack(track)}
                        className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                        style={{ backgroundColor: isPreviewing ? '#C9A96E' : track.color }}
                      >
                        {isPreviewing ? <Pause size={14} style={{ color: '#0F1923' }} /> : <Play size={14} fill="#fff" style={{ color: '#fff' }} />}
                      </button>
                      <div className="flex-1">
                        <p className="text-xs font-bold" style={{ color: '#fff' }}>{track.emoji} {track.name}</p>
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{track.artist}</p>
                        {isPreviewing && (
                          <div className="flex gap-0.5 mt-1">
                            {[...Array(8)].map((_, i) => (
                              <div key={i} className="w-0.5 rounded-full" style={{ height: 8 + Math.sin(i * 1.5) * 6, backgroundColor: '#C9A96E', animation: `musicBar${i % 3} 0.5s ease-in-out infinite alternate` }} />
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => selectTrack(track)}
                        className="h-7 px-3 rounded-full text-[10px] font-bold transition-all"
                        style={{ backgroundColor: isSelected ? '#C9A96E' : 'rgba(255,255,255,0.1)', color: isSelected ? '#0F1923' : 'rgba(255,255,255,0.6)' }}
                      >
                        {isSelected ? 'Selected ✓' : 'Use'}
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => setStep('details')}
                  className="w-full py-3 rounded-2xl text-xs font-semibold transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px dashed rgba(255,255,255,0.12)' }}
                >
                  Skip — no music
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Details ── */}
          {step === 'details' && (
            <div className="p-5 space-y-3">
              <p className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Product details</p>
              {[
                { label: 'Product Title *', value: title, setValue: setTitle, placeholder: 'e.g. iPhone 15 Pro Max' },
                { label: 'Price (TTD) *', value: price, setValue: setPrice, placeholder: 'e.g. 5500', type: 'number' },
                { label: 'Original Price (optional)', value: originalPrice, setValue: setOriginalPrice, placeholder: 'e.g. 7000', type: 'number' },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-[10px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{field.label}</label>
                  <input
                    type={field.type ?? 'text'}
                    value={field.value}
                    onChange={e => field.setValue(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Category</label>
                <div className="flex flex-wrap gap-2">
                  {REEL_CATEGORY_OPTIONS.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{ backgroundColor: category === cat ? '#C9A96E' : 'rgba(255,255,255,0.06)', color: category === cat ? '#0F1923' : 'rgba(255,255,255,0.5)' }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell buyers what makes this special…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>
            </div>
          )}

          {/* ── Step 5: Preview ── */}
          {step === 'preview' && (
            <div className="p-5">
              <p className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Preview your reel</p>
              <div className="relative rounded-2xl overflow-hidden mx-auto" style={{ height: 340, maxWidth: 200, backgroundColor: '#0F1923' }}>
                {uploadedPhotos.length > 0 ? (
                  mediaType === 'animation' ? (
                    <AnimatedReel photos={uploadedPhotos} isActive={true} />
                  ) : (
                    <video src={uploadedPhotos[0]} className="w-full h-full object-cover" autoPlay muted loop style={{ filter: 'brightness(0.8)' }} />
                  )
                ) : (
                  <div className="flex items-center justify-center h-full"><Camera size={32} style={{ color: 'rgba(255,255,255,0.2)' }} /></div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85),transparent)' }}>
                  <p className="font-bold text-sm leading-tight" style={{ color: '#fff' }}>{title || 'Your Title'}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: '#C9A96E' }}>${parseFloat(price || '0').toLocaleString()}</p>
                </div>
                {selectedMusic && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <Music size={10} style={{ color: '#C9A96E' }} />
                    <span className="text-[9px]" style={{ color: '#fff' }}>{selectedMusic.name}</span>
                  </div>
                )}
              </div>
              <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Looks good? Tap Publish to go live!</p>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {stepIdx > 0 && (
            <button
              onClick={() => setStep(steps[stepIdx - 1] as typeof step)}
              className="h-11 px-5 rounded-2xl text-sm font-semibold transition-all"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              Back
            </button>
          )}
          {step !== 'preview' ? (
            <button
              onClick={() => {
                if (
                  step === 'media' &&
                  (!mediaType || uploadedFiles.length === 0 ||
                    (mediaType === 'animation' && uploadedFiles.length < 2))
                ) return;
                if (
                  step === 'details' &&
                  (!title.trim() || Number(price) <= 0 ||
                    (originalPrice !== '' && Number(originalPrice) <= Number(price)))
                ) return;
                setStep(steps[stepIdx + 1] as typeof step);
              }}
              className="flex-1 h-11 rounded-2xl text-sm font-bold transition-all"
              style={{
                backgroundColor: isStepInvalid ? 'rgba(255,255,255,0.1)' : '#C9A96E',
                color: isStepInvalid ? 'rgba(255,255,255,0.3)' : '#0F1923',
              }}
            >
              {step === 'music' ? 'Continue' : 'Next →'}
            </button>
          ) : (
            <button
              onClick={publish}
              disabled={isPublishing}
              className="flex-1 h-11 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ backgroundColor: '#C9A96E', color: '#0F1923' }}
            >
              {isPublishing ? 'Uploading…' : '🚀 Publish Reel'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Reel Card ────────────────────────────────────────────────── */
function ReelCard({
  reel, isActive, muted, onToggleMute, onNext, onPrev,
  onComment, onShare, onMessage, onViewItem,
  likeCount, liked, commentCount, saved, viewCount,
  onToggleLike, onToggleSave,
}: {
  reel: Reel; isActive: boolean; muted: boolean;
  onToggleMute: () => void; onNext: () => void; onPrev: () => void;
  onComment: () => void; onShare: () => void; onMessage: () => void; onViewItem: () => void;
  likeCount: number; liked: boolean; commentCount: number; saved: boolean; viewCount: number;
  onToggleLike: () => void; onToggleSave: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef<number>(0);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  /* Music playback for animation reels */
  useEffect(() => {
    if (!reel.musicTrackId || !reel.isAnimation) return;
    const track = MUSIC_TRACKS.find(t => t.id === reel.musicTrackId);
    if (!track) return;
    if (!musicRef.current) musicRef.current = new Audio(track.url);
    const audio = musicRef.current;
    audio.volume = muted ? 0 : 0.35;
    audio.loop = true;
    if (isActive) audio.play().catch(() => {});
    else audio.pause();
    return () => { audio.pause(); };
  }, [isActive, reel.musicTrackId, reel.isAnimation, muted]);

  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = muted ? 0 : 0.35;
  }, [muted]);

  /* Progress timer */
  useEffect(() => {
    if (!isActive) { setProgress(0); if (intervalRef.current) clearInterval(intervalRef.current); return; }
    setProgress(0);
    const tick = 100 / (REEL_DURATION * 20);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { onNext(); return 0; }
        return p + tick;
      });
    }, 50);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, onNext]);

  /* Double-tap like */
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) onToggleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
    }
    lastTapRef.current = now;
  };

  const discount = reel.originalPrice && reel.originalPrice > reel.price
    ? Math.round((1 - reel.price / reel.originalPrice) * 100) : 0;

  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ backgroundColor: '#0F1923' }} onClick={handleDoubleTap}>
      {/* Media layer */}
      {reel.isAnimation && reel.photos && reel.photos.length > 0 ? (
        <AnimatedReel photos={reel.photos} isActive={isActive} />
      ) : reel.videoUrl ? (
        <video
          src={reel.videoUrl}
          poster={reel.posterUrl}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.75)' }}
          autoPlay={isActive}
          loop
          muted={muted}
          playsInline
          preload={isActive ? 'auto' : 'none'}
        />
      ) : (
        <img src={reel.posterUrl} alt={reel.productTitle} className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'brightness(0.75)' }} draggable={false} />
      )}

      {/* Double-tap heart burst */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 1 }}
            exit={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <Heart size={80} fill="#EF4444" style={{ color: '#EF4444', filter: 'drop-shadow(0 0 20px #EF444488)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 z-20" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
        <div className="h-full" style={{ width: `${progress}%`, backgroundColor: '#C9A96E', transition: 'none' }} />
      </div>

      {/* Top left: timer + music */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(4px)' }}>
          {Math.max(0, REEL_DURATION - Math.floor(progress / 100 * REEL_DURATION))}s
        </span>
        {reel.musicTrackId && (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#C9A96E', backdropFilter: 'blur(4px)' }}>
            <Music size={9} /> {MUSIC_TRACKS.find(t => t.id === reel.musicTrackId)?.name}
          </span>
        )}
      </div>

      {/* Top right: mute + views */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        <button onClick={e => { e.stopPropagation(); onToggleMute(); }} className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', color: '#fff' }}>
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <Eye size={10} style={{ color: 'rgba(255,255,255,0.7)' }} />
          <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{formatCount(viewCount)}</span>
        </div>
      </div>

      {/* Category + discount */}
      <div className="absolute top-14 left-4 z-20 flex items-center gap-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#C9A96E', color: '#0F1923' }}>{reel.category}</span>
        {discount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EF4444', color: '#fff' }}>−{discount}%</span>}
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 z-10" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 45%, transparent 100%)', height: 320 }} />

      {/* Right action buttons */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-4">
        {/* Like */}
        <button onClick={e => { e.stopPropagation(); onToggleLike(); }} className="flex flex-col items-center gap-1">
          <motion.div
            whileTap={{ scale: 1.3 }}
            className="h-11 w-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: liked ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
          >
            <Heart size={20} fill={liked ? '#EF4444' : 'none'} style={{ color: liked ? '#EF4444' : '#fff' }} />
          </motion.div>
          <span className="text-[11px] font-semibold" style={{ color: liked ? '#EF4444' : '#fff' }}>{formatCount(likeCount)}</span>
        </button>

        {/* Comment */}
        <button onClick={e => { e.stopPropagation(); onComment(); }} className="flex flex-col items-center gap-1">
          <div className="h-11 w-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
            <MessageCircle size={20} style={{ color: '#fff' }} />
          </div>
          <span className="text-[11px] font-semibold" style={{ color: '#fff' }}>{formatCount(commentCount)}</span>
        </button>

        {/* Share */}
        <button onClick={e => { e.stopPropagation(); onShare(); }} className="flex flex-col items-center gap-1">
          <div className="h-11 w-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
            <Share2 size={18} style={{ color: '#fff' }} />
          </div>
          <span className="text-[11px] font-semibold" style={{ color: '#fff' }}>{formatCount(reel.shares)}</span>
        </button>

        {/* Save */}
        <button onClick={e => { e.stopPropagation(); onToggleSave(); }} className="flex flex-col items-center gap-1">
          <motion.div
            whileTap={{ scale: 1.2 }}
            className="h-11 w-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: saved ? 'rgba(201,169,110,0.3)' : 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
          >
            <Bookmark size={18} fill={saved ? '#C9A96E' : 'none'} style={{ color: saved ? '#C9A96E' : '#fff' }} />
          </motion.div>
          <span className="text-[11px] font-semibold" style={{ color: saved ? '#C9A96E' : '#fff' }}>Save</span>
        </button>

        {/* Seller avatar */}
        <div className="relative mt-1 cursor-pointer">
          <Avatar className="h-11 w-11 border-2" style={{ borderColor: '#C9A96E' }}>
            <AvatarImage src={reel.sellerAvatar} />
            <AvatarFallback style={{ backgroundColor: '#C9A96E', color: '#0F1923', fontSize: '12px', fontWeight: 700 }}>{reel.seller[0]}</AvatarFallback>
          </Avatar>
          {reel.verified && (
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C9A96E' }}>
              <CheckCircle2 size={10} style={{ color: '#0F1923' }} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-16 z-20 px-4 pb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-bold text-sm" style={{ color: '#fff' }}>@{reel.seller.replace(/\s+/g, '').toLowerCase()}</span>
          {reel.verified && <CheckCircle2 size={13} style={{ color: '#C9A96E' }} />}
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <MapPin size={9} style={{ display: 'inline', marginRight: 2 }} />{reel.location}
          </span>
        </div>
        <h3 className="font-bold text-base leading-snug mb-1" style={{ color: '#fff', letterSpacing: '-0.02em' }}>{reel.productTitle}</h3>
        <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.72)' }}>{reel.description}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold" style={{ color: '#C9A96E' }}>${reel.price.toLocaleString()}</span>
            {reel.originalPrice && reel.originalPrice > reel.price && (
              <span className="text-sm line-through" style={{ color: 'rgba(255,255,255,0.4)' }}>${reel.originalPrice.toLocaleString()}</span>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onViewItem(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
            style={{ backgroundColor: '#C9A96E', color: '#0F1923' }}
          >
            <ShoppingBag size={11} /> View Item
          </button>
          <button
            onClick={e => { e.stopPropagation(); onMessage(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <MessageCircle size={11} /> Message
          </button>
        </div>
      </div>

      {/* Desktop prev/next */}
      <button onClick={onPrev} className="absolute left-1/2 -translate-x-1/2 top-1/2 z-20 hidden md:flex h-8 w-8 -mt-16 items-center justify-center rounded-full opacity-0 hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
        <ChevronUp size={18} style={{ color: '#fff' }} />
      </button>
      <button onClick={onNext} className="absolute left-1/2 -translate-x-1/2 top-1/2 z-20 hidden md:flex h-8 w-8 mt-8 items-center justify-center rounded-full opacity-0 hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
        <ChevronDown size={18} style={{ color: '#fff' }} />
      </button>
    </div>
  );
}

/* ─── Main ReelsSection ────────────────────────────────────────── */
export default function ReelsSection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sharedReelId = searchParams.get('reel') ?? undefined;
  const { openChatWithListing } = useChatContext();
  const { requireAuth } = useGuestGate();
  const { user } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const categories = ['All', ...new Set(reels.map(reel => reel.category).filter(Boolean))];

  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [views, setViews] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const viewedRef = useRef<Set<string>>(new Set());
  const pendingLikeRef = useRef(new Set<string>());
  const pendingSaveRef = useRef(new Set<string>());
  const displayReels = activeCategory === 'All' ? reels : reels.filter(r => r.category === activeCategory);
  const activeReel = displayReels[activeIdx] ?? displayReels[0];
  const activeReelId = activeReel?.id;

  useEffect(() => {
    let active = true;
    setFeedLoading(true);
    setFeedError(false);
    reelsAPI.getFeed(sharedReelId)
      .then(feed => {
        if (!active) return;
        setReels(feed);
        setActiveCategory('All');
        setActiveIdx(0);
        setLiked(Object.fromEntries(feed.map(reel => [reel.id, reel.likedByMe])));
        setLikeCounts(Object.fromEntries(feed.map(reel => [reel.id, reel.likes])));
        setSaved(Object.fromEntries(feed.map(reel => [reel.id, reel.savedByMe])));
        setCommentCounts(Object.fromEntries(feed.map(reel => [reel.id, reel.commentCount])));
        setViews(Object.fromEntries(feed.map(reel => [reel.id, reel.views])));
      })
      .catch(error => {
        console.error('Unable to load reel feed:', error);
        if (active) setFeedError(true);
      })
      .finally(() => {
        if (active) setFeedLoading(false);
      });
    return () => { active = false; };
  }, [sharedReelId, user?.id]);

  useEffect(() => {
    if (!showComments || !activeReelId) return;
    let active = true;
    reelsAPI.getComments(activeReelId)
      .then(result => {
        if (active) setComments(prev => ({ ...prev, [activeReelId]: result }));
      })
      .catch(error => console.error('Unable to load reel comments:', error));
    return () => { active = false; };
  }, [showComments, activeReelId, user?.id]);

  /* Increment views when reel becomes active */
  useEffect(() => {
    if (!activeReelId || !user?.id) return;
    const timer = setTimeout(() => {
      if (!viewedRef.current.has(activeReelId)) {
        viewedRef.current.add(activeReelId);
        reelsAPI.recordView(activeReelId)
          .then(() => setViews(prev => ({ ...prev, [activeReelId]: (prev[activeReelId] ?? 0) + 1 })))
          .catch(error => console.error('Unable to record reel view:', error));
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [activeReelId, user?.id]);

  const goNext = useCallback(() => setActiveIdx(i => Math.min(i + 1, displayReels.length - 1)), [displayReels.length]);
  const goPrev = useCallback(() => setActiveIdx(i => Math.max(i - 1, 0)), []);

  useEffect(() => { setActiveIdx(0); }, [activeCategory]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 40) goNext();
      else if (e.deltaY < -40) goPrev();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [goNext, goPrev]);

  /* ── Interaction handlers ── */
  const toggleLike = (reelId: string) => {
    requireAuth(() => {
      if (pendingLikeRef.current.has(reelId)) return;
      pendingLikeRef.current.add(reelId);
      reelsAPI.toggleLike(reelId)
        .then(result => {
          setLiked(prev => ({ ...prev, [reelId]: result.liked }));
          setLikeCounts(prev => ({ ...prev, [reelId]: result.likes }));
          setReels(prev => prev.map(reel => reel.id === reelId ? { ...reel, likes: result.likes, likedByMe: result.liked } : reel));
        })
        .catch(error => console.error('Unable to update reel like:', error))
        .finally(() => pendingLikeRef.current.delete(reelId));
    });
  };

  const toggleSave = (reelId: string) => {
    requireAuth(() => {
      if (pendingSaveRef.current.has(reelId)) return;
      pendingSaveRef.current.add(reelId);
      reelsAPI.toggleSave(reelId)
        .then(result => {
          setSaved(prev => ({ ...prev, [reelId]: result.saved }));
          setReels(prev => prev.map(reel => reel.id === reelId ? { ...reel, savedByMe: result.saved } : reel));
        })
        .catch(error => console.error('Unable to update saved reel:', error))
        .finally(() => pendingSaveRef.current.delete(reelId));
    });
  };

  const addComment = async (reelId: string, text: string): Promise<boolean> => {
    if (!requireAuth()) return false;
    try {
      const comment = await reelsAPI.addComment(reelId, text);
      setComments(prev => ({ ...prev, [reelId]: [...(prev[reelId] ?? []), comment] }));
      setCommentCounts(prev => ({ ...prev, [reelId]: (prev[reelId] ?? 0) + 1 }));
      setReels(prev => prev.map(reel => reel.id === reelId ? { ...reel, commentCount: reel.commentCount + 1 } : reel));
      return true;
    } catch (error) {
      console.error('Unable to post reel comment:', error);
      return false;
    }
  };

  const toggleCommentLike = (reelId: string, commentId: string) => {
    requireAuth(() => {
      reelsAPI.toggleCommentLike(reelId, commentId)
        .then(updated => setComments(prev => ({
          ...prev,
          [reelId]: (prev[reelId] ?? []).map(comment => comment.id === commentId ? updated : comment),
        })))
        .catch(error => console.error('Unable to update comment like:', error));
    });
  };

  const openShare = (reelId: string) => {
    setShowComments(false);
    setShowShare(true);
    if (!user) return;
    reelsAPI.recordShare(reelId)
      .then(() => setReels(prev => prev.map(reel => reel.id === reelId ? { ...reel, shares: reel.shares + 1 } : reel)))
      .catch(error => console.error('Unable to record reel share:', error));
  };

  const handleMessage = (reel: Reel) => {
    openChatWithListing({
      sellerId: reel.sellerId,
      sellerName: reel.seller,
      sellerAvatar: reel.sellerAvatar,
      listingId: reel.id,
      listingTitle: reel.productTitle,
      listingPrice: `$${reel.price.toLocaleString()}`,
      listingImage: reel.posterUrl,
      listingCategory: reel.category,
    });
    navigate('/dashboard/messages');
  };

  const handleViewItem = () => navigate('/dashboard/marketplace');

  const publishReel = async (payload: CreateReelPayload, files: File[]) => {
    const uploads: UploadedReelMedia[] = [];
    try {
      for (const file of files) uploads.push(await reelsAPI.uploadMedia(file));
      const reel = await reelsAPI.create({
        ...payload,
        mediaPaths: uploads.map(upload => upload.path),
      });
      setReels(prev => [reel, ...prev]);
      setLiked(prev => ({ ...prev, [reel.id]: reel.likedByMe }));
      setLikeCounts(prev => ({ ...prev, [reel.id]: reel.likes }));
      setSaved(prev => ({ ...prev, [reel.id]: reel.savedByMe }));
      setCommentCounts(prev => ({ ...prev, [reel.id]: reel.commentCount }));
      setViews(prev => ({ ...prev, [reel.id]: reel.views }));
      setComments(prev => ({ ...prev, [reel.id]: [] }));
      setActiveIdx(0);
      setActiveCategory('All');
    } catch (error) {
      if (uploads.length > 0) {
        try {
          await reelsAPI.deleteMedia(uploads.map(upload => upload.path));
        } catch (cleanupError) {
          console.error('Unable to clean up failed reel upload:', cleanupError);
        }
      }
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0F1923' }}>
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-2 px-4 pr-56 sm:pr-72 py-3 overflow-x-auto" style={{ backgroundColor: 'rgba(15,25,35,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-1.5 mr-2 shrink-0">
          <Play size={14} fill="#C9A96E" style={{ color: '#C9A96E' }} />
          <span className="font-bold text-sm" style={{ color: '#fff' }}>Reels</span>
        </div>
        <div className="w-px h-4 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={{ backgroundColor: activeCategory === cat ? '#C9A96E' : 'rgba(255,255,255,0.1)', color: activeCategory === cat ? '#0F1923' : 'rgba(255,255,255,0.7)' }}
          >
            {cat}
          </button>
        ))}
        <div className="flex-1" />
        {/* Create button */}
        <button
          onClick={() => requireAuth(() => setShowCreate(true))}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ml-1"
          style={{ backgroundColor: '#C9A96E', color: '#0F1923' }}
        >
          <Plus size={13} /> Create
        </button>
      </div>

      {/* Reel viewport */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onTouchStart={e => { touchStartY.current = e.touches[0].clientY; }}
        onTouchEnd={e => {
          if (touchStartY.current === null) return;
          const dy = touchStartY.current - e.changedTouches[0].clientY;
          if (dy > 50) goNext();
          else if (dy < -50) goPrev();
          touchStartY.current = null;
        }}
      >
        {displayReels.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <Play size={28} style={{ color: '#C9A96E' }} />
            <p className="font-semibold">{feedLoading ? 'Loading reels…' : feedError ? 'Reels are unavailable' : 'No reels yet'}</p>
            <p className="text-sm">
              {feedLoading
                ? 'Please wait while we load the community feed.'
                : feedError
                  ? 'Please try again in a moment.'
                  : 'Create a reel to share an item or service with your community.'}
            </p>
          </div>
        ) : displayReels.map((reel, i) => (
          <div
            key={reel.id}
            className="absolute inset-0"
            style={{ transform: `translateY(${(i - activeIdx) * 100}%)`, transition: 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)' }}
          >
            <ReelCard
              reel={reel}
              isActive={i === activeIdx}
              muted={muted}
              onToggleMute={() => setMuted(v => !v)}
              onNext={goNext}
              onPrev={goPrev}
              onComment={() => { setShowShare(false); setShowComments(true); }}
              onShare={() => openShare(reel.id)}
              onMessage={() => handleMessage(reel)}
              onViewItem={handleViewItem}
              liked={liked[reel.id] ?? reel.likedByMe}
              likeCount={likeCounts[reel.id] ?? reel.likes}
              commentCount={commentCounts[reel.id] ?? reel.commentCount}
              saved={saved[reel.id] ?? reel.savedByMe}
              viewCount={views[reel.id] ?? reel.views}
              onToggleLike={() => toggleLike(reel.id)}
              onToggleSave={() => toggleSave(reel.id)}
            />
          </div>
        ))}

        {/* Overlay panels */}
        <AnimatePresence>
          {showComments && activeReel && (
            <>
              <motion.div key="comments-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-30" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowComments(false)} />
              <CommentsPanel
                key="comments-panel"
                reelId={activeReel.id}
                comments={comments[activeReel.id] ?? []}
                onClose={() => setShowComments(false)}
                onAddComment={addComment}
                onToggleLikeComment={toggleCommentLike}
              />
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showShare && activeReel && (
            <>
              <motion.div key="share-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-30" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowShare(false)} />
              <ShareSheet key="share-sheet" reel={activeReel} onClose={() => setShowShare(false)} />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="shrink-0 flex items-center justify-center gap-1.5 py-2.5" style={{ backgroundColor: '#0F1923' }}>
        {displayReels.map((_, i) => (
          <button key={i} onClick={() => setActiveIdx(i)} className="rounded-full transition-all"
            style={{ width: i === activeIdx ? 20 : 6, height: 6, backgroundColor: i === activeIdx ? '#C9A96E' : 'rgba(255,255,255,0.25)' }} />
        ))}
      </div>

      {/* Create Reel Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateReelModal onClose={() => setShowCreate(false)} onPublish={publishReel} />
        )}
      </AnimatePresence>
    </div>
  );
}
