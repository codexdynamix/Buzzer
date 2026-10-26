import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MessageCircle, Copy, Check, ExternalLink } from 'lucide-react';

interface ContactModalProps {
  sellerName: string;
  phone?: string;
  whatsapp?: boolean;
  viber?: boolean;
  telegram?: boolean;
  onClose: () => void;
}

const PLATFORMS = [
  {
    key: 'whatsapp' as const,
    label: 'WhatsApp',
    color: '#25D366',
    bg: '#F0FFF4',
    border: '#9AE6B4',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    getUrl: (phone: string) => `https://wa.me/${phone.replace(/[^0-9]/g, '')}`,
  },
  {
    key: 'viber' as const,
    label: 'Viber',
    color: '#7360F2',
    bg: '#F5F3FF',
    border: '#C4B5FD',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M11.4 0C5.9.3.4 4.9.1 11c-.2 3 .5 5.9 2.1 8.4l.5.8L.5 24l3.7-1.3.8.4c2.3 1.3 5 2 7.7 1.9 6.2-.1 11.4-4.8 11.9-11 .5-7.1-5.3-13.5-13.2-14zm5.8 17.9l-.6.7c-.5.6-1.2 1-2 1.1-.8.1-1.7-.1-2.5-.5-2.5-1.1-4.7-2.9-6.4-5.2-1.1-1.5-1.9-3.2-2.1-5.1-.1-1 .3-2.1 1.1-2.8l.7-.6c.3-.3.8-.3 1.1 0l1.7 1.7c.3.3.3.8.1 1.1l-.8 1c-.2.3-.2.7 0 1 .5 1.1 1.3 2.1 2.2 2.9.9.8 1.9 1.5 3 2 .3.1.7.1 1-.1l1-1c.3-.3.8-.3 1.1 0l1.7 1.8c.3.3.2.8-.3 1z" />
      </svg>
    ),
    getUrl: (phone: string) => `viber://chat?number=${phone.replace(/[^0-9]/g, '')}`,
  },
  {
    key: 'telegram' as const,
    label: 'Telegram',
    color: '#229ED9',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    getUrl: (phone: string) => `https://t.me/${phone.replace(/[^0-9+]/g, '')}`,
  },
];

export default function ContactModal({ sellerName, phone, whatsapp, viber, telegram, onClose }: ContactModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!phone) return;
    navigator.clipboard?.writeText(phone).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const platformFlags = { whatsapp, viber, telegram };
  const availablePlatforms = PLATFORMS.filter(p => platformFlags[p.key]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15,25,35,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ backgroundColor: '#ffffff', border: '1px solid #E8E2D8' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: '#1A3353' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#C9A96E', color: '#0F1923' }}>
              {sellerName[0]}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#fff' }}>{sellerName}</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>Contact info</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Phone number */}
          {phone ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6E7A8A' }}>Phone Number</p>
              <div
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ backgroundColor: '#F9F7F4', border: '1px solid #E8E2D8' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F0EBE1' }}>
                    <Phone size={14} style={{ color: '#C9A96E' }} />
                  </div>
                  <span className="font-semibold text-sm tracking-wide" style={{ color: '#0F1923' }}>{phone}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: copied ? '#F0FDF4' : '#F0EBE1',
                    color: copied ? '#15803D' : '#1A3353',
                    border: `1px solid ${copied ? '#BBF7D0' : '#E8D9BC'}`,
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm" style={{ color: '#6E7A8A' }}>No phone number listed</p>
            </div>
          )}

          {/* Platforms */}
          {availablePlatforms.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6E7A8A' }}>Also reachable on</p>
              <div className="space-y-2">
                {availablePlatforms.map(platform => (
                  <a
                    key={platform.key}
                    href={phone ? platform.getUrl(phone) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl transition-all"
                    style={{
                      backgroundColor: platform.bg,
                      border: `1px solid ${platform.border}`,
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: platform.color, color: '#fff' }}
                      >
                        {platform.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#0F1923' }}>{platform.label}</p>
                        <p className="text-[11px]" style={{ color: '#6E7A8A' }}>Available on {platform.label}</p>
                      </div>
                    </div>
                    <ExternalLink size={13} style={{ color: '#6E7A8A' }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {availablePlatforms.length === 0 && !phone && (
            <div className="text-center py-6 space-y-2">
              <MessageCircle size={32} style={{ color: '#E8E2D8', margin: '0 auto' }} />
              <p className="text-sm font-medium" style={{ color: '#0F1923' }}>Contact via chat</p>
              <p className="text-xs" style={{ color: '#6E7A8A' }}>This seller prefers in-app messaging.</p>
            </div>
          )}

          {/* Footer note */}
          <p className="text-[11px] text-center" style={{ color: '#B0B8C4' }}>
            Contact info verified by Buzzer. Always meet in safe public places.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
