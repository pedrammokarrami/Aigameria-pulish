import React, { useEffect, useState } from 'react';
import { Globe, ExternalLink, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { LobbyGameId } from '../../utils/lobbySkillCatalog';

interface LiveWebAnswerProps {
  gameId: LobbyGameId;
  searchQuery: string;
}

const GAME_REALM: Record<LobbyGameId, string> = {
  fc27: 'sports',
  cs2: 'shooter',
  valorant: 'shooter',
  gta: 'story',
};

interface CoachTopic {
  titleFa: string;
  coachAdviceFa: string;
  coachVoiceEn: string;
  adkIntel?: {
    liveSources?: Array<{ title: string; url: string; source: string }>;
  };
}

/**
 * Live-web fallback: when the local skill catalog has no match, the coach
 * fan-outs to Wikipedia/Reddit/HN/Steam through /api/coach/search and shows
 * real online sources — the user never hits a dead end.
 */
export const LiveWebAnswer: React.FC<LiveWebAnswerProps> = ({ gameId, searchQuery }) => {
  const { languageCode, isRtl } = useLanguage();
  const isFa = languageCode === 'fa' || languageCode.startsWith('fa') || languageCode === 'prs';
  const [topic, setTopic] = useState<CoachTopic | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      setTopic(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setTopic(null);
    fetch(`/api/coach/search?realm=${GAME_REALM[gameId]}&q=${encodeURIComponent(query)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then((body) => {
        if (!cancelled && body?.topic) setTopic(body.topic as CoachTopic);
      })
      .catch(() => {
        /* offline — card just stays hidden */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, searchQuery]);

  const sources = topic?.adkIntel?.liveSources ?? [];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      data-testid="live-web-answer"
      className="w-full rounded-2xl bg-gradient-to-b from-sky-950/60 to-slate-950/55 backdrop-blur-xl border border-sky-400/30 p-4 text-start flex flex-col gap-2.5"
    >
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-sky-300" />
        <span className="text-[12px] font-bold text-sky-200 tracking-wide">
          {isFa ? 'پاسخ زنده از وب (منابع واقعی آنلاین)' : 'Live web answer (real online sources)'}
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-[12.5px] text-white/70">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {isFa ? 'ایجنت‌ها در حال جستجوی آنلاین…' : 'Agents searching the live web…'}
        </div>
      )}

      {!loading && topic && (
        <>
          <p className="text-[13px] font-bold text-white/95 leading-relaxed">{topic.titleFa}</p>
          <p className="text-[12.5px] text-white/75 leading-relaxed">
            {isFa ? topic.coachAdviceFa : topic.coachVoiceEn || topic.coachAdviceFa}
          </p>
          {sources.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-sky-200/90">
                {isFa ? `منابع زنده (${sources.length}):` : `Live sources (${sources.length}):`}
              </span>
              {sources.slice(0, 4).map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="group flex items-start gap-1.5 text-[12px] text-emerald-200/90 hover:text-emerald-100 leading-snug"
                >
                  <ExternalLink className="w-3 h-3 mt-0.5 shrink-0 opacity-70 group-hover:opacity-100" />
                  <span className="min-w-0">
                    <span className="text-white/60">[{s.source}]</span> {s.title}
                  </span>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
