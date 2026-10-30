import React, { useEffect, useRef, useState } from 'react';
import { CircleHelp, Globe2, Home, LayoutList, LogOut, MessageCircle, Moon, Settings, Sun, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from './NotificationBell';
import { SUPPORTED_LANGUAGES, useLocalization } from '@/i18n/LocalizationContext';

const AccountMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLocalization();
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
        setLanguageOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setLanguageOpen(false);
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
    ? user.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
    : '';
  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const selectLanguage = (code: typeof SUPPORTED_LANGUAGES[number]['code']) => {
    setLanguage(code);
    setLanguageOpen(false);
  };

  const toggleTheme = () => {
    const nextDarkMode = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', nextDarkMode);
    document.documentElement.classList.toggle('light', !nextDarkMode);
    localStorage.setItem('buzzer-theme', nextDarkMode ? 'dark' : 'light');
    setDarkMode(nextDarkMode);
  };

  if (pathname === '/' || pathname.startsWith('/admin')) return null;

  const iconButtonClass = 'flex h-10 w-10 items-center justify-center rounded-full text-foreground/75 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div
      ref={menuRef}
      className="fixed inset-x-0 top-0 z-[60] flex h-16 items-center justify-between border-b border-border bg-background px-4"
    >
      <button
        type="button"
        aria-label="Buzzer home"
        title="Buzzer"
        onClick={() => goTo('/dashboard/home')}
        className="flex h-10 items-center gap-2 rounded-lg px-2 text-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-[#0F1923]" style={{ background: 'linear-gradient(135deg, #C9A96E, #a8834e)' }}>
          BZ
        </span>
        <span className="hidden text-sm font-bold tracking-[0.12em] sm:block">BUZZER</span>
      </button>

      <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={t('Home')}
        title={t('Home')}
        onClick={() => goTo('/dashboard/home')}
        className={iconButtonClass}
      >
        <Home size={19} />
      </button>

      <button
        type="button"
        aria-label={t('Messages')}
        title={t('Messages')}
        onClick={() => goTo('/dashboard/messages')}
        className={iconButtonClass}
      >
        <MessageCircle size={19} />
      </button>

      <NotificationBell inline />

      <div className="relative">
        <button
          type="button"
          aria-label={t('Choose language')}
          aria-expanded={languageOpen}
          title={t('Choose language')}
          onClick={() => {
            setLanguageOpen(current => !current);
            setOpen(false);
          }}
          className={iconButtonClass}
        >
          <Globe2 size={19} />
        </button>
        {languageOpen && (
          <div className="absolute right-0 mt-2 max-h-[min(70vh,420px)] w-52 overflow-y-auto rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-xl">
            {SUPPORTED_LANGUAGES.map(item => (
              <button
                type="button"
                key={item.code}
                aria-current={language === item.code ? 'true' : undefined}
                onClick={() => selectLanguage(item.code)}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-accent/20 ${language === item.code ? 'font-semibold text-primary' : ''}`}
              >
                <span>{item.name}</span>
                {language === item.code && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label={t(`Switch to ${darkMode ? 'light' : 'dark'} mode`)}
        title={t(`Switch to ${darkMode ? 'light' : 'dark'} mode`)}
        onClick={toggleTheme}
        className={iconButtonClass}
      >
        {darkMode ? <Sun size={19} /> : <Moon size={19} />}
      </button>

      {user ? (
        <div className="relative">
          <button
            type="button"
            aria-label={t('Open account menu')}
            aria-expanded={open}
            onClick={() => {
              setOpen(current => !current);
              setLanguageOpen(false);
            }}
            className="flex h-10 items-center gap-2 rounded-md px-2 text-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {user.profileImageUrl
                ? <img src={user.profileImageUrl} alt="" className="h-full w-full object-cover" />
                : initials}
            </span>
            <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{user.name}</span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-xl">
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email ?? user.phoneNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => goTo('/dashboard/profile')}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-accent/20"
              >
                <UserRound size={16} />
                {t('My profile')}
              </button>
              <button
                type="button"
                onClick={() => goTo('/dashboard/my-listings')}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-accent/20"
              >
                <LayoutList size={16} />
                {t('My Listings')}
              </button>
              <button
                type="button"
                onClick={() => goTo('/dashboard/settings')}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-accent/20"
              >
                <Settings size={16} />
                {t('Settings')}
              </button>
              <button
                type="button"
                onClick={() => goTo('/dashboard/help')}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-accent/20"
              >
                <CircleHelp size={16} />
                {t('Help & Support')}
              </button>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  signOut();
                  navigate('/auth', { replace: true });
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut size={16} />
                {t('Sign out')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => navigate('/auth')}
          className="flex h-10 items-center gap-2 rounded-md px-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
        >
          <UserRound size={18} />
          <span className="hidden sm:block">{t('Sign in')}</span>
        </button>
      )}
      </div>
    </div>
  );
};

export default AccountMenu;
