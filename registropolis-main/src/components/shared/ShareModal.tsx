import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, Link } from 'lucide-react';

interface ShareModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

const SHARE_OPTIONS = [
  {
    label: 'WhatsApp',
    color: '#25D366',
    bg: '#F0FFF4',
    border: '#9AE6B4',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    getUrl: (url: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
  },
  {
    label: 'Telegram',
    color: '#229ED9',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    getUrl: (url: string, title: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    label: 'Twitter / X',
    color: '#000000',
    bg: '#F9FAFB',
    border: '#E5E7EB',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    getUrl: (url: string, title: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    label: 'Facebook',
    color: '#1877F2',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    getUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
];

export default function ShareModal({ url, title, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(15,25,35,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative w-full sm:max-w-sm mx-0 sm:mx-4 overflow-hidden"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #E8E2D8',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 40px rgba(15,25,35,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full" style={{ backgroundColor: '#E8E2D8' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #F0EBE1' }}>
          <p className="font-bold text-sm" style={{ color: '#0F1923' }}>Share listing</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: '#F5F2EC', color: '#6E7A8A' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EDE8DF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F2EC'; }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Title preview */}
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #F0EBE1' }}>
          <p className="text-xs font-medium line-clamp-1" style={{ color: '#6E7A8A' }}>Sharing:</p>
          <p className="text-sm font-semibold line-clamp-1 mt-0.5" style={{ color: '#0F1923' }}>{title}</p>
        </div>

        {/* Platform grid */}
        <div className="grid grid-cols-4 gap-3 px-5 py-4">
          {SHARE_OPTIONS.map(opt => (
            <a
              key={opt.label}
              href={opt.getUrl(url, title)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 group"
              style={{ textDecoration: 'none' }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ backgroundColor: opt.color, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
              >
                {opt.icon}
              </div>
              <span className="text-[10px] font-medium text-center" style={{ color: '#6E7A8A' }}>{opt.label}</span>
            </a>
          ))}
        </div>

        {/* Copy link */}
        <div className="px-5 pb-5">
          <div
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
            style={{ backgroundColor: '#F9F7F4', border: '1px solid #E8E2D8' }}
            onClick={handleCopy}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#F0EBE1' }}>
              {copied ? <Check size={14} style={{ color: '#15803D' }} /> : <Link size={14} style={{ color: '#C9A96E' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: copied ? '#15803D' : '#0F1923' }}>
                {copied ? 'Link copied!' : 'Copy link'}
              </p>
              <p className="text-[10px] truncate" style={{ color: '#B0B8C4' }}>{url}</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: copied ? '#F0FDF4' : '#F0EBE1', color: copied ? '#15803D' : '#1A3353' }}>
              {copied ? '✓' : 'Copy'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
