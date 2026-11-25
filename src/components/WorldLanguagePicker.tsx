import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Globe, Search, X } from 'lucide-react';
import type { Language } from '../types/api';
import { getUiCopy } from '../data/i18n';
import {
  getWorldLanguageByCode,
  isRtlLanguageCode,
  searchWorldLanguages,
} from '../data/worldLanguages';
import {
  ENTER_FROM_BOTTOM,
  REVEAL_BEHIND_MENU,
  SPRINGS,
} from '../motion/transitions';

interface WorldLanguagePickerProps {
  language: Language;
  onSelectLanguage: (code: Language) => void;
}

interface PopoverCoords {
  top: number;
  left: number;
  isMobile: boolean;
}

const DESKTOP_MENU_WIDTH = 340;
const VIEWPORT_MARGIN = 12;

/**
 * Searchable World Language Picker covering all official ISO 639-1 world languages.
 * Portaled into document.body so sticky backdrop-blur headers never clip or offset
 * mobile bottom sheets or RTL desktop popovers.
 */
export function WorldLanguagePicker({
  language,
  onSelectLanguage,
}: WorldLanguagePickerProps) {
  const copy = getUiCopy(language);
  const isRtl = isRtlLanguageCode(language);
  const activeOption = useMemo(() => getWorldLanguageByCode(language), [language]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState<PopoverCoords>({
    top: 64,
    left: VIEWPORT_MARGIN,
    isMobile: false,
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => searchWorldLanguages(query), [query]);

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      setCoords({ top: 0, left: 0, isMobile: true });
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const desiredLeft = isRtl ? rect.left : rect.right - DESKTOP_MENU_WIDTH;
    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - DESKTOP_MENU_WIDTH - VIEWPORT_MARGIN);
    const clampedLeft = Math.min(Math.max(VIEWPORT_MARGIN, desiredLeft), maxLeft);
    setCoords({
      top: Math.round(rect.bottom + 8),
      left: Math.round(clampedLeft),
      isMobile: false,
    });
  }, [isRtl]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }

    updatePosition();

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 60);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('mousedown', onPointerDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, updatePosition]);

  const handleChoose = (code: string) => {
    onSelectLanguage(code);
    setOpen(false);
  };

  const portalOverlay =
    typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            {open && (
              <div dir={isRtl ? 'rtl' : 'ltr'}>
                {/* Mobile backdrop */}
                {coords.isMobile && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
                  />
                )}

                {/* Searchable World Language Menu */}
                <motion.div
                  ref={menuRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label={copy.selectLanguage}
                  data-testid="world-language-menu"
                  variants={coords.isMobile ? ENTER_FROM_BOTTOM : REVEAL_BEHIND_MENU}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={
                    coords.isMobile
                      ? undefined
                      : {
                          top: coords.top,
                          left: coords.left,
                          width: DESKTOP_MENU_WIDTH,
                        }
                  }
                  className={
                    coords.isMobile
                      ? 'fixed inset-x-3 bottom-3 z-50 flex max-h-[72dvh] flex-col overflow-hidden rounded-3xl border border-white/14 bg-[#0B0F17]/98 shadow-[0_24px_64px_rgba(0,0,0,0.82)] backdrop-blur-2xl'
                      : 'fixed z-50 flex max-h-[440px] flex-col overflow-hidden rounded-2xl border border-white/14 bg-[#0B0F17]/98 shadow-[0_24px_64px_rgba(0,0,0,0.82)] backdrop-blur-2xl'
                  }
                >
                  {/* Search Header */}
                  <div className="border-b border-white/10 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2 px-1">
                      <span className="font-display text-xs font-semibold text-white">
                        {copy.selectLanguage}
                      </span>
                      <span className="font-mono text-[10px] tabular-nums text-slate-400">
                        {filtered.length}
                      </span>
                    </div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 start-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        ref={inputRef}
                        type="text"
                        inputMode="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        data-testid="world-language-search"
                        placeholder={copy.searchLanguagesPlaceholder}
                        aria-label={copy.searchLanguagesPlaceholder}
                        autoComplete="off"
                        className="min-h-[40px] w-full rounded-xl border border-white/12 bg-white/[0.04] py-1.5 pe-8 ps-9 text-xs text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                      {query && (
                        <button
                          type="button"
                          onClick={() => setQuery('')}
                          aria-label={copy.clearSearch}
                          className="absolute top-1/2 end-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scrollable World Language List */}
                  <div
                    role="listbox"
                    aria-label={copy.selectLanguage}
                    className="flex-1 overflow-y-auto p-1.5"
                  >
                    {filtered.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-400">
                        {copy.noLanguagesFound}
                      </div>
                    ) : (
                      filtered.map((item) => {
                        const selected = item.code === activeOption.code;
                        return (
                          <button
                            key={item.code}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            data-testid={`lang-option-${item.code}`}
                            onClick={() => handleChoose(item.code)}
                            className={`flex min-h-[42px] w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-start transition-colors ${
                              selected
                                ? 'bg-sky-500/18 text-white'
                                : 'text-slate-200 hover:bg-white/[0.06] hover:text-white'
                            }`}
                          >
                            <div className="min-w-0 flex-1 text-start">
                              <div className="truncate text-xs font-medium text-white">
                                <span dir={item.dir}>{item.nativeName}</span>
                              </div>
                              {item.nativeName !== item.englishName && (
                                <div className="truncate text-[11px] text-slate-400">
                                  {item.englishName}
                                </div>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="font-mono text-[10px] uppercase text-slate-400">
                                {item.code}
                              </span>
                              {selected && (
                                <Check className="h-3.5 w-3.5 text-sky-400" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <div className="relative shrink-0">
      <motion.button
        ref={triggerRef}
        type="button"
        whileTap={{ scale: 0.95 }}
        transition={SPRINGS.tap}
        onClick={() => setOpen((prev) => !prev)}
        data-testid="world-language-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${copy.selectLanguage}: ${activeOption.englishName}`}
        className="titanium-btn flex min-h-[40px] items-center gap-2 rounded-xl border border-white/14 bg-white/[0.04] px-3 text-xs font-semibold text-slate-100 transition-colors hover:border-sky-400/45 hover:bg-white/[0.08] whitespace-nowrap"
      >
        <Globe className="h-3.5 w-3.5 text-sky-400 shrink-0" />
        <span className="max-w-[92px] truncate">{activeOption.nativeName}</span>
        <span className="font-mono text-[10px] uppercase text-slate-400">
          {activeOption.code}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </motion.button>
      {portalOverlay}
    </div>
  );
}
