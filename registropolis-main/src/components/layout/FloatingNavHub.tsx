import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Home, LayoutGrid, X, MessageCircle, ShoppingBag, Briefcase, ChevronLeft, ChevronRight,
  Wrench, Building2, Truck, Calendar, LayoutList, Heart, Shield, Settings, LogOut, User, Play, Megaphone, LifeBuoy,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { useNotifications } from '@/context/NotificationContext';
import { useChatContext } from '@/context/ChatContext';
import { useUserListings } from '@/context/UserListingsContext';
import { useSaved } from '@/context/SavedContext';
import { useLocalization } from '@/i18n/LocalizationContext';

/* ─── Nav items ────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Home',        icon: Home,          href: '/dashboard/home' },
  { label: 'Reels',       icon: Play,          href: '/dashboard/reels',       badge: 'NEW' },
  { label: 'Messages',    icon: MessageCircle, href: '/dashboard/messages',    badge: null },
  { label: 'Help & Support', icon: LifeBuoy, href: '/dashboard/help' },
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
const PANEL_H = 480;
const DRAG_THRESHOLD = 6;
const EDGE_PAD = 16;

/* ─── Spring variants ───────────────────────────────────────────── */
const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 12 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 },
  },
  exit: {
    opacity: 0, scale: 0.94, y: 8,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.035, type: 'spring', stiffness: 500, damping: 30 },
  }),
};

/* ─── Component ─────────────────────────────────────────────────── */
const FloatingNavHub: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { t } = useLocalization();

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

  useEffect(() => {
    const clampPosition = () => {
      setPos(current => current && ({
        x: Math.max(EDGE_PAD, Math.min(window.innerWidth - FAB_W - EDGE_PAD, current.x)),
        y: Math.max(EDGE_PAD, Math.min(window.innerHeight - FAB_H - EDGE_PAD, current.y)),
      }));
    };
    window.addEventListener('resize', clampPosition);
    return () => window.removeEventListener('resize', clampPosition);
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

  return (
    <>
      <aside
        aria-label={t('Main navigation')}
        className={`order-first hidden h-full shrink-0 flex-col overflow-hidden border-r transition-[width] duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-56'
        }`}
        style={{
          background: 'linear-gradient(180deg, #111922 0%, #0c131c 100%)',
          borderColor: 'rgba(201,169,110,0.16)',
        }}
      >
        <div
          className={`flex shrink-0 items-center border-b py-5 ${
            isCollapsed ? 'justify-center px-2' : 'gap-3 px-5'
          }`}
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl font-black"
            style={{ background: 'linear-gradient(135deg, #C9A96E, #a8834e)', color: '#0F1923' }}
          >
            BZ
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-[0.16em] text-white">BUZZER</p>
              <p className="truncate text-[10px]" style={{ color: 'rgba(250,250,247,0.48)' }}>
                {user?.name ?? t('Community')}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              aria-label={t('Collapse sidebar')}
              aria-expanded="true"
              aria-controls="main-sidebar-navigation"
              title={t('Collapse sidebar')}
              className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'rgba(250,250,247,0.62)' }}
            >
              <ChevronLeft size={17} />
            </button>
          )}
        </div>
        {isCollapsed && (
          <div className="flex shrink-0 justify-center py-2">
            <button
              onClick={toggleSidebar}
              aria-label={t('Expand sidebar')}
              aria-expanded="false"
              aria-controls="main-sidebar-navigation"
              title={t('Expand sidebar')}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'rgba(250,250,247,0.62)' }}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        )}
        <nav
          id="main-sidebar-navigation"
          className={`scrollbar-gold flex-1 space-y-1 overflow-y-auto ${
            isCollapsed ? 'p-2' : 'p-3'
          }`}
        >
          {items.map(({ label, icon: Icon, href, badge }) => {
            const isActive = href === '/dashboard/home'
              ? pathname === '/dashboard' || pathname === '/dashboard/home'
              : pathname === href || pathname.startsWith(`${href}/`);
            const itemBadge = href === '/dashboard/my-listings'
              ? (totalCount > 0 ? String(totalCount) : null)
              : badge;
            return (
              <button
                key={href}
                onClick={() => handleNav(href)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${t(label)}${itemBadge ? ` (${itemBadge})` : ''}`}
                title={t(label)}
                className={`relative flex w-full items-center rounded-xl py-2.5 transition-colors ${
                  isCollapsed ? 'justify-center px-0' : 'gap-3 px-3 text-left'
                }`}
                style={{
                  background: isActive ? 'rgba(201,169,110,0.14)' : 'transparent',
                  color: isActive ? '#FAFAF7' : 'rgba(250,250,247,0.62)',
                  border: `1px solid ${isActive ? 'rgba(201,169,110,0.25)' : 'transparent'}`,
                }}
              >
                <span className="relative flex shrink-0">
                  <Icon size={17} style={{ color: isActive ? '#C9A96E' : 'currentColor' }} />
                  {isCollapsed && itemBadge && (
                    <span
                      className={`absolute -right-2 -top-1 flex min-h-3 min-w-3 items-center justify-center rounded-full text-[8px] font-bold ${
                        itemBadge === 'NEW' ? 'px-1' : 'px-0.5'
                      }`}
                      style={{ background: '#C9A96E', color: '#0F1923' }}
                    >
                      {itemBadge === 'NEW' ? 'N' : parseInt(itemBadge) > 9 ? '9+' : itemBadge}
                    </span>
                  )}
                </span>
                {!isCollapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{t(label)}</span>
                    {itemBadge && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                        style={{ background: '#C9A96E', color: '#0F1923' }}
                      >
                        {itemBadge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>
        <div
          className={`shrink-0 space-y-1 border-t ${
            isCollapsed ? 'p-2' : 'p-3'
          }`}
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <button
            onClick={() => handleNav('/dashboard/settings')}
            aria-label={t('Settings')}
            title={t('Settings')}
            className={`flex w-full items-center rounded-xl py-2.5 text-xs font-medium transition-colors ${
              isCollapsed ? 'justify-center px-0' : 'gap-3 px-3 text-left'
            }`}
            style={{ color: 'rgba(250,250,247,0.62)' }}
          >
            <Settings size={16} /> {!isCollapsed && t('Settings')}
          </button>
          {user ? (
            <button
              onClick={() => signOut()}
              aria-label={t('Sign out')}
              title={t('Sign out')}
              className={`flex w-full items-center rounded-xl py-2.5 text-xs font-medium transition-colors ${
                isCollapsed ? 'justify-center px-0' : 'gap-3 px-3 text-left'
              }`}
              style={{ color: 'rgba(248,113,113,0.8)' }}
            >
              <LogOut size={16} /> {!isCollapsed && t('Sign out')}
            </button>
          ) : (
            <button
              onClick={() => handleNav('/auth')}
              aria-label={t('Sign in')}
              title={t('Sign in')}
              className={`flex w-full items-center rounded-xl py-2.5 text-xs font-medium transition-colors ${
                isCollapsed ? 'justify-center px-0' : 'gap-3 px-3 text-left'
              }`}
              style={{ color: '#C9A96E' }}
            >
              <User size={16} /> {!isCollapsed && t('Sign in')}
            </button>
          )}
        </div>
      </aside>
      {pos && <div className="md:hidden">
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
                  {t('Navigate')}
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
                      {t(label)}
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
                <span className="text-[11px] font-medium">{t('Settings')}</span>
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
                  <span className="text-[11px] font-medium">{t('Sign out')}</span>
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
                  <span className="text-[11px] font-medium">{t('Sign in')}</span>
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
      </div>}
    </>
  );
};

export default FloatingNavHub;
