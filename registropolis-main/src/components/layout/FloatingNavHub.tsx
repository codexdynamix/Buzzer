import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, LayoutGrid, X, MessageCircle, ShoppingBag, Briefcase,
  Wrench, Building2, Truck, Calendar, LayoutList, Heart, Shield, Settings, LogOut, User, Play, Megaphone,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useChatContext } from '@/context/ChatContext';
import { useUserListings } from '@/context/UserListingsContext';
import { useSaved } from '@/context/SavedContext';

/* ─── Nav items ────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Home',        icon: Home,          href: '/dashboard/home' },
  { label: 'Reels',       icon: Play,          href: '/dashboard/reels',       badge: 'NEW' },
  { label: 'Messages',    icon: MessageCircle, href: '/dashboard/messages',    badge: null },
  { label: 'Marketplace', icon: ShoppingBag,   href: '/dashboard/marketplace' },
  { label: 'Jobs',        icon: Briefcase,     href: '/dashboard/jobs' },
  { label: 'Services',    icon: Wrench,        href: '/dashboard/services' },
  { label: 'Real Estate', icon: Building2,     href: '/dashboard/real-estate' },
  { label: 'Transport',   icon: Truck,         href: '/dashboard/transport' },
  { label: 'Events',      icon: Calendar,      href: '/dashboard/events' },
  { label: 'Business & Ads', icon: Megaphone,  href: '/dashboard/business' },
  { label: 'My Listings', icon: LayoutList,    href: '/dashboard/my-listings', badge: null },
  { label: 'Saved',       icon: Heart,          href: '/dashboard/saved',        badge: null },
];

/* ─── Constants ─────────────────────────────────────────────────── */
const FAB_W = 134;
const FAB_H = 48;
const PANEL_W = 296;
const PANEL_H = 420;
const DRAG_THRESHOLD = 6;
const EDGE_PAD = 16;

/* ─── Spring variants ───────────────────────────────────────────── */
const panelVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 12 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30, mass: 0.8 },
  },
  exit: {
    opacity: 0, scale: 0.94, y: 8,
    transition: { duration: 0.15, ease: 'easeIn' as const },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.035, type: 'spring' as const, stiffness: 500, damping: 30 },
  }),
};

