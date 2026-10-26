import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useChatContext } from '@/context/ChatContext';
import { getSocket } from '@/services/socketService';
import {
  Search, Send, Paperclip, Smile, MessageSquare,
  MoreVertical, ArrowLeft, Check, CheckCheck, MapPin, PlusCircle, Info, Edit2,
  Tag, ChevronUp, ChevronDown, X as XIcon, Play, Pause, Forward,
  DollarSign, CheckCircle, XCircle, Clock, RefreshCw, Star,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

interface ListingCard {
  id: string;
  title: string;
  price: string;
  image?: string;
  category: string;
}

interface Reaction {
  emoji: string;
  count: number;
  byMe: boolean;
}

interface OfferData {
  listingTitle: string;
  listingImage?: string;
  askingPrice: number;
  offerPrice: number;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';
  isCounter?: boolean;
  expiresAt?: number;
}

interface Message {
  id: string;
  content: string;
  sender: 'me' | 'them';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'location' | 'listing' | 'audio' | 'offer';
  media?: string;
  listing?: ListingCard;
  reactions?: Reaction[];
  audioUrl?: string;
  audioDuration?: number;
  isForwarded?: boolean;
  starred?: boolean;
  offerData?: OfferData;
  quotedMsg?: { id: string; content: string; sender: 'me' | 'them' };
}

interface Contact {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  category: string;
  avatar: string;
  messages: Message[];
}

const CAT_STYLE: Record<string, { bg: string; text: string }> = {
  Marketplace: { bg: '#EEF2FF', text: '#4338CA' },
  Food:        { bg: '#FFF7ED', text: '#C2410C' },
  Transport:   { bg: '#F0FDF4', text: '#15803D' },
  Support:     { bg: '#EFF6FF', text: '#1D4ED8' },
};

const OFFER_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const fmtCountdown = (ms: number): string => {
  if (ms <= 0) return 'Expired';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
};

/* ── Listing Card Message ──────────────────────────────────────── */
const ListingCardMessage = ({ listing }: { listing: ListingCard }) => (
  <div
    className="rounded-xl overflow-hidden border"
    style={{ borderColor: '#E8E2D8', backgroundColor: '#ffffff', maxWidth: 260, boxShadow: '0 1px 4px rgba(15,25,35,0.06)' }}
  >
    {listing.image && (
      <div className="h-32 overflow-hidden" style={{ backgroundColor: '#F5F2EC' }}>
        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
      </div>
    )}
    <div className="p-3">
      <div className="flex items-center gap-1 mb-1">
        <Tag size={10} style={{ color: '#C9A96E' }} />
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#C9A96E' }}>
          {listing.category}
        </span>
      </div>
      <p className="text-sm font-semibold leading-tight line-clamp-2 mb-1" style={{ color: '#0F1923' }}>{listing.title}</p>
      <p className="text-base font-bold" style={{ color: '#1A3353' }}>{listing.price}</p>
    </div>
  </div>
);

/* ── Pending listing attachment ─────────────────────────────────── */
const PendingListingAttachment = ({ listing, onRemove }: { listing: ListingCard; onRemove: () => void }) => (
  <div
    className="flex items-center gap-3 px-4 py-2.5 border-t"
    style={{ backgroundColor: '#F5F2EC', borderColor: '#E8E2D8' }}
  >
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {listing.image && (
        <img src={listing.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" style={{ border: '1px solid #E8D9BC' }} />
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#C9A96E' }}>Listing attached</p>
        <p className="text-xs font-semibold truncate" style={{ color: '#0F1923' }}>{listing.title}</p>
        <p className="text-xs font-bold" style={{ color: '#1A3353' }}>{listing.price}</p>
      </div>
    </div>
    <button
      onClick={onRemove}
      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
      style={{ backgroundColor: '#E8E2D8', color: '#6E7A8A' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#E8E2D8'; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; }}
    >
      ×
    </button>
  </div>
);

/* ── Offer Card Message ─────────────────────────────────────── */
const OfferCardMessage = ({
  offer,
  isMe,
  onAccept,
  onDecline,
  onCounter,
  onExpire,
}: {
  offer: OfferData;
  isMe: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onCounter?: () => void;
  onExpire?: () => void;
}) => {
  const savings = offer.askingPrice - offer.offerPrice;
  const pct = offer.askingPrice > 0 ? Math.round((savings / offer.askingPrice) * 100) : 0;

  const [timeLeft, setTimeLeft] = useState(() =>
    offer.expiresAt ? Math.max(0, offer.expiresAt - Date.now()) : Infinity
  );
  const onExpireRef = useRef(onExpire);
  useEffect(() => { onExpireRef.current = onExpire; });

  useEffect(() => {
    if (!offer.expiresAt || offer.status !== 'pending') return;
    let id: ReturnType<typeof setInterval>;
    const tick = () => {
      const left = Math.max(0, offer.expiresAt! - Date.now());
      setTimeLeft(left);
      if (left === 0) { clearInterval(id); onExpireRef.current?.(); }
    };
    tick();
    id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [offer.expiresAt, offer.status]);

  const isExpired = offer.status === 'expired' ||
    (offer.status === 'pending' && offer.expiresAt != null && timeLeft <= 0);

  const statusKey = isExpired ? 'expired' : offer.status;
  const statusConfig = {
    pending:   { icon: Clock,       color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', label: 'Pending' },
    accepted:  { icon: CheckCircle, color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', label: 'Accepted' },
    declined:  { icon: XCircle,     color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', label: 'Declined' },
    countered: { icon: RefreshCw,   color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', label: 'Counter-offer sent' },
    expired:   { icon: Clock,       color: '#6E7A8A', bg: '#F5F2EC', border: '#E8E2D8', label: 'Expired' },
  }[statusKey] ?? { icon: Clock, color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', label: 'Pending' };

  const StatusIcon = statusConfig.icon;
  const showActions = offer.status === 'pending' && !isMe && !isExpired;
  const showCountdown = offer.status === 'pending' && !isExpired && offer.expiresAt != null && timeLeft !== Infinity;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${isExpired ? '#E8E2D8' : offer.isCounter ? '#DDD6FE' : '#E8E2D8'}`,
        backgroundColor: '#ffffff',
        maxWidth: 280,
        boxShadow: '0 2px 8px rgba(15,25,35,0.08)',
        opacity: isExpired ? 0.75 : 1,
      }}
    >
      {/* Header stripe */}
      <div
        className="px-4 py-2.5 flex items-center justify-between gap-2"
        style={{ backgroundColor: isExpired ? '#6E7A8A' : offer.isCounter ? '#4C1D95' : '#1A3353' }}
      >
        <div className="flex items-center gap-1.5">
          {isExpired
            ? <Clock size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
            : offer.isCounter
              ? <RefreshCw size={13} style={{ color: '#C4B5FD' }} />
              : <DollarSign size={14} style={{ color: '#C9A96E' }} />
          }
          <span className="text-xs font-bold uppercase tracking-widest" style={{
            color: isExpired ? 'rgba(255,255,255,0.85)' : offer.isCounter ? '#C4B5FD' : '#C9A96E'
          }}>
            {isExpired ? 'Offer Expired' : offer.isCounter ? 'Counter Offer' : 'Price Offer'}
          </span>
        </div>
        {showCountdown && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0"
            style={{
              backgroundColor: timeLeft < 3_600_000 ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.15)',
              color: timeLeft < 3_600_000 ? '#FCA5A5' : 'rgba(255,255,255,0.8)',
            }}
          >
            <Clock size={9} />
            {fmtCountdown(timeLeft)}
          </span>
        )}
      </div>

      {/* Listing thumbnail + title */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        {offer.listingImage && (
          <img
            src={offer.listingImage}
            alt=""
            className="w-12 h-12 rounded-xl object-cover shrink-0"
            style={{ border: '1px solid #E8E2D8' }}
          />
        )}
        <p className="text-sm font-semibold leading-tight line-clamp-2" style={{ color: '#0F1923' }}>
          {offer.listingTitle}
        </p>
      </div>

      {/* Price comparison */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#6E7A8A' }}>
            Asking
          </p>
          <p className="text-sm line-through" style={{ color: '#6E7A8A' }}>
            ${offer.askingPrice.toLocaleString()}
          </p>
        </div>
        <div className="text-lg font-bold" style={{ color: isExpired ? '#9CA3AF' : offer.isCounter ? '#7C3AED' : '#C9A96E' }}>→</div>
        <div className="flex-1 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#6E7A8A' }}>
            {offer.isCounter ? 'Counter' : 'Offer'}
          </p>
          <p className="text-xl font-bold" style={{ color: isExpired ? '#9CA3AF' : offer.isCounter ? '#6D28D9' : '#0F1923' }}>
            ${offer.offerPrice.toLocaleString()}
          </p>
        </div>
      </div>

      {pct > 0 && !isExpired && (
        <div className="px-4 pb-3">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: offer.isCounter ? '#EDE9FE' : '#F0EBE1',
              color: offer.isCounter ? '#6D28D9' : '#1A3353',
            }}
          >
            {pct}% below asking price
          </span>
        </div>
      )}

      {/* Status or Actions */}
      <div className="px-4 pb-4">
        {showActions ? (
          <div className="flex gap-1.5">
            <button
              onClick={onDecline}
              className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{ borderColor: '#E8E2D8', color: '#6E7A8A', backgroundColor: '#F5F2EC' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#B91C1C'; (e.currentTarget as HTMLElement).style.color = '#B91C1C'; (e.currentTarget as HTMLElement).style.backgroundColor = '#FEF2F2'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E8E2D8'; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; }}
            >
              Decline
            </button>
            {onCounter && (
              <button
                onClick={onCounter}
                className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                style={{ borderColor: '#DDD6FE', color: '#7C3AED', backgroundColor: '#F5F3FF' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EDE9FE'; (e.currentTarget as HTMLElement).style.borderColor = '#C4B5FD'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F3FF'; (e.currentTarget as HTMLElement).style.borderColor = '#DDD6FE'; }}
              >
                Counter
              </button>
            )}
            <button
              onClick={onAccept}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ backgroundColor: '#1A3353', color: '#ffffff' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(26,51,83,0.25)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
            >
              Accept
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ backgroundColor: statusConfig.bg, border: `1px solid ${statusConfig.border}` }}
          >
            <StatusIcon size={13} style={{ color: statusConfig.color }} />
            <span className="text-xs font-semibold" style={{ color: statusConfig.color }}>
              {statusConfig.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Offer Modal ─────────────────────────────────────────────── */
const OfferModal = ({
  listing,
  onSend,
  onClose,
}: {
  listing: { title: string; price: string; image?: string };
  onSend: (offerPrice: number) => void;
  onClose: () => void;
}) => {
  const askingNum = parseInt(listing.price.replace(/[^0-9]/g, ''), 10) || 0;
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const handleSubmit = () => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!num || num <= 0) { setError('Please enter a valid amount'); return; }
    if (num >= askingNum && askingNum > 0) { setError(`Offer must be below the asking price ($${askingNum.toLocaleString()})`); return; }
    onSend(num);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15,25,35,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ backgroundColor: '#ffffff', border: '1px solid #E8E2D8' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E8E2D8', backgroundColor: '#1A3353' }}>
          <div className="flex items-center gap-2">
            <DollarSign size={16} style={{ color: '#C9A96E' }} />
            <h3 className="font-bold text-base" style={{ color: '#ffffff', letterSpacing: '-0.02em' }}>Make an Offer</h3>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <XIcon size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Listing preview */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ backgroundColor: '#F5F2EC', border: '1px solid #E8E2D8' }}
          >
            {listing.image && (
              <img src={listing.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" style={{ border: '1px solid #E8D9BC' }} />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#C9A96E' }}>Listing</p>
              <p className="text-sm font-semibold truncate" style={{ color: '#0F1923' }}>{listing.title}</p>
              <p className="text-sm font-bold" style={{ color: '#1A3353' }}>
                {listing.price}
                <span className="font-normal text-xs ml-1" style={{ color: '#6E7A8A' }}>asking</span>
              </p>
            </div>
          </div>

          {/* Price input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6E7A8A' }}>
              Your offer
            </label>
            <div
              className="flex items-center rounded-xl border px-3 gap-2 transition-shadow focus-within:ring-2"
              style={{ borderColor: error ? '#FCA5A5' : '#E8E2D8', '--tw-ring-color': '#C9A96E' } as React.CSSProperties}
            >
              <span className="text-lg font-bold shrink-0" style={{ color: '#6E7A8A' }}>$</span>
              <input
                ref={inputRef}
                type="number"
                min="1"
                placeholder="0"
                value={value}
                onChange={e => { setValue(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="flex-1 h-12 text-xl font-bold outline-none bg-transparent"
                style={{ color: '#0F1923' }}
              />
            </div>
            {error && <p className="text-xs mt-1.5" style={{ color: '#B91C1C' }}>{error}</p>}
            {askingNum > 0 && !error && value && (
              <p className="text-xs mt-1.5" style={{ color: '#6E7A8A' }}>
                {parseInt(value) < askingNum
                  ? `${Math.round((1 - parseInt(value) / askingNum) * 100)}% below asking price`
                  : 'Enter an amount below the asking price'}
              </p>
            )}
          </div>

          <p className="text-xs leading-relaxed" style={{ color: '#6E7A8A' }}>
            Your offer will be sent as a message card. The seller can accept or decline directly in chat.
          </p>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
              style={{ borderColor: '#E8E2D8', color: '#6E7A8A' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: '#1A3353', color: '#ffffff' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(26,51,83,0.25)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
            >
              Send Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Counter Offer Modal ─────────────────────────────────────── */
const CounterOfferModal = ({
  offer,
  onSend,
  onClose,
}: {
  offer: OfferData;
  onSend: (counterPrice: number) => void;
  onClose: () => void;
}) => {
  const suggested = offer.askingPrice > 0 && offer.offerPrice > 0
    ? Math.round((offer.offerPrice + offer.askingPrice) / 2)
    : offer.offerPrice + 50;
  const [value, setValue] = useState(String(suggested));
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const handleSubmit = () => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!num || num <= 0) { setError('Please enter a valid amount'); return; }
    if (num <= offer.offerPrice) { setError(`Counter must be above buyer's offer ($${offer.offerPrice.toLocaleString()})`); return; }
    if (offer.askingPrice > 0 && num >= offer.askingPrice) { setError(`Counter must be below asking price ($${offer.askingPrice.toLocaleString()})`); return; }
    onSend(num);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15,25,35,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ backgroundColor: '#ffffff', border: '1px solid #DDD6FE' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#DDD6FE', backgroundColor: '#4C1D95' }}>
          <div className="flex items-center gap-2">
            <RefreshCw size={15} style={{ color: '#C4B5FD' }} />
            <h3 className="font-bold text-base" style={{ color: '#ffffff', letterSpacing: '-0.02em' }}>Counter Offer</h3>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <XIcon size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Offer context */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ backgroundColor: '#F5F3FF', border: '1px solid #DDD6FE' }}
          >
            {offer.listingImage && (
              <img src={offer.listingImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" style={{ border: '1px solid #DDD6FE' }} />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate mb-0.5" style={{ color: '#0F1923' }}>{offer.listingTitle}</p>
              <div className="flex items-center gap-2 text-xs">
                <span style={{ color: '#6E7A8A' }}>Buyer offered</span>
                <span className="font-bold" style={{ color: '#7C3AED' }}>${offer.offerPrice.toLocaleString()}</span>
                <span style={{ color: '#6E7A8A' }}>·</span>
                <span style={{ color: '#6E7A8A' }}>Asking ${offer.askingPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Price input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6E7A8A' }}>
              Your counter price
            </label>
            <div
              className="flex items-center rounded-xl border px-3 gap-2 transition-shadow focus-within:ring-2"
              style={{ borderColor: error ? '#FCA5A5' : '#DDD6FE', '--tw-ring-color': '#7C3AED' } as React.CSSProperties}
            >
              <span className="text-lg font-bold shrink-0" style={{ color: '#6E7A8A' }}>$</span>
              <input
                ref={inputRef}
                type="number"
                min="1"
                placeholder="0"
                value={value}
                onChange={e => { setValue(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="flex-1 h-12 text-xl font-bold outline-none bg-transparent"
                style={{ color: '#6D28D9' }}
              />
            </div>
            {error && <p className="text-xs mt-1.5" style={{ color: '#B91C1C' }}>{error}</p>}
            {!error && value && (
              <p className="text-xs mt-1.5" style={{ color: '#6E7A8A' }}>
                Midpoint between offer and asking price
              </p>
            )}
          </div>

          <p className="text-xs leading-relaxed" style={{ color: '#6E7A8A' }}>
            Your counter-offer will be sent as a card. The buyer can accept, decline, or counter again.
          </p>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
              style={{ borderColor: '#DDD6FE', color: '#7C3AED' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F3FF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: '#4C1D95', color: '#ffffff' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#3B0764'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(76,29,149,0.35)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#4C1D95'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
            >
              Send Counter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Audio message player ────────────────────────────────────── */
const WAVEFORM_BARS = [3,5,8,6,9,5,7,4,8,6,5,9,7,4,6,8,5,7,4,6,9,5,8,6,7,4,9,6,5,8];

const AudioMessage = ({ url, duration, isMe }: { url: string; duration: number; isMe: boolean }) => {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(duration);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play(); }
    setPlaying(!playing);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const progress = total > 0 ? (current / total) * 100 : 0;
  const barColor = isMe ? 'rgba(255,255,255,0.55)' : '#C9A96E';
  const barActiveColor = isMe ? '#ffffff' : '#1A3353';

  return (
    <div className="flex items-center gap-3 py-0.5 min-w-[210px]">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={e => setCurrent((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={e => setTotal((e.target as HTMLAudioElement).duration || duration)}
        onEnded={() => { setPlaying(false); setCurrent(0); if (audioRef.current) audioRef.current.currentTime = 0; }}
      />
      <button
        onClick={toggle}
        className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center transition-all"
        style={{ backgroundColor: isMe ? 'rgba(255,255,255,0.18)' : 'rgba(201,169,110,0.15)', color: isMe ? '#ffffff' : '#C9A96E' }}
      >
        {playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" style={{ transform: 'translateX(1px)' }} />}
      </button>

      {/* Waveform bars */}
      <div className="flex items-end gap-[2px] flex-1 h-8 overflow-hidden">
        {WAVEFORM_BARS.map((h, i) => {
          const pct = i / WAVEFORM_BARS.length;
          const filled = pct <= progress / 100;
          return (
            <div
              key={i}
              className="rounded-full flex-shrink-0 transition-colors"
              style={{
                width: 2,
                height: `${(h / 9) * 100}%`,
                backgroundColor: filled ? barActiveColor : barColor,
                animation: playing ? `typingBounce ${0.6 + (i % 4) * 0.15}s ease-in-out ${(i * 0.03) % 0.5}s infinite` : undefined,
              }}
            />
          );
        })}
      </div>

      <span className="text-[10px] shrink-0 tabular-nums" style={{ color: isMe ? 'rgba(255,255,255,0.6)' : '#6E7A8A' }}>
        {fmt(playing ? current : total)}
      </span>
    </div>
  );
};

/* ── Text highlight helper ───────────────────────────────────── */
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ backgroundColor: '#C9A96E', color: '#0F1923', borderRadius: 2, padding: '0 1px', fontWeight: 600 }}>{part}</mark>
      : part
  );
}

/* ── Emoji Picker ─────────────────────────────────────────────── */
const QUICK_EMOJIS = ['❤️', '😂', '👍', '😮', '😢', '🔥', '👏', '🎉'];

const EmojiPicker = ({ onPick, isMe, onForward, onStar, isStarred }: { onPick: (emoji: string) => void; isMe: boolean; onForward: () => void; onStar: () => void; isStarred?: boolean }) => (
  <div
    className="absolute z-20 flex items-center gap-1 px-2 py-1.5 rounded-full shadow-lg border"
    style={{
      bottom: 'calc(100% + 6px)',
      [isMe ? 'right' : 'left']: 0,
      backgroundColor: '#ffffff',
      borderColor: '#E8E2D8',
      boxShadow: '0 4px 16px rgba(15,25,35,0.12)',
      whiteSpace: 'nowrap',
    }}
  >
    {QUICK_EMOJIS.map(emoji => (
      <button
        key={emoji}
        onClick={e => { e.stopPropagation(); onPick(emoji); }}
        className="text-base leading-none transition-transform hover:scale-125 active:scale-110 rounded-full p-0.5"
        style={{ lineHeight: 1 }}
      >
        {emoji}
      </button>
    ))}
    <span style={{ width: 1, height: 18, backgroundColor: '#E8E2D8', margin: '0 2px', display: 'inline-block', borderRadius: 1 }} />
    <button
      onClick={e => { e.stopPropagation(); onStar(); }}
      className="flex items-center justify-center rounded-full p-1 transition-colors"
      style={{ color: isStarred ? '#C9A96E' : '#6E7A8A' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F0EBE1'; if (!isStarred) (e.currentTarget as HTMLElement).style.color = '#C9A96E'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = isStarred ? '#C9A96E' : '#6E7A8A'; }}
      title={isStarred ? 'Unstar' : 'Star'}
    >
      <Star size={13} fill={isStarred ? '#C9A96E' : 'none'} />
    </button>
    <button
      onClick={e => { e.stopPropagation(); onForward(); }}
      className="flex items-center justify-center rounded-full p-1 transition-colors"
      style={{ color: '#6E7A8A' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F0EBE1'; (e.currentTarget as HTMLElement).style.color = '#1A3353'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; }}
      title="Forward"
    >
      <Forward size={13} />
    </button>
  </div>
);

/* ── Forward Modal ────────────────────────────────────────────── */
const ForwardModal = ({
  contacts, currentContactId, onForward, onClose,
}: {
  contacts: { id: string; name: string; avatar: string; category: string }[];
  currentContactId: string;
  onForward: (contactId: string) => void;
  onClose: () => void;
}) => {
  const others = contacts.filter(c => c.id !== currentContactId);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15,25,35,0.45)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ backgroundColor: '#ffffff', border: '1px solid #E8E2D8' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E8E2D8' }}>
          <h3 className="font-bold text-base" style={{ color: '#0F1923', letterSpacing: '-0.02em' }}>Forward to…</h3>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: '#6E7A8A' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
          >
            <XIcon size={14} />
          </button>
        </div>
        {/* Contact list */}
        <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
          {others.map(c => (
            <button
              key={c.id}
              onClick={() => onForward(c.id)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={c.avatar} />
                <AvatarFallback style={{ backgroundColor: '#E8E2D8', color: '#1A3353', fontSize: '11px', fontWeight: 600 }}>
                  {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: '#0F1923' }}>{c.name}</p>
                <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#6E7A8A' }}>{c.category}</span>
              </div>
              <Forward size={14} style={{ color: '#C9A96E', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Empty state ───────────────────────────────────────────────── */
const EmptyState = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#F0EBE1' }}>
      <MessageSquare size={28} style={{ color: '#C9A96E' }} strokeWidth={1.6} />
    </div>
    <div>
      <h3 className="font-semibold text-lg mb-1.5" style={{ color: '#0F1923', letterSpacing: '-0.02em' }}>Your Messages</h3>
      <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#6E7A8A' }}>
        Select a conversation to start chatting. Click "Chat" on any listing to start a new one.
      </p>
    </div>
  </div>
);

/* ── Main ──────────────────────────────────────────────────────── */
const MessagesSection: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { pendingChat, clearPendingChat, markAllRead } = useChatContext();

  useEffect(() => { markAllRead(); }, []);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [pendingListing, setPendingListing] = useState<ListingCard | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearch, setMsgSearch] = useState('');
  const [msgSearchIdx, setMsgSearchIdx] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const msgSearchInputRef = useRef<HTMLInputElement>(null);
  const [forwardingMsg, setForwardingMsg] = useState<Message | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counteringMsgId, setCounteringMsgId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const swipeTouchRef = useRef<{ startX: number; startY: number; msgId: string; el: HTMLDivElement; hapticFired: boolean } | null>(null);
  const [showStarred, setShowStarred] = useState(false);

  const selected = contacts.find(c => c.id === selectedId) ?? null;
  const filtered = search.trim()
    ? contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.lastMessage.toLowerCase().includes(search.toLowerCase()))
    : contacts;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selected?.messages.length]);

  /* ── In-conversation search ── */
  const msgSearchMatches = useMemo(() => {
    if (!selected || !msgSearch.trim()) return [];
    const q = msgSearch.toLowerCase();
    return selected.messages
      .filter(m => m.type === 'text' && m.content.toLowerCase().includes(q))
      .map(m => m.id);
  }, [selected, msgSearch]);

  useEffect(() => { setMsgSearchIdx(0); }, [msgSearch, selectedId]);

  useEffect(() => {
    if (!msgSearchMatches.length) return;
    const id = msgSearchMatches[msgSearchIdx];
    msgRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [msgSearchIdx, msgSearchMatches]);

  useEffect(() => {
    if (showMsgSearch) { setTimeout(() => msgSearchInputRef.current?.focus(), 60); }
    else { setMsgSearch(''); }
  }, [showMsgSearch]);

  // reset search when switching contacts
  useEffect(() => { setShowMsgSearch(false); setMsgSearch(''); }, [selectedId]);

  // Socket.IO — join/leave room when selected contact changes
  useEffect(() => {
    const socket = getSocket();
    if (selectedId) {
      socket.emit('join-room', selectedId);
    }
    return () => {
      if (selectedId) socket.emit('leave-room', selectedId);
    };
  }, [selectedId]);

  // Socket.IO — receive messages from other users in real time
  useEffect(() => {
    const socket = getSocket();
    const handleIncoming = (msg: { id: string; content: string; roomId: string; senderName?: string }) => {
      setContacts(prev => prev.map(c => {
        if (c.id !== msg.roomId) return c;
        const incomingMsg: Message = {
          id: msg.id || uuidv4(),
          content: msg.content,
          sender: 'them',
          timestamp: new Date(),
          status: 'delivered',
          type: 'text',
        };
        return { ...c, messages: [...c.messages, incomingMsg], lastMessage: msg.content, time: 'now', unread: c.id === selectedId ? 0 : c.unread + 1 };
      }));
    };
    socket.on('new-message', handleIncoming);
    return () => { socket.off('new-message', handleIncoming); };
  }, [selectedId]);

  /* ── Consume pendingChat from context ── */
  useEffect(() => {
    if (!pendingChat) return;

    const listing: ListingCard = {
      id: pendingChat.listingId,
      title: pendingChat.listingTitle,
      price: pendingChat.listingPrice,
      image: pendingChat.listingImage,
      category: pendingChat.listingCategory,
    };

    setContacts(prev => {
      const existingIdx = prev.findIndex(c =>
        c.name.toLowerCase() === pendingChat.sellerName.toLowerCase()
      );

      let contactId: string;

      if (existingIdx !== -1) {
        contactId = prev[existingIdx].id;

        const cardMsg: Message = {
          id: uuidv4(),
          content: '',
          sender: 'me',
          timestamp: new Date(),
          status: 'sent',
          type: 'listing',
          listing,
        };

        const updated = prev.map((c, i) =>
          i === existingIdx
            ? { ...c, unread: 0, messages: [...c.messages, cardMsg], lastMessage: `Re: ${listing.title}`, time: 'now' }
            : c
        );

        setTimeout(() => {
          setSelectedId(contactId);
          setPendingListing(listing);
        }, 0);

        return updated;
      } else {
        contactId = `seller_${Date.now()}`;

        const cardMsg: Message = {
          id: uuidv4(),
          content: '',
          sender: 'me',
          timestamp: new Date(),
          status: 'sent',
          type: 'listing',
          listing,
        };

        const newContact: Contact = {
          id: contactId,
          name: pendingChat.sellerName,
          lastMessage: `Re: ${listing.title}`,
          time: 'now',
          unread: 0,
          category: pendingChat.listingCategory,
          avatar: pendingChat.sellerAvatar ?? '',
          messages: [cardMsg],
        };

        setTimeout(() => {
          setSelectedId(contactId);
          setPendingListing(listing);
        }, 0);

        return [newContact, ...prev];
      }
    });

    if (pendingChat.triggerOffer) {
      setTimeout(() => setShowOfferModal(true), 200);
    }

    clearPendingChat();
  }, [pendingChat, clearPendingChat]);


  const handleForward = useCallback((targetContactId: string) => {
    if (!forwardingMsg) return;
    const src = forwardingMsg;
    setContacts(prev => prev.map(c => {
      if (c.id !== targetContactId) return c;
      const fwd: Message = {
        ...src,
        id: uuidv4(),
        sender: 'me',
        timestamp: new Date(),
        status: 'sent',
        reactions: undefined,
        isForwarded: true,
      };
      const preview = src.type === 'audio' ? '🎤 Voice message' : src.type === 'listing' ? `📦 ${src.listing?.title ?? 'Listing'}` : src.content.slice(0, 40);
      return { ...c, messages: [...c.messages, fwd], lastMessage: `↪ ${preview}`, time: 'now' };
    }));
    setForwardingMsg(null);
    setHoveredMsgId(null);
  }, [forwardingMsg]);


  const handleOfferResponse = useCallback((msgId: string, response: 'accepted' | 'declined' | 'expired') => {
    if (!selectedId) return;
    const contactIdSnapshot = selectedId;

    setContacts(prev => prev.map(c => {
      if (c.id !== contactIdSnapshot) return c;
      return {
        ...c,
        messages: c.messages.map(m =>
          m.id === msgId && m.type === 'offer' && m.offerData
            ? { ...m, offerData: { ...m.offerData, status: response } }
            : m
        ),
      };
    }));

  }, [selectedId]);


  const handleReaction = useCallback((contactId: string, msgId: string, emoji: string) => {
    setContacts(prev => prev.map(c => {
      if (c.id !== contactId) return c;
      return {
        ...c,
        messages: c.messages.map(m => {
          if (m.id !== msgId) return m;
          const existing = m.reactions ?? [];
          const idx = existing.findIndex(r => r.emoji === emoji);
          let updated: Reaction[];
          if (idx === -1) {
            updated = [...existing, { emoji, count: 1, byMe: true }];
          } else if (existing[idx].byMe) {
            // toggle off
            const next = { ...existing[idx], count: existing[idx].count - 1, byMe: false };
            updated = next.count <= 0 ? existing.filter((_, i) => i !== idx) : existing.map((r, i) => i === idx ? next : r);
          } else {
            updated = existing.map((r, i) => i === idx ? { ...r, count: r.count + 1, byMe: true } : r);
          }
          return { ...m, reactions: updated };
        }),
      };
    }));
    setHoveredMsgId(null);
  }, []);

  const handleStar = useCallback((contactId: string, msgId: string) => {
    setContacts(prev => prev.map(c => {
      if (c.id !== contactId) return c;
      return { ...c, messages: c.messages.map(m => m.id !== msgId ? m : { ...m, starred: !m.starred }) };
    }));
    setHoveredMsgId(null);
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setPendingListing(null);
    setReplyingTo(null);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  /* Promote sent message statuses: sent → delivered → read */
  const handleSendOffer = useCallback((offerPrice: number) => {
    if (!selectedId) return;
    const contact = contacts.find(c => c.id === selectedId);
    if (!contact) return;

    const listingMsg = [...contact.messages].reverse().find(m => m.type === 'listing' && m.listing);
    const listing = listingMsg?.listing;
    const askingNum = listing ? parseInt(listing.price.replace(/[^0-9]/g, ''), 10) : 0;

    const msgId = uuidv4();
    const offerMsg: Message = {
      id: msgId,
      content: '',
      sender: 'me',
      timestamp: new Date(),
      status: 'sent',
      type: 'offer',
      offerData: {
        listingTitle: listing?.title ?? contact.name,
        listingImage: listing?.image,
        askingPrice: askingNum,
        offerPrice,
        status: 'pending',
        expiresAt: Date.now() + OFFER_EXPIRY_MS,
      },
    };

    const contactIdSnapshot = selectedId;
    setContacts(prev => prev.map(c =>
      c.id === contactIdSnapshot
        ? { ...c, messages: [...c.messages, offerMsg], lastMessage: `💰 Offer: $${offerPrice.toLocaleString()}`, time: 'now' }
        : c
    ));
    setShowOfferModal(false);
  }, [selectedId, contacts]);

  const handleCounterOffer = useCallback((originalMsgId: string, counterPrice: number) => {
    if (!selectedId) return;
    const contactIdSnapshot = selectedId;
    const contact = contacts.find(c => c.id === selectedId);
    if (!contact) return;

    const originalOffer = contact.messages.find(m => m.id === originalMsgId);
    if (!originalOffer?.offerData) return;

    setContacts(prev => prev.map(c => {
      if (c.id !== contactIdSnapshot) return c;
      return {
        ...c,
        messages: c.messages.map(m =>
          m.id === originalMsgId && m.offerData
            ? { ...m, offerData: { ...m.offerData, status: 'countered' as const } }
            : m
        ),
      };
    }));

    const counterMsgId = uuidv4();
    const counterMsg: Message = {
      id: counterMsgId,
      content: '',
      sender: 'me',
      timestamp: new Date(),
      status: 'sent',
      type: 'offer',
      offerData: {
        listingTitle: originalOffer.offerData.listingTitle,
        listingImage: originalOffer.offerData.listingImage,
        askingPrice: originalOffer.offerData.askingPrice,
        offerPrice: counterPrice,
        status: 'pending',
        isCounter: true,
        expiresAt: Date.now() + OFFER_EXPIRY_MS,
      },
    };

    setContacts(prev => prev.map(c =>
      c.id === contactIdSnapshot
        ? { ...c, messages: [...c.messages, counterMsg], lastMessage: `💬 Counter: $${counterPrice.toLocaleString()}`, time: 'now' }
        : c
    ));
    setShowCounterModal(false);
    setCounteringMsgId(null);
  }, [selectedId, contacts]);

  const handleSend = () => {
    const text = input.trim();
    if ((!text && !pendingListing) || !selectedId) return;

    const msgId = uuidv4();
    const quoted = replyingTo ? { id: replyingTo.id, content: replyingTo.content, sender: replyingTo.sender } : undefined;
    const msg: Message = pendingListing && !text
      ? { id: msgId, content: '', sender: 'me', timestamp: new Date(), status: 'sent', type: 'listing', listing: pendingListing }
      : { id: msgId, content: text, sender: 'me', timestamp: new Date(), status: 'sent', type: 'text', ...(quoted ? { quotedMsg: quoted } : {}) };

    const lastMsg = pendingListing && !text ? `Re: ${pendingListing.title}` : text;
    const contactIdSnapshot = selectedId;

    setPendingListing(null);
    setReplyingTo(null);
    setContacts(prev => prev.map(c => c.id === contactIdSnapshot ? { ...c, messages: [...c.messages, msg], lastMessage: lastMsg, time: 'now' } : c));
    setInput('');

    /* Emit to Socket.IO so other real users in this room receive the message */
    getSocket().emit('send-message', { roomId: contactIdSnapshot, message: { id: msgId, content: lastMsg, roomId: contactIdSnapshot } });

  };

  const offerModalListing = useMemo(() => {
    if (!selected) return null;
    const listingMsg = [...selected.messages].reverse().find(m => m.type === 'listing' && m.listing);
    const listing = listingMsg?.listing;
    return {
      title: listing?.title ?? selected.name,
      price: listing?.price ?? '$0',
      image: listing?.image,
    };
  }, [selected]);

  const showList = !isMobile || !selectedId;
  const showChat = !isMobile || !!selectedId;

  const lastReadMsgId = selected
    ? [...selected.messages].reverse().find(m => m.sender === 'me' && m.status === 'read')?.id ?? null
    : null;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden relative" style={{ backgroundColor: '#FAFAF7' }}>

      {/* ── Contact List ── */}
      {showList && (
        <div
          className={cn('flex flex-col shrink-0 border-r overflow-hidden', isMobile ? 'w-full' : 'w-[300px]')}
          style={{ backgroundColor: '#ffffff', borderColor: '#E8E2D8' }}
        >
          {/* Header */}
          <div className="px-5 pt-6 pb-4 border-b shrink-0" style={{ borderColor: '#E8E2D8' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>Messages</h2>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: '#6E7A8A' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; (e.currentTarget as HTMLElement).style.color = '#0F1923'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; }}
              >
                <Edit2 size={15} />
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#6E7A8A' }} />
              <Input
                placeholder="Search…"
                className="pl-9 h-9 text-sm rounded-lg border focus-visible:ring-1"
                style={{ backgroundColor: '#F5F2EC', borderColor: '#E8E2D8', color: '#0F1923' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="py-2">
              {filtered.length > 0 ? filtered.map(c => {
                const catStyle = CAT_STYLE[c.category] ?? { bg: '#F5F2EC', text: '#6E7A8A' };
                const isActive = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors overflow-hidden"
                    style={{ backgroundColor: isActive ? '#F0EBE1' : undefined }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={c.avatar} />
                        <AvatarFallback style={{ backgroundColor: '#E8E2D8', color: '#1A3353', fontSize: '12px', fontWeight: 600 }}>
                          {c.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-sm truncate min-w-0" style={{ color: '#0F1923' }}>
                          {search.trim() ? (() => {
                            const q = search.trim().toLowerCase();
                            const idx = c.name.toLowerCase().indexOf(q);
                            if (idx === -1) return c.name;
                            return (<>
                              {c.name.slice(0, idx)}
                              <mark style={{ backgroundColor: 'rgba(201,169,110,0.25)', color: '#C9A96E', fontWeight: 700, borderRadius: 2, padding: '0 1px' }}>
                                {c.name.slice(idx, idx + q.length)}
                              </mark>
                              {c.name.slice(idx + q.length)}
                            </>);
                          })() : c.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span className="text-[11px] whitespace-nowrap" style={{ color: '#6E7A8A' }}>{c.time}</span>
                          {c.unread > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: '#C9A96E', color: '#0F1923' }}>
                              {c.unread}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, overflow: 'hidden' }}>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 uppercase tracking-wide" style={{ backgroundColor: catStyle.bg, color: catStyle.text }}>
                          {c.category}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: '1 1 0' }}>
                            {/* Delivery tick — only for messages sent by me */}
                            {c.messages.length > 0 && c.messages[c.messages.length - 1].sender === 'me' && (() => {
                              const status = c.messages[c.messages.length - 1].status;
                              if (status === 'sent') return (
                                <svg style={{ flexShrink: 0 }} width="14" height="10" viewBox="0 0 14 10" fill="none">
                                  <path d="M1 5l3.5 3.5L12 1" stroke="#6E7A8A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              );
                              if (status === 'delivered') return (
                                <svg style={{ flexShrink: 0 }} width="18" height="10" viewBox="0 0 18 10" fill="none">
                                  <path d="M1 5l3.5 3.5L12 1" stroke="#6E7A8A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M5 5l3.5 3.5L16 1" stroke="#6E7A8A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              );
                              if (status === 'read') return (
                                <svg style={{ flexShrink: 0 }} width="18" height="10" viewBox="0 0 18 10" fill="none">
                                  <path d="M1 5l3.5 3.5L12 1" stroke="#3B82F6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M5 5l3.5 3.5L16 1" stroke="#3B82F6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              );
                              return null;
                            })()}
                            <p style={{
                              fontSize: 12,
                              color: '#6E7A8A',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0,
                              flex: '1 1 0',
                              margin: 0,
                            }}>
                              {search.trim()
                                ? (() => {
                                    const q = search.trim().toLowerCase();
                                    const msg = c.lastMessage;
                                    const idx = msg.toLowerCase().indexOf(q);
                                    if (idx === -1) return msg;
                                    return (
                                      <>
                                        {msg.slice(0, idx)}
                                        <mark style={{ backgroundColor: 'rgba(201,169,110,0.25)', color: '#C9A96E', fontWeight: 600, borderRadius: 2, padding: '0 1px' }}>
                                          {msg.slice(idx, idx + q.length)}
                                        </mark>
                                        {msg.slice(idx + q.length)}
                                      </>
                                    );
                                  })()
                                : c.lastMessage
                              }
                            </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              }) : (
                <div className="py-12 text-center text-sm" style={{ color: '#6E7A8A' }}>No conversations found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Chat Panel ── */}
      {showChat && (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ backgroundColor: '#FAFAF7' }}>
          {selected ? (
            <>
              {/* Chat header */}
              <header
                className="shrink-0 flex flex-col justify-center px-5 border-b transition-all"
                style={{ borderColor: '#E8E2D8', backgroundColor: '#ffffff', minHeight: showMsgSearch ? 108 : 68 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isMobile && (
                      <button
                        className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: '#6E7A8A' }}
                        onClick={() => setSelectedId(null)}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
                      >
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <div
                      className="relative cursor-pointer"
                      onClick={() => navigate(`/dashboard/seller/${encodeURIComponent(selected.name)}`)}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={selected.avatar} />
                        <AvatarFallback style={{ backgroundColor: '#E8E2D8', color: '#1A3353', fontSize: '11px', fontWeight: 600 }}>
                          {selected.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(`/dashboard/seller/${encodeURIComponent(selected.name)}`)}
                    >
                      <p className="font-semibold text-sm hover:underline" style={{ color: '#0F1923', letterSpacing: '-0.01em' }}>{selected.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Starred messages toggle */}
                    <button
                      className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: showStarred ? '#C9A96E' : '#6E7A8A', backgroundColor: showStarred ? '#F0EBE1' : undefined }}
                      onClick={() => setShowStarred(v => !v)}
                      onMouseEnter={e => { if (!showStarred) { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; (e.currentTarget as HTMLElement).style.color = '#C9A96E'; } }}
                      onMouseLeave={e => { if (!showStarred) { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; } }}
                      title="Starred messages"
                    >
                      <Star size={16} fill={showStarred ? '#C9A96E' : 'none'} />
                    </button>
                    {/* Search toggle */}
                    <button
                      className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: showMsgSearch ? '#C9A96E' : '#6E7A8A', backgroundColor: showMsgSearch ? '#F0EBE1' : undefined }}
                      onClick={() => setShowMsgSearch(v => !v)}
                      onMouseEnter={e => { if (!showMsgSearch) { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; (e.currentTarget as HTMLElement).style.color = '#0F1923'; } }}
                      onMouseLeave={e => { if (!showMsgSearch) { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; } }}
                    >
                      <Search size={16} />
                    </button>
                    <button
                      className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: '#6E7A8A' }}
                      title="View profile"
                      onClick={() => navigate(`/dashboard/seller/${encodeURIComponent(selected.name)}`)}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; (e.currentTarget as HTMLElement).style.color = '#0F1923'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; }}
                    >
                      <Info size={16} />
                    </button>
                    <button
                      className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: '#6E7A8A' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; (e.currentTarget as HTMLElement).style.color = '#0F1923'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {/* Inline search bar */}
                {showMsgSearch && (
                  <div className="flex items-center gap-2 mt-3 mb-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: '#6E7A8A' }} />
                      <input
                        ref={msgSearchInputRef}
                        type="text"
                        placeholder="Search in conversation…"
                        value={msgSearch}
                        onChange={e => setMsgSearch(e.target.value)}
                        onKeyDown={e => {
                          if (!msgSearchMatches.length) return;
                          if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); setMsgSearchIdx(i => (i + 1) % msgSearchMatches.length); }
                          if (e.key === 'ArrowUp') { e.preventDefault(); setMsgSearchIdx(i => (i - 1 + msgSearchMatches.length) % msgSearchMatches.length); }
                          if (e.key === 'Escape') setShowMsgSearch(false);
                        }}
                        className="w-full pl-9 pr-4 h-8 text-sm rounded-lg outline-none border"
                        style={{ backgroundColor: '#F5F2EC', borderColor: '#E8E2D8', color: '#0F1923' }}
                      />
                    </div>
                    {/* Match counter */}
                    {msgSearch.trim() && (
                      <span className="text-xs shrink-0 tabular-nums" style={{ color: '#6E7A8A', minWidth: 48 }}>
                        {msgSearchMatches.length === 0 ? 'No results' : `${msgSearchIdx + 1} / ${msgSearchMatches.length}`}
                      </span>
                    )}
                    {/* Prev / Next */}
                    {msgSearchMatches.length > 0 && (
                      <>
                        <button
                          className="h-7 w-7 rounded flex items-center justify-center transition-colors"
                          style={{ color: '#6E7A8A' }}
                          onClick={() => setMsgSearchIdx(i => (i - 1 + msgSearchMatches.length) % msgSearchMatches.length)}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          className="h-7 w-7 rounded flex items-center justify-center transition-colors"
                          style={{ color: '#6E7A8A' }}
                          onClick={() => setMsgSearchIdx(i => (i + 1) % msgSearchMatches.length)}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
                        >
                          <ChevronDown size={15} />
                        </button>
                      </>
                    )}
                    <button
                      className="h-7 w-7 rounded flex items-center justify-center transition-colors shrink-0"
                      style={{ color: '#6E7A8A' }}
                      onClick={() => setShowMsgSearch(false)}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                )}
              </header>

              {/* ── Starred Messages Panel ── */}
              {showStarred && (() => {
                const starredMsgs = selected.messages.filter(m => m.starred);
                return (
                  <div
                    className="absolute inset-x-0 bottom-0 z-30 flex flex-col"
                    style={{
                      top: showMsgSearch ? 108 : 68,
                      backgroundColor: '#FAFAF7',
                    }}
                  >
                    {/* Panel header */}
                    <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#E8E2D8', backgroundColor: '#ffffff' }}>
                      <div className="flex items-center gap-2">
                        <Star size={15} fill="#C9A96E" style={{ color: '#C9A96E' }} />
                        <span className="font-semibold text-sm" style={{ color: '#0F1923', letterSpacing: '-0.01em' }}>Starred Messages</span>
                        {starredMsgs.length > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#F0EBE1', color: '#C9A96E' }}>
                            {starredMsgs.length}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowStarred(false)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: '#6E7A8A' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                      >
                        <XIcon size={15} />
                      </button>
                    </div>

                    {/* Panel body */}
                    {starredMsgs.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-3 pb-16">
                        <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#F0EBE1' }}>
                          <Star size={26} style={{ color: '#C9A96E' }} />
                        </div>
                        <p className="font-semibold text-sm" style={{ color: '#0F1923' }}>No starred messages yet</p>
                        <p className="text-xs text-center max-w-[220px]" style={{ color: '#6E7A8A' }}>
                          Hover or long-press a message, then tap ★ to save it here.
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                        {starredMsgs.map(m => {
                          const isMe = m.sender === 'me';
                          return (
                            <div key={m.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E8E2D8', backgroundColor: '#ffffff', boxShadow: '0 1px 4px rgba(15,25,35,0.06)' }}>
                              {/* Card header */}
                              <div className="flex items-center justify-between px-3.5 py-2 border-b" style={{ borderColor: '#F0EBE1', backgroundColor: '#FAFAF7' }}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={isMe ? undefined : selected.avatar} />
                                    <AvatarFallback style={{ backgroundColor: '#E8E2D8', color: '#1A3353', fontSize: '8px', fontWeight: 700 }}>
                                      {isMe ? 'Me' : selected.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-semibold" style={{ color: '#0F1923' }}>{isMe ? 'You' : selected.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px]" style={{ color: '#6E7A8A' }}>{format(m.timestamp, 'MMM d, HH:mm')}</span>
                                  <button
                                    onClick={() => handleStar(selected.id, m.id)}
                                    className="h-5 w-5 rounded flex items-center justify-center transition-colors"
                                    style={{ color: '#C9A96E' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F0EBE1'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                                    title="Unstar"
                                  >
                                    <Star size={11} fill="#C9A96E" />
                                  </button>
                                </div>
                              </div>
                              {/* Card body */}
                              <div className="px-3.5 py-2.5">
                                {m.type === 'image' && m.media ? (
                                  <img src={m.media} alt="starred" className="rounded-lg max-h-40 object-cover w-full" />
                                ) : m.type === 'audio' ? (
                                  <p className="text-sm flex items-center gap-1.5" style={{ color: '#6E7A8A' }}>🎤 <span className="italic">Audio message</span></p>
                                ) : (
                                  <p className="text-sm leading-relaxed break-words" style={{ color: '#0F1923' }}>{m.content}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Messages */}
              <ScrollArea className="flex-1">
                <div className="px-2 py-6 flex flex-col gap-1">
                  {/* Contact intro */}
                  <div className="flex flex-col items-center py-8 mb-4">
                    <Avatar className="h-18 w-18 mb-4" style={{ width: 72, height: 72, border: '3px solid #E8E2D8' }}>
                      <AvatarImage src={selected.avatar} />
                      <AvatarFallback className="text-2xl" style={{ backgroundColor: '#E8E2D8', color: '#1A3353', fontWeight: 700 }}>
                        {selected.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold mb-1" style={{ color: '#0F1923', letterSpacing: '-0.03em' }}>{selected.name}</h3>
                    <p className="text-xs mb-3" style={{ color: '#6E7A8A' }}>Start of conversation with {selected.name}</p>
                    <span
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest"
                      style={{ backgroundColor: CAT_STYLE[selected.category]?.bg ?? '#F5F2EC', color: CAT_STYLE[selected.category]?.text ?? '#6E7A8A' }}
                    >
                      {selected.category}
                    </span>
                  </div>

                  {selected.messages.map((msg, _msgIdx) => {
                    const isMe = msg.sender === 'me';
                    const isHovered = hoveredMsgId === msg.id;
                    const hasReactions = msg.reactions && msg.reactions.length > 0;
                    const isLastRead = isMe && msg.id === lastReadMsgId;
                    const matchPos = msgSearchMatches.indexOf(msg.id);
                    const isMatch = matchPos !== -1;
                    const isCurrentMatch = isMatch && matchPos === msgSearchIdx;

                    return (
                      <React.Fragment key={msg.id}>
                      <div
                        ref={el => { if (el) msgRefs.current.set(msg.id, el); else msgRefs.current.delete(msg.id); }}
                        className={cn('flex w-full mb-1.5 relative', isMe ? 'justify-end' : 'justify-start')}
                        style={{ marginBottom: hasReactions ? '18px' : undefined, willChange: 'transform' }}
                        onTouchStart={e => {
                          const touch = e.touches[0];
                          swipeTouchRef.current = { startX: touch.clientX, startY: touch.clientY, msgId: msg.id, el: e.currentTarget as HTMLDivElement, hapticFired: false };
                        }}
                        onTouchMove={e => {
                          if (!swipeTouchRef.current || swipeTouchRef.current.msgId !== msg.id) return;
                          const touch = e.touches[0];
                          const dx = touch.clientX - swipeTouchRef.current.startX;
                          const dy = Math.abs(touch.clientY - swipeTouchRef.current.startY);
                          if (dx > 0 && dx > dy * 1.3) {
                            const offset = Math.min(dx * 0.65, 72);
                            swipeTouchRef.current.el.style.transition = 'none';
                            swipeTouchRef.current.el.style.transform = `translateX(${offset}px)`;
                            const triggered = offset >= 55;
                            if (triggered && !swipeTouchRef.current.hapticFired) {
                              swipeTouchRef.current.hapticFired = true;
                              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
                            }
                            const icon = swipeTouchRef.current.el.querySelector('.swipe-reply-icon') as HTMLElement | null;
                            if (icon) {
                              const progress = Math.min(offset / 55, 1);
                              icon.style.opacity = String(Math.min(progress * 1.4, 1));
                              icon.style.transform = `translateY(-50%) scale(${0.4 + progress * 0.6})`;
                              icon.style.backgroundColor = triggered ? 'rgba(201,169,110,0.2)' : 'rgba(110,122,138,0.12)';
                              const svg = icon.querySelector('svg') as SVGElement | null;
                              if (svg) svg.style.color = triggered ? '#C9A96E' : '#6E7A8A';
                            }
                          }
                        }}
                        onTouchEnd={e => {
                          if (!swipeTouchRef.current || swipeTouchRef.current.msgId !== msg.id) return;
                          const touch = e.changedTouches[0];
                          const dx = touch.clientX - swipeTouchRef.current.startX;
                          const dy = Math.abs(touch.clientY - swipeTouchRef.current.startY);
                          const el = swipeTouchRef.current.el;
                          el.style.transition = 'transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                          el.style.transform = 'translateX(0)';
                          const icon = el.querySelector('.swipe-reply-icon') as HTMLElement | null;
                          if (icon) {
                            icon.style.transition = 'opacity 0.2s ease, transform 0.2s ease, background-color 0.15s ease';
                            icon.style.opacity = '0';
                            icon.style.transform = 'translateY(-50%) scale(0.4)';
                            icon.style.backgroundColor = 'rgba(110,122,138,0.12)';
                            const svg = icon.querySelector('svg') as SVGElement | null;
                            if (svg) svg.style.color = '#6E7A8A';
                          }
                          if (dx > 55 && dx > dy * 1.5) {
                            setReplyingTo(msg);
                          }
                          swipeTouchRef.current = null;
                        }}
                      >
                        {/* Swipe-to-reply icon — revealed as message slides right */}
                        <div
                          className="swipe-reply-icon absolute top-1/2 left-3 pointer-events-none flex items-center justify-center w-8 h-8 rounded-full"
                          style={{
                            opacity: 0,
                            transform: 'translateY(-50%) scale(0.4)',
                            backgroundColor: 'rgba(110,122,138,0.12)',
                            transition: 'none',
                            zIndex: 0,
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6E7A8A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                            <polyline points="9 17 4 12 9 7" />
                            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                          </svg>
                        </div>
                        {!isMe && (
                          <Avatar className="h-7 w-7 mr-2 mt-auto shrink-0">
                            <AvatarImage src={selected.avatar} />
                            <AvatarFallback style={{ backgroundColor: '#E8E2D8', color: '#1A3353', fontSize: '10px', fontWeight: 600 }}>
                              {selected.name[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        {msg.type === 'offer' && msg.offerData ? (
                          /* ── offer card message ── */
                          <div
                            className="relative max-w-[80%]"
                            onMouseEnter={() => setHoveredMsgId(msg.id)}
                            onMouseLeave={() => setHoveredMsgId(null)}
                          >
                            <div className={cn(isMe ? 'items-end' : 'items-start')} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <p className="text-[10px] px-1" style={{ color: '#6E7A8A' }}>
                                {msg.offerData.isCounter
                                  ? (isMe ? `${selected.name} sent a counter-offer` : 'You sent a counter-offer')
                                  : (isMe ? 'You made an offer' : `${selected.name} made an offer`)}
                              </p>
                              <OfferCardMessage
                                offer={msg.offerData}
                                isMe={isMe}
                                onAccept={() => handleOfferResponse(msg.id, 'accepted')}
                                onDecline={() => handleOfferResponse(msg.id, 'declined')}
                                onCounter={() => { setCounteringMsgId(msg.id); setShowCounterModal(true); }}
                                onExpire={() => handleOfferResponse(msg.id, 'expired')}
                              />
                              <span className="text-[10px] px-1" style={{ color: '#6E7A8A' }}>
                                {format(msg.timestamp, 'HH:mm')}
                              </span>
                            </div>
                          </div>
                        ) : msg.type === 'listing' && msg.listing ? (
                          /* ── listing card message ── */
                          <div
                            className="relative max-w-[80%]"
                            onMouseEnter={() => setHoveredMsgId(msg.id)}
                            onMouseLeave={() => setHoveredMsgId(null)}
                            onTouchStart={() => { longPressTimerRef.current = setTimeout(() => setHoveredMsgId(msg.id), 500); }}
                            onTouchEnd={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                          >
                            {isHovered && (
                              <EmojiPicker isMe={isMe} onPick={emoji => handleReaction(selected.id, msg.id, emoji)} onForward={() => { setForwardingMsg(msg); setHoveredMsgId(null); }} onStar={() => handleStar(selected.id, msg.id)} isStarred={msg.starred} />
                            )}
                            <div className={cn(isMe ? 'items-end' : 'items-start')} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <p className="text-[10px] px-1" style={{ color: '#6E7A8A' }}>
                                {isMe ? 'You shared a listing' : `${selected.name} shared a listing`}
                              </p>
                              <ListingCardMessage listing={msg.listing} />
                              <span className="text-[10px] px-1" style={{ color: '#6E7A8A' }}>
                                {format(msg.timestamp, 'HH:mm')}
                              </span>
                            </div>
                            {/* Reactions */}
                            {hasReactions && (
                              <div className={cn('absolute -bottom-6 flex gap-1', isMe ? 'right-0' : 'left-0')}>
                                {msg.reactions!.map(r => (
                                  <button
                                    key={r.emoji}
                                    onClick={() => handleReaction(selected.id, msg.id, r.emoji)}
                                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold transition-all"
                                    style={{
                                      backgroundColor: r.byMe ? '#F0EBE1' : '#ffffff',
                                      border: `1px solid ${r.byMe ? '#C9A96E' : '#E8E2D8'}`,
                                      boxShadow: '0 1px 3px rgba(15,25,35,0.08)',
                                      lineHeight: 1,
                                    }}
                                  >
                                    <span>{r.emoji}</span>
                                    {r.count > 1 && <span style={{ color: '#6E7A8A', fontSize: 10 }}>{r.count}</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* ── text / image / location bubble ── */
                          <div
                            className="relative max-w-[80%]"
                            onMouseEnter={() => setHoveredMsgId(msg.id)}
                            onMouseLeave={() => setHoveredMsgId(null)}
                            onTouchStart={() => { longPressTimerRef.current = setTimeout(() => setHoveredMsgId(msg.id), 500); }}
                            onTouchEnd={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                          >
                            {isHovered && (
                              <EmojiPicker isMe={isMe} onPick={emoji => handleReaction(selected.id, msg.id, emoji)} onForward={() => { setForwardingMsg(msg); setHoveredMsgId(null); }} onStar={() => handleStar(selected.id, msg.id)} isStarred={msg.starred} />
                            )}
                            <div
                              className={cn('px-4 py-2.5 rounded-2xl', isMe ? 'rounded-tr-sm' : 'rounded-tl-sm')}
                              style={{
                                backgroundColor: isMe ? '#1A3353' : '#ffffff',
                                color: isMe ? '#ffffff' : '#0F1923',
                                border: isCurrentMatch
                                  ? '2px solid #C9A96E'
                                  : isMatch
                                  ? `1px solid ${isMe ? 'rgba(201,169,110,0.5)' : '#C9A96E88'}`
                                  : isMe ? 'none' : '1px solid #E8E2D8',
                                boxShadow: isCurrentMatch
                                  ? '0 0 0 3px rgba(201,169,110,0.25)'
                                  : isMe ? 'none' : '0 1px 3px rgba(15,25,35,0.04)',
                                transition: 'box-shadow 0.2s, border 0.2s',
                              }}
                            >
                              {msg.quotedMsg && (
                                <div
                                  className="mb-2 px-2.5 py-1.5 rounded-lg"
                                  style={{
                                    backgroundColor: isMe ? 'rgba(255,255,255,0.12)' : '#F5F2EC',
                                    borderLeft: `3px solid ${isMe ? 'rgba(255,255,255,0.45)' : '#C9A96E'}`,
                                  }}
                                >
                                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: isMe ? 'rgba(255,255,255,0.7)' : '#C9A96E' }}>
                                    {msg.quotedMsg.sender === 'me' ? 'You' : selected.name}
                                  </p>
                                  <p className="text-[11px] leading-snug line-clamp-2" style={{ color: isMe ? 'rgba(255,255,255,0.6)' : '#6E7A8A' }}>
                                    {msg.quotedMsg.content}
                                  </p>
                                </div>
                              )}
                            {msg.isForwarded && (
                                <div className="flex items-center gap-1 mb-1" style={{ opacity: 0.65 }}>
                                  <Forward size={10} style={{ color: isMe ? 'rgba(255,255,255,0.75)' : '#6E7A8A' }} />
                                  <span className="text-[10px] italic" style={{ color: isMe ? 'rgba(255,255,255,0.75)' : '#6E7A8A' }}>Forwarded</span>
                                </div>
                              )}
                            {msg.starred && (
                                <Star size={9} fill="#C9A96E" style={{ color: '#C9A96E', position: 'absolute', top: 6, right: isMe ? 6 : undefined, left: isMe ? undefined : 6, opacity: 0.85 }} />
                              )}
                              {msg.type === 'audio' && msg.audioUrl && (
                                <AudioMessage url={msg.audioUrl} duration={msg.audioDuration ?? 0} isMe={isMe} />
                              )}
                              {msg.type === 'text' && (
                                <p className="text-sm leading-relaxed break-words">
                                  {highlightText(msg.content, msgSearch)}
                                </p>
                              )}
                              {msg.type === 'image' && msg.media && (
                                <img src={msg.media} alt="" className="rounded-xl max-w-full max-h-48 object-cover mb-1" />
                              )}
                              {msg.type === 'location' && (
                                <div className="flex items-center gap-2 py-0.5">
                                  <MapPin size={14} style={{ color: '#C9A96E' }} />
                                  <span className="text-sm">Shared a location</span>
                                </div>
                              )}
                              <div className={cn('flex items-center gap-1 mt-1', isMe ? 'justify-end' : 'justify-start')}>
                                <span className="text-[10px]" style={{ color: isMe ? 'rgba(255,255,255,0.5)' : '#6E7A8A' }}>
                                  {format(msg.timestamp, 'HH:mm')}
                                </span>
                                {isMe && (
                                  msg.status === 'read'
                                    ? <CheckCheck size={12} style={{ color: '#C9A96E' }} />
                                    : msg.status === 'delivered'
                                    ? <CheckCheck size={12} style={{ color: 'rgba(255,255,255,0.45)' }} />
                                    : <Check size={12} style={{ color: 'rgba(255,255,255,0.45)' }} />
                                )}
                              </div>
                            </div>
                            {/* Reactions */}
                            {hasReactions && (
                              <div className={cn('absolute -bottom-6 flex gap-1', isMe ? 'right-0' : 'left-0')}>
                                {msg.reactions!.map(r => (
                                  <button
                                    key={r.emoji}
                                    onClick={() => handleReaction(selected.id, msg.id, r.emoji)}
                                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold transition-all hover:scale-110"
                                    style={{
                                      backgroundColor: r.byMe ? '#F0EBE1' : '#ffffff',
                                      border: `1px solid ${r.byMe ? '#C9A96E' : '#E8E2D8'}`,
                                      boxShadow: '0 1px 3px rgba(15,25,35,0.08)',
                                      lineHeight: 1,
                                    }}
                                  >
                                    <span>{r.emoji}</span>
                                    {r.count > 1 && <span style={{ color: '#6E7A8A', fontSize: 10 }}>{r.count}</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {isLastRead && (
                        <div className="flex justify-end pr-1 -mt-0.5 mb-2">
                          <div className="flex items-center gap-1">
                            <Avatar className="h-3.5 w-3.5">
                              <AvatarImage src={selected.avatar} />
                              <AvatarFallback style={{ backgroundColor: '#E8E2D8', color: '#1A3353', fontSize: '6px', fontWeight: 700 }}>
                                {selected.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] tabular-nums" style={{ color: '#6E7A8A' }}>
                              Seen
                            </span>
                          </div>
                        </div>
                      )}
                      </React.Fragment>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              {/* Pending listing attachment */}
              {pendingListing && (
                <PendingListingAttachment listing={pendingListing} onRemove={() => setPendingListing(null)} />
              )}

              {/* Input bar */}
              <div className="shrink-0 border-t" style={{ backgroundColor: '#ffffff', borderColor: '#E8E2D8' }}>
              {replyingTo && (
                <div className="flex items-start gap-2.5 px-4 pt-3 pb-2.5 border-b" style={{ borderColor: '#E8E2D8', backgroundColor: '#FAFAF7' }}>
                  <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: '#C9A96E' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#C9A96E' }}>
                      {replyingTo.sender === 'me' ? 'You' : selected?.name}
                    </p>
                    <p className="text-xs leading-snug line-clamp-2" style={{ color: '#6E7A8A' }}>
                      {replyingTo.type === 'image' ? '📷 Photo' : replyingTo.type === 'audio' ? '🎤 Audio' : replyingTo.content}
                    </p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="shrink-0 h-5 w-5 rounded-full flex items-center justify-center transition-colors mt-0.5"
                    style={{ color: '#6E7A8A', backgroundColor: '#F0EBE1' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#E8D9BC'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F0EBE1'; }}
                  >
                    <XIcon size={10} />
                  </button>
                </div>
              )}
              <div className="p-4 px-5">
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-shadow focus-within:border-[#C9A96E]"
                    style={{ backgroundColor: '#FAFAF7', borderColor: '#E8E2D8' }}
                  >
                    <button
                      className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: '#6E7A8A' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#0F1923'; (e.currentTarget as HTMLElement).style.backgroundColor = '#F0EBE1'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                    >
                      <PlusCircle size={17} />
                    </button>
                    <button
                      className="h-8 w-8 shrink-0 rounded-lg hidden sm:flex items-center justify-center transition-colors"
                      style={{ color: '#6E7A8A' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#0F1923'; (e.currentTarget as HTMLElement).style.backgroundColor = '#F0EBE1'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                    >
                      <Paperclip size={15} />
                    </button>
                    <Input
                      placeholder={pendingListing ? `Add a message about "${pendingListing.title}"…` : `Message ${selected.name}…`}
                      className="flex-1 h-9 border-none bg-transparent px-0 focus-visible:ring-0 text-sm"
                      style={{ color: '#0F1923' }}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    />
                    <button
                      className="h-8 w-8 shrink-0 rounded-lg hidden sm:flex items-center justify-center transition-colors"
                      style={{ color: '#6E7A8A' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#0F1923'; (e.currentTarget as HTMLElement).style.backgroundColor = '#F0EBE1'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6E7A8A'; (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                    >
                      <Smile size={15} />
                    </button>

                    {/* Make an Offer button — Marketplace conversations only */}
                    {selected.category === 'Marketplace' && (
                      <button
                        onClick={() => setShowOfferModal(true)}
                        className="h-8 shrink-0 px-2.5 rounded-lg hidden sm:flex items-center gap-1.5 text-xs font-semibold transition-all"
                        style={{ backgroundColor: '#F0EBE1', color: '#1A3353', border: '1px solid #E8D9BC' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'; (e.currentTarget as HTMLElement).style.color = '#ffffff'; (e.currentTarget as HTMLElement).style.borderColor = '#1A3353'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F0EBE1'; (e.currentTarget as HTMLElement).style.color = '#1A3353'; (e.currentTarget as HTMLElement).style.borderColor = '#E8D9BC'; }}
                        title="Make an Offer"
                      >
                        <DollarSign size={12} /> Offer
                      </button>
                    )}

                    <button
                      className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: (input.trim() || pendingListing) ? '#1A3353' : 'transparent',
                        color: (input.trim() || pendingListing) ? '#ffffff' : '#6E7A8A',
                      }}
                      onClick={handleSend}
                      disabled={!input.trim() && !pendingListing}
                      onMouseEnter={e => { if (input.trim() || pendingListing) (e.currentTarget as HTMLElement).style.backgroundColor = '#142842'; }}
                      onMouseLeave={e => { if (input.trim() || pendingListing) (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3353'; }}
                    >
                      <Send size={14} />
                    </button>
                  </div>
              </div>
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      )}
      {forwardingMsg && selected && (
        <ForwardModal
          contacts={contacts}
          currentContactId={selected.id}
          onForward={handleForward}
          onClose={() => setForwardingMsg(null)}
        />
      )}

      {showOfferModal && offerModalListing && (
        <OfferModal
          listing={offerModalListing}
          onSend={handleSendOffer}
          onClose={() => setShowOfferModal(false)}
        />
      )}

      {showCounterModal && counteringMsgId && (() => {
        const offerMsg = selected?.messages.find(m => m.id === counteringMsgId);
        return offerMsg?.offerData ? (
          <CounterOfferModal
            offer={offerMsg.offerData}
            onSend={(counterPrice) => handleCounterOffer(counteringMsgId, counterPrice)}
            onClose={() => { setShowCounterModal(false); setCounteringMsgId(null); }}
          />
        ) : null;
      })()}
    </div>
  );
};

export default MessagesSection;
