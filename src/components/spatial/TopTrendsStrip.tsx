import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Flame, Wand2, GraduationCap } from 'lucide-react';
import type { LobbyGameId } from '../../utils/lobbySkillCatalog';

/** Daily-agent curated Top-10 lists, per genre × section (public/data/curated-top.json). */
interface CuratedItem {
  game: string;
  kind: string;
  title: string;
  summary: string;
  source: string;
  url: string | null;
  awarenessOnly?: boolean;
}
interface CuratedGenre {
  counts: { cards: number; trends: number; tricks: number; cheatAwareness: number; tutorials: number };
  trends: CuratedItem[];
  tricks: CuratedItem[];
  cheatAwareness: CuratedItem[];
  tutorials: CuratedItem[];
}
type CuratedTop = { generatedAt: string; genres: Record<string, CuratedGenre> };

const GAME_GENRE: Record<LobbyGameId, string> = {
  fc27: 'sports',
  cs2: 'shooter',
  gta: 'open-world-story',
  valorant: 'shooter',
};

type Section = 'trends' | 'tricks' | 'tutorials';

/**
 * Homepage "best of the day" strip — the local agent picks the top 10 per
 * section for the current game's genre (trends / tricks / tutorials).
 * Data is 100% local (knowledge store + free sources); no external AI.
 */
export const TopTrendsStrip: React.FC<{
  gameId: LobbyGameId;
  accentHex: string;
  onSelectQuestion: (q: string) => void;
}> = ({ gameId, accentHex, onSelectQuestion }) => {
  const { languageCode, isRtl } = useLanguage();
  const lang = languageCode?.slice(0, 2) ?? 'fa';
  const [data, setData] = useState<CuratedTop | null>(null);
  const [section, setSection] = useState<Section>('trends');

  useEffect(() => {
    let alive = true;
    fetch('/data/curated-top.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => { if (alive) setData(j); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const genre = GAME_GENRE[gameId] ?? 'sports';
  const items = useMemo<CuratedItem[]>(() => {
    const g = data?.genres?.[genre];
    if (!g) return [];
    const base = section === 'trends' ? g.trends : section === 'tricks' ? g.tricks : g.tutorials;
    const extra = section === 'tricks' ? g.cheatAwareness : [];
    return [...base, ...extra].slice(0, 10);
  }, [data, genre, section]);

  if (items.length === 0) return null;

  const label = (s: Section) =>
    lang === 'fa'
      ? s === 'trends' ? 'ترندهای امروز' : s === 'tricks' ? 'ترفندها' : 'آموزش‌ها'
      : s === 'trends' ? 'Today trends' : s === 'tricks' ? 'Tricks' : 'Tutorials';

  return (
    <div
      data-testid="top-trends-strip"
      className="w-full shrink-0"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-white/45">
          <Flame className="w-3 h-3" style={{ color: accentHex }} />
          {lang === 'fa' ? 'بهترین‌های روز:' : 'Best of the day:'}
        </span>
        <div className="flex items-center gap-1">
          {(['trends', 'tricks', 'tutorials'] as Section[]).map((s) => (
            <button
              key={s}
              type="button"
              data-testid={`top-trends-tab-${s}`}
              onClick={() => setSection(s)}
              className={`px-2 min-h-[22px] rounded-full text-[10.5px] font-bold transition-all duration-150 cursor-pointer border ${
                section === s
                  ? 'border-white/45 text-white'
                  : 'border-white/10 text-white/50 hover:text-white/80'
              }`}
              style={section === s ? { background: `${accentHex}22` } : undefined}
            >
              {s === 'trends' ? <Flame className="w-3 h-3 inline" /> : s === 'tricks' ? <Wand2 className="w-3 h-3 inline" /> : <GraduationCap className="w-3 h-3 inline" />}
              {' '}
              {label(s)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {items.map((it, i) => {
          const isCheat = Boolean(it.awarenessOnly);
          const text = lang === 'fa' && isCheat ? `${it.title} — (فقط آگاهی ضدکیت)` : it.title;
          return (
            <button
              key={`${it.game}-${it.kind}-${i}`}
              type="button"
              data-testid="top-trends-chip"
              onClick={() => onSelectQuestion(it.title)}
              title={it.summary}
              className={`shrink-0 whitespace-nowrap min-h-[26px] px-2.5 rounded-full text-[11px] font-bold transition-all duration-150 cursor-pointer border ${
                isCheat
                  ? 'border-amber-400/25 bg-amber-950/30 text-amber-200/85 hover:text-amber-100'
                  : 'border-white/12 bg-slate-950/55 text-white/85 hover:text-white hover:border-white/40'
              }`}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
};