/* ─── Component ─────────────────────────────────────────────────── */
const FloatingNavHub: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  const { unreadMessages } = useNotifications();
  const { totalUnread } = useChatContext();
  const { totalCount } = useUserListings();
  const { savedCount } = useSaved();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragState = useRef<{
    startX: number; startY: number; origX: number; origY: number; didDrag: boolean;
  } | null>(null);

  /* Initialise to bottom-right on mount */
  useEffect(() => {
    setPos({
      x: window.innerWidth - FAB_W - 24,
      y: window.innerHeight - FAB_H - 24,
    });
  }, []);

  /* Keyboard dismiss */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── Drag handlers ── */
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos?.x ?? 0,
      origY: pos?.y ?? 0,
      didDrag: false,
    };
  }, [pos]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (!dragState.current.didDrag && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      dragState.current.didDrag = true;
      setOpen(false);
    }
    if (dragState.current.didDrag) {
      setPos({
        x: Math.max(EDGE_PAD, Math.min(window.innerWidth - FAB_W - EDGE_PAD, dragState.current.origX + dx)),
        y: Math.max(EDGE_PAD, Math.min(window.innerHeight - FAB_H - EDGE_PAD, dragState.current.origY + dy)),
      });
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!dragState.current) return;
    if (!dragState.current.didDrag) setOpen(o => !o);
    dragState.current = null;
  }, []);

  /* ── Panel position ── */
  const panelStyle: React.CSSProperties = (() => {
    if (!pos) return { display: 'none' };
    const openLeft = pos.x + PANEL_W > window.innerWidth - EDGE_PAD;
    const openUp   = pos.y + FAB_H + PANEL_H + 12 > window.innerHeight;
    return {
      position: 'fixed',
      left:  openLeft ? Math.max(EDGE_PAD, pos.x - PANEL_W + FAB_W) : pos.x,
      top:   openUp   ? Math.max(EDGE_PAD, pos.y - PANEL_H - 10) : pos.y + FAB_H + 10,
      width: PANEL_W,
      zIndex: 50,
    };
  })();

  const items = [
    ...NAV_ITEMS.map(item =>
      item.href === '/dashboard/messages'
        ? { ...item, badge: totalUnread > 0 ? String(totalUnread) : null }
        : item.href === '/dashboard/saved'
        ? { ...item, badge: savedCount > 0 ? String(savedCount) : null }
        : item
    ),
    ...(isAdmin ? [{ label: 'Admin', icon: Shield, href: '/admin', badge: null }] : []),
  ];

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? 'BZ');

  const handleNav = (href: string) => { navigate(href); setOpen(false); };

  if (!pos) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(10,15,22,0.5)', backdropFilter: 'blur(3px)' }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Nav Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              ...panelStyle,
              borderRadius: 20,
              overflow: 'hidden',
              background: 'linear-gradient(160deg, #111922 0%, #0c131c 100%)',
              border: '1px solid rgba(201,169,110,0.18)',
              boxShadow: '0 32px 72px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,169,110,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* ── Panel Header ── */}
            <div
              className="flex items-center justify-between px-5 pt-5 pb-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div>
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.25em]"
                  style={{ color: '#C9A96E' }}
                >
                  Navigate
                </span>
                {user && (
                  <p className="text-[12px] font-medium mt-0.5 truncate max-w-[140px]" style={{ color: 'rgba(250,250,247,0.6)' }}>
                    {user.name ?? user.email}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {user && (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #C9A96E, #a8834e)',
                      color: '#0F1923',
                      boxShadow: '0 2px 8px rgba(201,169,110,0.4)',
                    }}
                  >
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(250,250,247,0.4)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = '#FAFAF7'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(250,250,247,0.4)'; }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* ── Nav Grid ── */}
            <div className="grid grid-cols-3 gap-1.5 p-3">
              {items.map(({ label, icon: Icon, href, badge: staticBadge }, i) => {
                const isActive = pathname.startsWith(href);
                const badge = href === '/dashboard/my-listings'
                  ? (totalCount > 0 ? String(totalCount) : null)
                  : staticBadge;
                return (
                  <motion.button
                    key={href}
                    custom={i}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    onClick={() => handleNav(href)}
                    className="relative flex flex-col items-center gap-2 py-3 px-1.5 rounded-2xl cursor-pointer transition-all"
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(201,169,110,0.16) 0%, rgba(26,51,83,0.3) 100%)'
                        : 'rgba(255,255,255,0.03)',
                      border: isActive
                        ? '1px solid rgba(201,169,110,0.3)'
                        : '1px solid rgba(255,255,255,0.04)',
                      boxShadow: isActive ? '0 4px 14px rgba(201,169,110,0.12)' : 'none',
                    }}
                    whileHover={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(201,169,110,0.22) 0%, rgba(26,51,83,0.35) 100%)'
                        : 'rgba(255,255,255,0.07)',
                      scale: 1.03,
                      transition: { duration: 0.12 },
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Icon container */}
                    <div
                      className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: isActive
                          ? 'rgba(201,169,110,0.2)'
                          : 'rgba(255,255,255,0.05)',
                      }}
                    >
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2 : 1.7}
                        style={{ color: isActive ? '#C9A96E' : 'rgba(250,250,247,0.45)' }}
                      />
                      {badge && (
                        <span
                          className="absolute -top-1 -right-1 text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center"
                          style={{
                            background: '#C9A96E',
                            color: '#0F1923',
                            boxShadow: '0 0 0 2px #111922',
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className="text-[10px] font-semibold text-center leading-tight"
                      style={{ color: isActive ? '#FAFAF7' : 'rgba(250,250,247,0.4)', letterSpacing: '0.01em' }}
                    >
                      {label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* ── Footer ── */}
            <div
              className="flex items-center gap-1 px-3 pb-3 pt-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <button
                onClick={() => handleNav('/dashboard/settings')}
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-left"
                style={{ color: 'rgba(250,250,247,0.45)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#FAFAF7'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(250,250,247,0.45)'; }}
              >
                <Settings size={13} />
                <span className="text-[11px] font-medium">Settings</span>
              </button>
              {user ? (
                <button
                  onClick={() => { signOut(); setOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
                  style={{ color: 'rgba(248,113,113,0.7)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.1)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.7)'; }}
                >
                  <LogOut size={13} />
                  <span className="text-[11px] font-medium">Sign out</span>
                </button>
              ) : (
                <button
                  onClick={() => handleNav('/dashboard')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
                  style={{ color: 'rgba(201,169,110,0.7)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.1)'; (e.currentTarget as HTMLElement).style.color = '#C9A96E'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(201,169,110,0.7)'; }}
                >
                  <User size={13} />
                  <span className="text-[11px] font-medium">Sign in</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Draggable FAB ── */}
      <motion.button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label="Open navigation"
        animate={open ? { scale: 1 } : { scale: [1, 1.02, 1] }}
        transition={open ? {} : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: FAB_W,
          height: FAB_H,
          zIndex: 50,
          borderRadius: 999,
          cursor: dragState.current?.didDrag ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          padding: 0,
          overflow: 'hidden',
          background: open
            ? 'linear-gradient(135deg, #1A3353 0%, #0F1923 100%)'
            : 'linear-gradient(135deg, #0F1923 0%, #1A3353 100%)',
          border: open
            ? '1px solid rgba(201,169,110,0.5)'
            : '1px solid rgba(201,169,110,0.2)',
          boxShadow: open
            ? '0 8px 32px rgba(0,0,0,0.6), 0 0 0 3px rgba(201,169,110,0.12)'
            : '0 4px 20px rgba(0,0,0,0.45), 0 0 20px rgba(201,169,110,0.08)',
        }}
      >
        {/* Left avatar zone */}
        <div
          className="h-full flex items-center justify-center shrink-0 relative"
          style={{
            width: 44,
            background: 'rgba(201,169,110,0.12)',
            borderRight: '1px solid rgba(201,169,110,0.12)',
          }}
        >
          {user ? (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ background: 'linear-gradient(135deg, #C9A96E, #a8834e)', color: '#0F1923' }}
            >
              {initials}
            </div>
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(201,169,110,0.25)', border: '1px solid rgba(201,169,110,0.4)' }}
            >
              <span className="text-[11px] font-black" style={{ color: '#C9A96E' }}>BZ</span>
            </div>
          )}
          {/* Unread badge on FAB */}
          {totalUnread > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[9px] font-bold"
              style={{
                minWidth: 16,
                height: 16,
                padding: '0 3px',
                backgroundColor: '#EF4444',
                color: '#ffffff',
                boxShadow: '0 0 0 2px #0F1923',
                lineHeight: 1,
              }}
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </div>

        {/* Wordmark */}
        <span
          className="flex-1 text-center font-bold tracking-[0.18em]"
          style={{ fontSize: 10, color: 'rgba(250,250,247,0.7)', textTransform: 'uppercase', letterSpacing: '0.2em' }}
        >
          Buzzer
        </span>

        {/* Icon zone */}
        <div
          className="h-full flex items-center justify-center shrink-0"
          style={{
            width: 40,
            background: open ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.04)',
            borderLeft: '1px solid rgba(201,169,110,0.1)',
          }}
        >
          <motion.div
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {open
              ? <X size={15} style={{ color: '#C9A96E' }} />
              : <LayoutGrid size={15} style={{ color: 'rgba(250,250,247,0.65)' }} />
            }
          </motion.div>
        </div>

        {/* Shimmer layer (hover) */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.07) 50%, transparent 100%)',
          }}
        />
      </motion.button>
    </>
  );
};

export default FloatingNavHub;
