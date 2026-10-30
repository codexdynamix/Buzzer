import React, { useEffect, useRef, useState } from 'react';
import { Globe2, Check, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES, useLocalization, LanguageCode } from '@/i18n/LocalizationContext';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full' | 'inline' | 'icon';
  className?: string;
  onSelect?: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'compact',
  className = '',
  onSelect,
}) => {
  const { language, setLanguage, t } = useLocalization();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setOpen(false);
    onSelect?.();
  };

  // Inline mode for mobile drawer
  if (variant === 'inline') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          <Globe2 size={13} className="text-[#C9A96E]" />
          <span>{t('Language')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1 rounded-xl bg-muted/40 border border-border/60">
          {SUPPORTED_LANGUAGES.map(item => {
            const isActive = language === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-[#C9A96E] text-[#0F1923] font-bold shadow-xs'
                    : 'text-foreground/80 hover:bg-background hover:text-foreground'
                }`}
              >
                <span className="truncate">{item.name}</span>
                {isActive && <Check size={12} className="shrink-0 ml-1 text-[#0F1923]" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Icon only trigger
  if (variant === 'icon') {
    return (
      <div ref={dropdownRef} className={`relative inline-block ${className}`}>
        <button
          type="button"
          aria-label={t('Choose language')}
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground/75 transition-all hover:bg-foreground/5 hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E]"
        >
          <Globe2 size={18} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 z-50 w-52 max-h-72 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1">
              {t('Select Language')}
            </div>
            {SUPPORTED_LANGUAGES.map(item => {
              const isActive = language === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-[#C9A96E]/15 text-[#C9A96E] font-bold'
                      : 'hover:bg-accent/40 text-foreground/80'
                  }`}
                >
                  <span>{item.name}</span>
                  {isActive && <Check size={14} className="text-[#C9A96E]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Button dropdown (compact or full)
  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-label={t('Choose language')}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-[#D1C9BC] dark:border-border/80 bg-white/80 dark:bg-card/80 px-2.5 text-xs font-medium text-[#4A5568] dark:text-foreground shadow-2xs backdrop-blur-xs transition-all hover:border-[#C9A96E] hover:text-[#0F1923] dark:hover:text-foreground active:scale-95"
      >
        <Globe2 size={14} className="text-[#C9A96E]" />
        <span className="truncate max-w-[80px]">
          {variant === 'compact' ? currentLang.code.toUpperCase() : currentLang.name}
        </span>
        <ChevronDown size={12} className={`text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-50 w-52 max-h-72 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1">
            {t('Select Language')}
          </div>
          {SUPPORTED_LANGUAGES.map(item => {
            const isActive = language === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-[#C9A96E]/15 text-[#C9A96E] font-bold'
                    : 'hover:bg-accent/40 text-foreground/80'
                }`}
              >
                <span>{item.name}</span>
                {isActive && <Check size={14} className="text-[#C9A96E]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
