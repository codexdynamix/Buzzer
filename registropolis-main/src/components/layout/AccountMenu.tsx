import React, { useEffect, useRef, useState } from 'react';
import {
  CircleHelp,
  Home,
  LayoutList,
  LogOut,
  MessageCircle,
  Moon,
  PlusCircle,
  Search,
  Settings,
  Sun,
  UserRound,
  Heart,
  Scale,
  BellRing,
  X,
  ChevronRight,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useChatContext } from '@/context/ChatContext';
import NotificationBell from './NotificationBell';
import { useLocalization } from '@/i18n/LocalizationContext';
import GlobalSearchModal from '@/components/common/GlobalSearchModal';
import LanguageSelector from '@/components/common/LanguageSelector';

const AccountMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { totalUnread } = useChatContext();

  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const toggleTheme = () => {
    const nextDarkMode = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', nextDarkMode);
    document.documentElement.classList.toggle('light', !nextDarkMode);
    localStorage.setItem('buzzer-theme', nextDarkMode ? 'dark' : 'light');
    setDarkMode(nextDarkMode);
  };

  if (pathname === '/' || pathname.startsWith('/admin')) return null;

  const iconButtonClass =
    'relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-foreground/75 transition-all hover:bg-foreground/5 hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]';

  return (
    <>
      <header
        ref={menuRef}
        className="fixed inset-x-0 top-0 z-[60] flex h-16 items-center justify-between border-b border-border/80 bg-background/95 backdrop-blur-md px-3 sm:px-5 lg:px-7 transition-colors"
      >
        {/* Left Side: Brand Logo & Search */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            aria-label="Buzzer home"
            title="Buzzer"
            onClick={() => goTo('/dashboard/home')}
            className="group flex h-10 items-center gap-2 rounded-xl px-1.5 sm:px-2 text-foreground transition-all hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-[#0F1923] shadow-xs transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #C9A96E, #a8834e)' }}
            >
              BZ
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold tracking-[0.14em] uppercase text-foreground">
                BUZZER
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
            </div>
          </button>

          {/* Quick Search Button: Icon on mobile, Bar on tablet & desktop */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label={t('Search listings...')}
            className="flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-foreground/5 px-2.5 sm:px-3 text-xs text-muted-foreground transition-all hover:border-[#C9A96E]/60 hover:bg-foreground/10 hover:text-foreground active:scale-95"
          >
            <Search size={15} className="text-[#C9A96E] shrink-0" />
            <span className="hidden sm:inline-block max-w-[120px] md:max-w-none truncate font-medium">
              {t('Search listings...')}
            </span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground bg-background border border-border rounded shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Side: CTAs & Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
          {/* Post Listing CTA:
              - Mobile: Compact '+ Post' badge
              - Tablet & Desktop: '+ Post Listing' button
          */}
          <button
            type="button"
            onClick={() => goTo('/dashboard/my-listings')}
            className="flex h-8 sm:h-9 items-center gap-1.5 rounded-lg sm:rounded-xl px-2.5 sm:px-3.5 text-xs font-bold transition-all shadow-xs shrink-0 active:scale-95"
            style={{ backgroundColor: '#C9A96E', color: '#0F1923' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#ba965c')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#C9A96E')}
          >
            <PlusCircle size={14} className="shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">+ Post Listing</span>
            <span className="inline sm:hidden whitespace-nowrap">+ Post</span>
          </button>

          {/* Desktop & Tablet Home button */}
          <button
            type="button"
            aria-label={t('Home')}
            title={t('Home')}
            onClick={() => goTo('/dashboard/home')}
            className={`hidden md:flex ${iconButtonClass}`}
          >
            <Home size={18} />
          </button>

          {/* Messages Button (visible on tablet & desktop, or mobile if desired) */}
          <button
            type="button"
            aria-label={t('Messages')}
            title={t('Messages')}
            onClick={() => goTo('/dashboard/messages')}
            className={`hidden sm:flex ${iconButtonClass}`}
          >
            <MessageCircle size={18} />
            {totalUnread > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-2xs animate-pulse">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </button>

          {/* Notifications Bell */}
          <NotificationBell inline />

          {/* Language Selector (Tablet & Desktop only; Mobile has it in Drawer) */}
          <div className="hidden sm:block">
            <LanguageSelector variant="icon" />
          </div>

          {/* Dark / Light Mode Toggle (Tablet & Desktop only; Mobile has it in Drawer) */}
          <button
            type="button"
            aria-label={t(`Switch to ${darkMode ? 'light' : 'dark'} mode`)}
            title={t(`Switch to ${darkMode ? 'light' : 'dark'} mode`)}
            onClick={toggleTheme}
            className={`hidden sm:flex ${iconButtonClass}`}
          >
            {darkMode ? <Sun size={18} className="text-[#C9A96E]" /> : <Moon size={18} />}
          </button>

          {/* User Profile Avatar / Menu Trigger */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                aria-label={t('Open account menu')}
                aria-expanded={open}
                onClick={() => setOpen(current => !current)}
                className="flex h-9 sm:h-10 items-center gap-2 rounded-xl p-1 text-foreground transition-all hover:bg-foreground/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]"
              >
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center overflow-hidden rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-2xs border border-border/60">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </span>
                <span className="hidden max-w-28 truncate text-xs font-semibold lg:block text-left">
                  {user.name}
                </span>
              </button>

              {/* Account Dropdown (Desktop & Tablet) */}
              {open && (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-popover/95 backdrop-blur-xl p-1 text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-50">
                  {/* User Info Header */}
                  <div className="border-b border-border/60 px-4 py-3 bg-muted/30 rounded-t-xl mb-1">
                    <p className="truncate text-sm font-bold text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email ?? user.phoneNumber}</p>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => goTo('/dashboard/profile')}
                      className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-xs font-medium rounded-lg hover:bg-accent/40 transition-colors"
                    >
                      <UserRound size={15} className="text-[#C9A96E]" />
                      <span>{t('My profile')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo('/dashboard/my-listings')}
                      className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-xs font-medium rounded-lg hover:bg-accent/40 transition-colors"
                    >
                      <LayoutList size={15} className="text-[#C9A96E]" />
                      <span>{t('My Listings')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo('/dashboard/saved')}
                      className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-xs font-medium rounded-lg hover:bg-accent/40 transition-colors"
                    >
                      <Heart size={15} className="text-[#C9A96E]" />
                      <span>{t('Saved')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo('/dashboard/compare')}
                      className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-xs font-medium rounded-lg hover:bg-accent/40 transition-colors"
                    >
                      <Scale size={15} className="text-[#C9A96E]" />
                      <span>{t('Compare')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo('/dashboard/price-alerts')}
                      className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-xs font-medium rounded-lg hover:bg-accent/40 transition-colors"
                    >
                      <BellRing size={15} className="text-[#C9A96E]" />
                      <span>{t('Price Alerts')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo('/dashboard/settings')}
                      className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-xs font-medium rounded-lg hover:bg-accent/40 transition-colors"
                    >
                      <Settings size={15} className="text-[#C9A96E]" />
                      <span>{t('Settings')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo('/dashboard/help')}
                      className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-xs font-medium rounded-lg hover:bg-accent/40 transition-colors"
                    >
                      <CircleHelp size={15} className="text-[#C9A96E]" />
                      <span>{t('Help & Support')}</span>
                    </button>
                  </div>

                  {/* Mobile Quick Preferences (Theme + Language inside menu for mobile) */}
                  <div className="sm:hidden border-t border-border/60 my-1 pt-1 px-2 space-y-2">
                    <div className="flex items-center justify-between py-1 px-1.5 text-xs text-muted-foreground">
                      <span>{t('Theme')}</span>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-semibold"
                      >
                        {darkMode ? <Sun size={14} className="text-[#C9A96E]" /> : <Moon size={14} />}
                        <span>{darkMode ? t('Dark') : t('Light')}</span>
                      </button>
                    </div>
                    <LanguageSelector variant="inline" />
                  </div>

                  {/* Sign Out */}
                  <div className="my-1 border-t border-border/60" />
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      signOut();
                      navigate('/auth', { replace: true });
                    }}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-xs font-semibold text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut size={15} />
                    <span>{t('Sign out')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border border-border/80 bg-foreground/5 px-2.5 sm:px-3 text-xs font-semibold text-foreground transition-all hover:bg-foreground/10 active:scale-95"
              >
                <UserRound size={15} className="text-[#C9A96E]" />
                <span className="hidden sm:inline">{t('Sign in')}</span>
              </button>

              {/* Guest Menu for mobile/tablet */}
              {open && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-popover/95 backdrop-blur-xl p-2 text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-50">
                  <div className="p-3 bg-muted/40 rounded-xl mb-2">
                    <p className="text-xs font-bold text-foreground">{t('Welcome to Buzzer')}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Sign in to post listings, message sellers, and save favorites.')}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate('/auth');
                      }}
                      className="mt-2.5 w-full py-2 rounded-lg bg-[#1A3353] text-white text-xs font-bold text-center block hover:bg-[#142842] transition-colors"
                    >
                      {t('Sign In / Sign Up')}
                    </button>
                  </div>

                  <div className="sm:hidden border-t border-border/60 pt-2 px-1 space-y-2">
                    <div className="flex items-center justify-between py-1 px-1.5 text-xs text-muted-foreground">
                      <span>{t('Theme')}</span>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-semibold"
                      >
                        {darkMode ? <Sun size={14} className="text-[#C9A96E]" /> : <Moon size={14} />}
                        <span>{darkMode ? t('Dark') : t('Light')}</span>
                      </button>
                    </div>
                    <LanguageSelector variant="inline" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Global Cmd+K Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default AccountMenu;
