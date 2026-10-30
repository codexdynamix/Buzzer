import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Bell, X, Check, CheckCheck, MessageCircle, ShoppingBag, Briefcase, Calendar, Trash2, type LucideIcon } from 'lucide-react';
import { useNotifications, AppNotification, NotificationType } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { useLocalization } from '@/i18n/LocalizationContext';

const TYPE_CONFIG: Record<NotificationType, { icon: LucideIcon; color: string; bg: string }> = {
  message:     { icon: MessageCircle, color: '#1A3353', bg: '#EEF4FF' },
  marketplace: { icon: ShoppingBag,   color: '#C2410C', bg: '#FFF7ED' },
  job:         { icon: Briefcase,     color: '#15803D', bg: '#F0FDF4' },
  event:       { icon: Calendar,      color: '#7C3AED', bg: '#F5F3FF' },
};

const panelVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.95, y: -8 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit:    { opacity: 0, scale: 0.96, y: -6, transition: { duration: 0.14, ease: 'easeIn' } },
};

const itemVariants: Variants = {
  hidden:  { opacity: 0, x: 12 },
  visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.2 } }),
};

const NotificationItem: React.FC<{ n: AppNotification; index: number; onRead: () => void; onDismiss: () => void }> = ({ n, index, onRead, onDismiss }) => {
  const cfg = TYPE_CONFIG[n.type];
  const Icon = cfg.icon;
  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      layout
      exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
      onClick={onRead}
      className="relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group"
      style={{ backgroundColor: n.read ? 'transparent' : 'rgba(201,169,110,0.05)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = n.read ? 'transparent' : 'rgba(201,169,110,0.05)'; }}
    >
      {/* Avatar / Icon */}
      {n.avatar ? (
        <div className="relative shrink-0">
          <img src={n.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: cfg.bg, border: '1.5px solid #111922' }}
          >
            <Icon size={8} style={{ color: cfg.color }} />
          </div>
        </div>
      ) : (
        <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center" style={{ background: cfg.bg }}>
          <Icon size={15} style={{ color: cfg.color }} />
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[12px] font-semibold truncate" style={{ color: '#FAFAF7' }}>{n.title}</span>
          {!n.read && (
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#C9A96E' }} />
          )}
        </div>
        <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'rgba(250,250,247,0.5)' }}>{n.body}</p>
        <span className="text-[10px] mt-1 block" style={{ color: 'rgba(250,250,247,0.3)' }}>
          {formatDistanceToNow(n.time, { addSuffix: true })}
        </span>
      </div>

      {/* Dismiss */}
      <button
        onClick={e => { e.stopPropagation(); onDismiss(); }}
        className="absolute top-3 right-3 w-5 h-5 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex"
        style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(250,250,247,0.5)' }}
      >
        <X size={9} />
      </button>
    </motion.div>
  );
};

const NotificationBell: React.FC<{ inline?: boolean }> = ({ inline = false }) => {
  const { notifications, unreadCount, markRead, markAllRead, dismiss, clearAll } = useNotifications();
  const { t } = useLocalization();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div ref={ref} className={inline ? 'relative z-50' : 'fixed top-4 right-4 z-50'}>
      {/* Bell button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.92 }}
        aria-label={t('Notifications')}
        className="relative flex items-center justify-center rounded-full transition-colors"
        style={{
          width: 40,
          height: 40,
          background: open ? 'rgba(15,25,35,0.08)' : 'transparent',
          color: 'hsl(var(--foreground))',
        }}
      >
        <motion.div
          animate={unreadCount > 0 && !open ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 8 }}
        >
          <Bell size={16} strokeWidth={1.8} />
        </motion.div>

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center"
              style={{
                background: '#C9A96E',
                color: '#0F1923',
                boxShadow: '0 0 0 2px #0F1923',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'absolute',
              top: 48,
              right: 0,
              width: 320,
              maxHeight: 480,
              borderRadius: 18,
              overflow: 'hidden',
              background: 'linear-gradient(160deg, #111922 0%, #0c131c 100%)',
              border: '1px solid rgba(201,169,110,0.18)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,169,110,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#C9A96E' }}>
                  {t('Notifications')}
                </span>
                {unreadCount > 0 && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(201,169,110,0.15)', color: '#C9A96E' }}
                  >
                    {unreadCount} {t('new')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors"
                    style={{ color: 'rgba(250,250,247,0.4)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#FAFAF7'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(250,250,247,0.4)'; (e.currentTarget as HTMLElement).style.background = ''; }}
                    title={t('Mark all read')}
                  >
                    <CheckCheck size={11} />
                    <span>{t('All read')}</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors"
                    style={{ color: 'rgba(250,250,247,0.4)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(250,250,247,0.4)'; (e.currentTarget as HTMLElement).style.background = ''; }}
                    title={t('Clear all')}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,169,110,0.2) transparent' }}>
              <AnimatePresence initial={false}>
                {notifications.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 gap-3"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(201,169,110,0.1)' }}
                    >
                      <Bell size={20} style={{ color: 'rgba(201,169,110,0.5)' }} strokeWidth={1.5} />
                    </div>
                    <p className="text-[12px]" style={{ color: 'rgba(250,250,247,0.3)' }}>{t('No notifications yet')}</p>
                  </motion.div>
                ) : (
                  notifications.map((n, i) => (
                    <NotificationItem
                      key={n.id}
                      n={n}
                      index={i}
                      onRead={() => markRead(n.id)}
                      onDismiss={() => dismiss(n.id)}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div
                className="px-4 py-2.5 shrink-0 text-center"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-[10px]" style={{ color: 'rgba(250,250,247,0.25)' }}>
                  {notifications.length} {t(notifications.length === 1 ? 'notification' : 'notifications')}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
