import React from 'react';
import { Mic, Search, X } from 'lucide-react';
import type { LobbyCategoryChip } from '../../utils/lobbySkillCatalog';

interface SkillSearchHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categories: LobbyCategoryChip[];
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  isListeningVoice: boolean;
  onToggleVoiceSearch: () => void;
}

export const SkillSearchHeader: React.FC<SkillSearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  categories,
  activeCategoryId,
  onSelectCategory,
  isListeningVoice,
  onToggleVoiceSearch,
}) => {
  return (
    <section
      aria-label="جستجو و فیلتر مهارت‌ها"
      data-testid="skill-search-header"
      className="w-full shrink-0 flex flex-col gap-2.5"
    >
      {/* Frosted-Glass Instant Skill Search Input */}
      <div
        dir="rtl"
        className="flex items-center gap-2 min-h-[44px] px-3.5 rounded-full bg-slate-950/50 backdrop-blur-xl border border-white/15 focus-within:border-emerald-400/60 focus-within:shadow-[0_0_16px_rgba(16,185,129,0.2)] transition-all"
      >
        <Search className="w-4 h-4 text-white/60 shrink-0" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="جستجوی سریع مهارت یا دکمه..."
          aria-label="جستجوی سریع مهارت یا دکمه"
          data-testid="skill-search-input"
          className="w-full bg-transparent text-[13px] font-medium text-white placeholder:text-white/55 focus:outline-none py-2"
        />

        {searchQuery.trim().length > 0 && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="پاک کردن جستجو"
            data-testid="skill-search-clear-btn"
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/65 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleVoiceSearch}
          aria-label={isListeningVoice ? 'توقف جستجوی صوتی' : 'جستجوی صوتی مهارت'}
          data-testid="skill-voice-search-btn"
          className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
            isListeningVoice
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
              : 'text-white/75 hover:text-white hover:bg-white/10'
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>

      {/* 1-Tap Category Filter Chips */}
      <div
        role="tablist"
        aria-label="دسته‌بندی مهارت‌ها"
        data-testid="skill-category-chips"
        dir="rtl"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
      >
        {categories.map((chip) => {
          const isActive = chip.id === activeCategoryId;
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`category-chip-${chip.id}`}
              onClick={() => onSelectCategory(chip.id)}
              className={`shrink-0 whitespace-nowrap min-h-[32px] px-3 rounded-full text-[12px] font-bold backdrop-blur-xl transition-all duration-150 cursor-pointer border ${
                isActive
                  ? 'bg-white/90 text-slate-950 border-white shadow-[0_4px_14px_rgba(255,255,255,0.2)]'
                  : 'bg-slate-950/45 text-white/80 border-white/15 hover:bg-slate-900/65 hover:text-white'
              }`}
            >
              {chip.labelFa}
            </button>
          );
        })}
      </div>
    </section>
  );
};
