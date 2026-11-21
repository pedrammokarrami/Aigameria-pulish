import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  Gamepad2,
  Info,
  Loader2,
  Mic,
  Play,
  RefreshCw,
  Search,
  Upload,
  Users,
  X,
  Youtube,
} from 'lucide-react';
import type { MotionCoachPayload } from '../../agents/motionCoachAgent';
import type {
  ChapterPhaseId,
  ProClipAnalyzerItem,
  ProClipAnalyzerResponse,
  ScrubberChapterDot,
} from '../../agents/proClipAnalyzerAgent';
import {
  COACH_REALM_ORDER,
  PC_GAME_CATALOG,
  REALM_LABELS_FA,
} from '../../services/gameMediaCatalog';
import { toPersianDigits } from '../../services/liveMetaSyncService';
import type { ClipSourceKind } from '../../services/realClipAgentService';
import type { RealmId } from '../../types/spatial';
import { CoachWorld3D } from './CoachWorld3D';
import { MotionCoachCard } from './MotionCoachCard';

export interface UploadedCoachMedia {
  url: string;
  isVideo: boolean;
  fileName: string;
}

interface SearchableGameItem {
  id: string;
  name: string;
  shortLabel: string;
  realm: RealmId;
  steamAppId?: number;
  thumbnailUrl: string;
  source: 'curated' | 'steam';
}

interface RealClipCoachRoomProps {
  activeRealm: RealmId;
  motionPayload: MotionCoachPayload;
  proClipsData: ProClipAnalyzerResponse | null;
  isLoadingClips: boolean;
  isSyncingMotion: boolean;
  problemQuery: string;
  uploadedMedia: UploadedCoachMedia | null;
  isSpeaking: boolean;
  isListeningVoice: boolean;
  isAnalyzingUpload: boolean;
  onSelectGame: (game: { id: string; name?: string; realm?: RealmId; steamAppId?: number }) => void;
  onSubmitProblemQuery: (query: string) => void;
  onRefreshAgents: () => void;
  onUploadFile: (file: File) => void;
  onClearUploadedMedia: () => void;
  onToggleSpeak: (voiceText: string) => void;
  onToggleVoiceQa: () => void;
  onOpenSocialWorld: () => void;
  onBackToMenu: () => void;
}

const CLEAN_CINEMATIC_COVER_BY_REALM: Record<RealmId, string> = {
  sports: '/src/assets/images/ue5_sports_coach_1795030212303.jpg',
  shooter: '/src/assets/images/ue5_shooter_coach_1795030210595.jpg',
  strategy: '/src/assets/images/ue5_strategy_coach_1795030214202.jpg',
  story: '/src/assets/images/ue5_gta_social_hub_1795036738605.jpg',
};

const CREATOR_AVATAR_URL = '/src/assets/images/athlete_avatar_1794943635940.jpg';

const FALLBACK_THUMB_BY_REALM = CLEAN_CINEMATIC_COVER_BY_REALM;

const FEATURED_DROPDOWN_GAME_IDS = ['fc27', 'efootball', 'cs2', 'valorant', 'gta', 'f1-25', 'dota2', 'elden-ring'];

export const RealClipCoachRoom: React.FC<RealClipCoachRoomProps> = ({
  activeRealm,
  motionPayload,
  proClipsData,
  isLoadingClips,
  isSyncingMotion,
  problemQuery,
  uploadedMedia,
  isSpeaking,
  isListeningVoice,
  isAnalyzingUpload,
  onSelectGame,
  onSubmitProblemQuery,
  onRefreshAgents,
  onUploadFile,
  onClearUploadedMedia,
  onToggleSpeak,
  onToggleVoiceQa,
  onOpenSocialWorld,
  onBackToMenu,
}) => {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<ChapterPhaseId>('fix');
  const [activeStartSec, setActiveStartSec] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playerNonce, setPlayerNonce] = useState<number>(0);

  // Collapsible bottom drawer (collapsed by default to preserve exact 2-frame hierarchy)
  const [isClipsDrawerOpen, setIsClipsDrawerOpen] = useState<boolean>(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | ClipSourceKind>('all');
  const [draftProblem, setDraftProblem] = useState<string>(problemQuery);

  // Compact top bar dropdown & patch info popover
  const [isGameDropdownOpen, setIsGameDropdownOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [libraryQuery, setLibraryQuery] = useState<string>('');
  const [libraryRealmFilter, setLibraryRealmFilter] = useState<'all' | RealmId>('all');
  const [libraryResults, setLibraryResults] = useState<SearchableGameItem[]>([]);
  const [isSearchingLibrary, setIsSearchingLibrary] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const accent = motionPayload.accentHex || '#22C55E';

  useEffect(() => {
    setDraftProblem(problemQuery);
  }, [problemQuery]);

  const allClips = proClipsData?.clips ?? [];

  const filteredClips = useMemo(() => {
    if (sourceFilter === 'all') return allClips;
    const subset = allClips.filter((c) => c.sourceKind === sourceFilter);
    return subset.length > 0 ? subset : allClips;
  }, [allClips, sourceFilter]);

  const activeClip: ProClipAnalyzerItem | null = useMemo(() => {
    if (allClips.length === 0) return null;
    if (selectedClipId) {
      const hit = allClips.find((c) => c.id === selectedClipId);
      if (hit) return hit;
    }
    return allClips[0];
  }, [allClips, selectedClipId]);

  // Reset selected clip & return to clean cinematic cover when active game changes
  useEffect(() => {
    setSelectedClipId(null);
    setSourceFilter('all');
    setIsPlaying(false);
  }, [motionPayload.gameId]);

  // Sync default chapter dot when clip changes
  useEffect(() => {
    if (!activeClip) return;
    const defaultDot = activeClip.chapters[1] ?? activeClip.chapters[0];
    if (defaultDot) {
      setActivePhase(defaultDot.id);
      setActiveStartSec(defaultDot.sec);
    }
  }, [activeClip?.id]);

  // Live All-PC-Games search when top game dropdown is open
  useEffect(() => {
    if (!isGameDropdownOpen) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsSearchingLibrary(true);
      const params = new URLSearchParams();
      if (libraryQuery.trim()) params.set('q', libraryQuery.trim());
      if (libraryRealmFilter !== 'all') params.set('realm', libraryRealmFilter);
      fetch(`/api/games/search?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && Array.isArray(data?.games)) {
            setLibraryResults(data.games as SearchableGameItem[]);
          }
        })
        .catch(() => {
          if (!cancelled) {
            const fallback = PC_GAME_CATALOG.filter((g) => {
              const realmOk = libraryRealmFilter === 'all' || g.realm === libraryRealmFilter;
              const qOk =
                !libraryQuery.trim() ||
                g.name.toLowerCase().includes(libraryQuery.trim().toLowerCase());
              return realmOk && qOk;
            }).map((g) => ({
              id: g.id,
              name: g.name,
              shortLabel: g.shortLabel,
              realm: g.realm,
              steamAppId: g.steamAppId,
              thumbnailUrl: g.fallbackScreenshotUrl,
              source: 'curated' as const,
            }));
            setLibraryResults(fallback);
          }
        })
        .finally(() => {
          if (!cancelled) setIsSearchingLibrary(false);
        });
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isGameDropdownOpen, libraryQuery, libraryRealmFilter]);

  const handleStartVideoPlayback = () => {
    onClearUploadedMedia();
    setIsPlaying(true);
    setPlayerNonce((n) => n + 1);
  };

  const handleSelectChapter = (chapter: ScrubberChapterDot) => {
    onClearUploadedMedia();
    setActivePhase(chapter.id);
    setActiveStartSec(chapter.sec);
    if (isPlaying) {
      setPlayerNonce((n) => n + 1);
    }
  };

  const handleSelectClip = (clip: ProClipAnalyzerItem) => {
    onClearUploadedMedia();
    setSelectedClipId(clip.id);
    const fixDot = clip.chapters[1] ?? clip.chapters[0];
    setActivePhase(fixDot?.id ?? 'fix');
    setActiveStartSec(fixDot?.sec ?? 0);
    setIsPlaying(false);
    setIsClipsDrawerOpen(false);
  };

  const handleProblemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitProblemQuery(draftProblem.trim());
  };

  const activeChapterObj =
    activeClip?.chapters.find((c) => c.id === activePhase) ?? activeClip?.chapters[0] ?? null;

  const embedUrl = activeClip
    ? `https://www.youtube.com/embed/${activeClip.youtubeId}?start=${activeStartSec}&autoplay=1&rel=0&playsinline=1&modestbranding=1`
    : null;

  const cinematicCoverUrl =
    motionPayload.worldTheme === 'sports'
      ? CLEAN_CINEMATIC_COVER_BY_REALM.sports
      : motionPayload.worldTheme === 'shooter'
        ? CLEAN_CINEMATIC_COVER_BY_REALM.shooter
        : motionPayload.worldTheme === 'strategy'
          ? CLEAN_CINEMATIC_COVER_BY_REALM.strategy
          : CLEAN_CINEMATIC_COVER_BY_REALM.story;

  const featuredGames = useMemo(
    () =>
      FEATURED_DROPDOWN_GAME_IDS.map((id) => PC_GAME_CATALOG.find((g) => g.id === id)).filter(
        (g): g is NonNullable<typeof g> => Boolean(g)
      ),
    []
  );

  return (
    <div
      dir="rtl"
      data-testid="real-clip-coach-room"
      className="fixed inset-0 z-30 w-full min-h-dvh h-dvh overflow-y-auto overflow-x-hidden text-white"
    >
      {/* LAYER 1: Game-Adaptive Real-Time Three.js Unreal 5.8 3D Backdrop */}
      <CoachWorld3D worldTheme={motionPayload.worldTheme} accentHex={accent} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUploadFile(f);
          e.currentTarget.value = '';
        }}
      />

      {/* 9:16 Portrait Mobile-First Zero-Clipping Shell (scales cleanly on desktop too) */}
      <div className="max-w-md mx-auto w-full min-h-dvh px-3.5 pt-2.5 pb-3 flex flex-col justify-between gap-2">
        {/* ================= SINGLE-LINE TOP BAR (ZERO 3-ROW CLUTTER) ================= */}
        <header
          data-testid="coach-single-topbar"
          className="flex items-center justify-between gap-2 shrink-0"
        >
          {/* Back */}
          <button
            type="button"
            data-testid="coach-back-btn"
            onClick={onBackToMenu}
            className="shrink-0 h-9 px-3 rounded-xl bg-[#070B14]/85 hover:bg-[#111827]/90 border border-white/15 flex items-center gap-1.5 text-xs font-extrabold text-white transition cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>بازگشت</span>
          </button>

          {/* Compact Game Dropdown (FC 27 ▾) */}
          <button
            type="button"
            data-testid="game-dropdown-trigger"
            aria-expanded={isGameDropdownOpen}
            onClick={() => setIsGameDropdownOpen((v) => !v)}
            className="min-w-0 max-w-[175px] h-9 px-3 rounded-xl bg-[#070B14]/88 hover:bg-[#111827]/95 border border-white/20 flex items-center justify-center gap-1.5 text-xs font-black text-white transition cursor-pointer shadow-lg"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: accent }}
            />
            <span dir="ltr" className="truncate font-display tracking-wide">
              {motionPayload.gameShortLabel}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-white/75 shrink-0" />
          </button>

          {/* Compact Info + Mic Icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              data-testid="coach-meta-info-btn"
              aria-label="اطلاعات پچ و متای بازی"
              onClick={() => setIsInfoOpen((v) => !v)}
              className="w-9 h-9 rounded-xl bg-[#070B14]/85 hover:bg-[#111827]/90 border border-white/15 flex items-center justify-center text-white/90 transition cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              type="button"
              data-testid="coach-top-mic-btn"
              aria-label="سوال صوتی از مربی"
              onClick={onToggleVoiceQa}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                isListeningVoice
                  ? 'bg-rose-500/25 border-rose-400 text-rose-200'
                  : 'bg-[#070B14]/85 border-white/15 text-white/90 hover:bg-[#111827]/90'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ================= MAIN 2-FRAME CONTENT STACK ================= */}
        <main className="flex-1 flex flex-col gap-2 min-w-0">
          {/* ---------- LAYER 2: TOP PRO CLIP FRAME (CLEAN CINEMATIC COVER + SCRUBBER CHAPTERS) ---------- */}
          <section
            data-testid="top-video-frame"
            className="rounded-2xl overflow-hidden bg-slate-950/40 backdrop-blur-md border border-white/15 shadow-[0_18px_45px_rgba(0,0,0,0.55)]"
          >
            {/* Clean 16:9 Frosted-Glass Pro Video Viewport (NO clickbait YouTube thumbnail on default view) */}
            <div
              data-testid="clean-real-video-stage"
              className="relative w-full aspect-video bg-slate-950 overflow-hidden"
            >
              {uploadedMedia ? (
                uploadedMedia.isVideo ? (
                  <video
                    src={uploadedMedia.url}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img
                    src={uploadedMedia.url}
                    alt={uploadedMedia.fileName}
                    className="w-full h-full object-contain bg-black"
                  />
                )
              ) : isPlaying && embedUrl && activeClip ? (
                <iframe
                  key={`${activeClip.youtubeId}-${activeStartSec}-${playerNonce}`}
                  data-testid="real-youtube-player"
                  src={embedUrl}
                  title={activeClip.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                /* Clean Dark-Cinematic Game Scene Cover + Frosted-Glass Play Button */
                <div
                  data-testid="cinematic-clip-cover"
                  className="relative w-full h-full overflow-hidden"
                >
                  <img
                    src={cinematicCoverUrl}
                    alt={motionPayload.gameName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover scale-[1.02] brightness-90"
                  />
                  {/* Measured Cinematic Dark Contrast Scrim */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/55"
                  />

                  {/* Top-Right Creator Pill (RedLac • یوتیوب پرو) with Avatar */}
                  <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between gap-2">
                    <div
                      data-testid="pro-clip-creator-pill"
                      className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-slate-950/65 backdrop-blur-md border border-white/20 max-w-[76%]"
                    >
                      <img
                        src={CREATOR_AVATAR_URL}
                        alt={activeClip?.channelName ?? 'Pro Creator'}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover border border-white/30 shrink-0"
                      />
                      <span dir="ltr" className="text-[11px] font-black text-white truncate">
                        {activeClip?.channelName ?? 'RedLac'}
                      </span>
                      <span className="text-white/40 text-[10px]">•</span>
                      <span
                        className={`text-[10px] font-extrabold shrink-0 ${
                          activeClip?.sourceKind === 'reddit_top'
                            ? 'text-orange-300'
                            : 'text-emerald-300'
                        }`}
                      >
                        {activeClip?.sourceKind === 'reddit_top' ? 'ردیت' : 'یوتیوب پرو'}
                      </span>
                    </div>

                    {activeClip && (
                      <a
                        href={`https://www.youtube.com/watch?v=${activeClip.youtubeId}&t=${activeStartSec}s`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="مشاهده در یوتیوب"
                        className="w-7 h-7 rounded-full bg-slate-950/65 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Centered Frosted-Glass Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isLoadingClips && !activeClip ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent }} />
                        <span className="text-[11px] font-extrabold text-white/85">
                          در حال دریافت کلیپ پرو...
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-testid="pro-clip-play-btn"
                        aria-label="پخش کلیپ حرفه‌ای"
                        onClick={handleStartVideoPlayback}
                        className="group w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/35 shadow-[0_0_32px_rgba(16,185,129,0.35)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Play className="w-6 h-6 text-white fill-white translate-x-[-1px]" />
                      </button>
                    )}
                  </div>

                  {/* Subtle Bottom Caption & Duration */}
                  {activeClip && (
                    <div className="absolute bottom-2 right-2.5 left-2.5 flex items-center justify-between gap-2 pointer-events-none">
                      <span dir="ltr" className="text-[11px] font-bold text-white/90 truncate">
                        {activeClip.title}
                      </span>
                      <span
                        dir="ltr"
                        className="shrink-0 px-1.5 py-0.5 rounded-md bg-slate-950/75 border border-white/15 text-[10px] font-mono font-bold text-white/90"
                      >
                        {activeClip.durationLabel}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Timeline Scrubber Bar with 3 Glowing Chapter Markers Directly Below Video */}
            {uploadedMedia ? (
              <div className="px-3 py-2 flex items-center justify-between gap-2 border-t border-white/10">
                <span className="text-[11px] font-bold text-emerald-300 truncate">
                  {isAnalyzingUpload
                    ? 'در حال بررسی صحنه شما...'
                    : `صحنه شما: ${uploadedMedia.fileName}`}
                </span>
                <button
                  type="button"
                  onClick={onClearUploadedMedia}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white cursor-pointer"
                >
                  بازگشت به کلیپ پرو
                </button>
              </div>
            ) : activeClip ? (
              <div
                data-testid="interactive-scrubber-bar"
                className="px-3 pt-1.5 pb-2 border-t border-white/10 flex flex-col gap-1"
              >
                {/* Scrubber Track with 3 Glowing Chapter Dots */}
                <div dir="ltr" className="relative h-5 flex items-center">
                  <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${activeChapterObj?.progressPct ?? 50}%`,
                        backgroundColor: activeChapterObj?.accentHex ?? accent,
                      }}
                    />
                  </div>

                  {activeClip.chapters.map((ch, idx) => {
                    const isSelected = ch.id === activePhase;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        data-testid={`scrubber-dot-${idx}`}
                        aria-label={`${ch.timeLabel} ${ch.shortLabelFa}`}
                        onClick={() => handleSelectChapter(ch)}
                        style={{
                          left: `${ch.progressPct}%`,
                          backgroundColor: ch.accentHex,
                          boxShadow: isSelected
                            ? `0 0 0 4px ${ch.accentHex}44, 0 0 12px ${ch.accentHex}`
                            : `0 0 8px ${ch.accentHex}88`,
                        }}
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-slate-950 transition-transform cursor-pointer ${
                          isSelected ? 'w-3.5 h-3.5 scale-110 z-10' : 'w-2.5 h-2.5 opacity-90 hover:scale-110'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Synchronized 3-Chapter Glowing Markers (0:25 خطا | 1:35 اصلاح | 3:00 اجرا) */}
                <div className="grid grid-cols-3 gap-1.5">
                  {activeClip.chapters.map((ch, idx) => {
                    const isSelected = ch.id === activePhase;
                    return (
                      <button
                        key={`pill-${ch.id}`}
                        type="button"
                        data-testid={`key-moment-btn-${idx}`}
                        onClick={() => handleSelectChapter(ch)}
                        className={`py-1 px-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 transition cursor-pointer border whitespace-nowrap ${
                          isSelected
                            ? 'text-slate-950 border-white/50 shadow-md'
                            : 'bg-white/[0.05] text-white/85 border-white/12 hover:bg-white/[0.12]'
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: ch.accentHex,
                                boxShadow: `0 0 14px ${ch.accentHex}55`,
                              }
                            : undefined
                        }
                      >
                        <span dir="ltr" className="font-mono font-black tabular-nums">
                          {ch.timeLabel}
                        </span>
                        <span>{ch.shortLabelFa}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          {/* ---------- LAYER 3: CENTER 3D HOLOGRAPHIC CONTROLLER & COACHING HERO CARD ---------- */}
          <MotionCoachCard
            payload={motionPayload}
            activePhase={activePhase}
            isSpeaking={isSpeaking}
            onToggleSpeak={() => onToggleSpeak(motionPayload.voiceExplanationEn)}
          />
        </main>

        {/* ================= LAYER 4: COLLAPSED GLASS DRAWER + DARK-GLASS EMERALD CTA + MIC ================= */}
        <footer data-testid="coach-bottom-footer" className="flex flex-col gap-1.5 shrink-0">
          {/* Collapsed Glass Drawer Handle (⌃ کلیپ‌های یوتیوب و ردیت (۷)) */}
          <button
            type="button"
            data-testid="clips-drawer-toggle"
            aria-expanded={isClipsDrawerOpen}
            onClick={() => setIsClipsDrawerOpen(true)}
            className="w-full h-8 px-3.5 rounded-full bg-slate-950/50 hover:bg-slate-900/70 backdrop-blur-md border border-white/15 flex items-center justify-between text-xs font-extrabold text-white/90 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <ChevronUp className="w-4 h-4 text-emerald-300" />
              <span>
                کلیپ‌های یوتیوب و ردیت ({toPersianDigits(String(allClips.length || 7))})
              </span>
            </div>
            <span className="text-[10px] font-bold text-white/55">
              {isLoadingClips ? 'در حال بروزرسانی...' : 'مشاهده و جستجو'}
            </span>
          </button>

          {/* Sleek Dark-Glass Emerald-Rimmed CTA Pill + Circular Mic Button (NO loud solid gradient bar) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="coach-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 h-10 rounded-full border border-emerald-400/50 bg-slate-950/60 hover:bg-slate-900/75 hover:border-emerald-300/80 backdrop-blur-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] font-black text-xs sm:text-sm text-emerald-100 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{isAnalyzingUpload ? 'در حال آنالیز...' : 'ارسال کلیپ یا عکس من'}</span>
            </button>

            <button
              type="button"
              data-testid="coach-voice-qa-btn"
              aria-label="سوال صوتی از مربی"
              onClick={onToggleVoiceQa}
              className={`w-10 h-10 rounded-full border backdrop-blur-xl flex items-center justify-center transition cursor-pointer shrink-0 ${
                isListeningVoice
                  ? 'bg-rose-500/25 border-rose-400 text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.35)]'
                  : 'bg-slate-950/60 border-white/20 text-white hover:bg-slate-900/80 hover:border-white/35'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>

      {/* ================= COLLAPSIBLE BOTTOM DRAWER SHEET (YOUTUBE & REDDIT CLIPS) ================= */}
      {isClipsDrawerOpen && (
        <div
          data-testid="clips-bottom-drawer"
          className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-2 sm:p-4"
        >
          <div className="w-full max-w-md max-h-[78dvh] rounded-3xl bg-[#070B14] border border-white/15 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-black text-white">
                  کلیپ‌های یوتیوب و ردیت • <span dir="ltr">{motionPayload.gameShortLabel}</span>
                </span>
              </div>
              <button
                type="button"
                aria-label="بستن لیست کلیپ‌ها"
                onClick={() => setIsClipsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Problem Search + Source Tabs */}
            <div className="p-3 border-b border-white/10 space-y-2">
              <form onSubmit={handleProblemSubmit} className="flex items-center gap-1.5">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 text-white/45 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    data-testid="problem-clip-search-input"
                    value={draftProblem}
                    onChange={(e) => setDraftProblem(e.target.value)}
                    placeholder="مشکل بازیتو بنویس (مثلاً دفاع، اسموک میراژ)..."
                    className="w-full h-9 pr-8 pl-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder:text-white/45 focus:outline-none focus:border-emerald-400/70"
                  />
                </div>
                <button
                  type="submit"
                  data-testid="problem-clip-search-submit"
                  className="shrink-0 h-9 px-3 rounded-xl text-xs font-black text-slate-950 cursor-pointer"
                  style={{ backgroundColor: accent }}
                >
                  پیدا کن
                </button>
              </form>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: 'all', label: 'همه' },
                      { id: 'youtube_pro', label: 'یوتیوب پرو' },
                      { id: 'reddit_top', label: 'ردیت' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSourceFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                        sourceFilter === tab.id
                          ? 'bg-white text-slate-950'
                          : 'bg-white/[0.06] text-white/75'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onRefreshAgents}
                  className="px-2 py-1 rounded-lg bg-white/[0.06] text-[10px] font-bold text-white/75 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingClips ? 'animate-spin' : ''}`} />
                  <span>بروزرسانی</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {filteredClips.map((clip, idx) => {
                const isSelected = activeClip?.id === clip.id && !uploadedMedia;
                return (
                  <button
                    key={clip.id}
                    type="button"
                    data-testid={`clip-card-${idx}`}
                    onClick={() => handleSelectClip(clip)}
                    className={`w-full text-right rounded-xl p-2 flex items-center gap-2.5 transition cursor-pointer border ${
                      isSelected
                        ? 'bg-white/[0.12] border-emerald-400/70'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="relative w-24 h-14 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10">
                      <img
                        src={clip.thumbnailUrl}
                        alt={clip.title}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_THUMB_BY_REALM[activeRealm];
                        }}
                        className="w-full h-full object-cover"
                      />
                      <span
                        dir="ltr"
                        className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/85 text-[9px] font-mono font-bold text-white"
                      >
                        {clip.durationLabel}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                            clip.sourceKind === 'reddit_top'
                              ? 'bg-orange-500/20 text-orange-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {clip.sourceKind === 'reddit_top' ? (
                            <Flame className="w-2.5 h-2.5" />
                          ) : (
                            <Youtube className="w-2.5 h-2.5" />
                          )}
                          <span>{clip.sourceKind === 'reddit_top' ? 'ردیت' : 'یوتیوب پرو'}</span>
                        </span>
                        <span dir="ltr" className="text-[10px] text-white/60 truncate">
                          {clip.channelName}
                        </span>
                      </div>
                      <div
                        dir="ltr"
                        className="text-[11px] font-bold text-white line-clamp-2 text-left leading-snug"
                      >
                        {clip.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= COMPACT GAME SWITCHER DROPDOWN MODAL (ALL PC GAMES) ================= */}
      {isGameDropdownOpen && (
        <div
          data-testid="all-games-library-drawer"
          className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-3 pt-14"
        >
          <div className="w-full max-w-md max-h-[80dvh] rounded-3xl bg-[#070B14] border border-white/15 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" style={{ color: accent }} />
                <span className="text-xs font-black text-white">انتخاب بازی (تمام بازی‌های PC)</span>
              </div>
              <button
                type="button"
                aria-label="بستن انتخاب بازی"
                onClick={() => setIsGameDropdownOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick-Pick Featured Games Strip */}
            <div className="px-3 pt-2.5 pb-2 border-b border-white/10 flex flex-wrap gap-1.5">
              {featuredGames.map((g) => {
                const selected = motionPayload.gameId === g.id;
                return (
                  <button
                    key={`quick-${g.id}`}
                    type="button"
                    data-testid={`dropdown-game-${g.id}`}
                    onClick={() => {
                      onSelectGame({
                        id: g.id,
                        name: g.name,
                        realm: g.realm,
                        steamAppId: g.steamAppId,
                      });
                      setIsGameDropdownOpen(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer border ${
                      selected
                        ? 'text-slate-950 border-white/40'
                        : 'bg-white/[0.06] text-white/85 border-white/10 hover:bg-white/[0.14]'
                    }`}
                    style={selected ? { backgroundColor: g.accentHex } : undefined}
                  >
                    <span dir="ltr">{g.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Search + 4 Genre Filter */}
            <div className="p-3 border-b border-white/10 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-white/45 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  data-testid="all-games-search-input"
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                  placeholder="جستجوی هر بازی کامپیوتری (FC 27, CS2, Valorant, GTA, Elden Ring)..."
                  className="w-full h-9 pr-9 pl-3 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder:text-white/45 focus:outline-none focus:border-emerald-400/70"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setLibraryRealmFilter('all')}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                    libraryRealmFilter === 'all'
                      ? 'bg-white text-slate-950'
                      : 'bg-white/[0.06] text-white/75'
                  }`}
                >
                  همه سبک‌ها
                </button>
                {COACH_REALM_ORDER.map((rId) => (
                  <button
                    key={rId}
                    type="button"
                    onClick={() => setLibraryRealmFilter(rId)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      libraryRealmFilter === rId
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-white/[0.06] text-white/75'
                    }`}
                  >
                    {REALM_LABELS_FA[rId]}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Cards Grid */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2">
              {isSearchingLibrary && libraryResults.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-xs text-white/60">
                  در حال جستجو میان تمام بازی‌های PC...
                </div>
              ) : (
                libraryResults.map((game) => {
                  const selected = motionPayload.gameId === game.id;
                  return (
                    <button
                      key={`${game.source}-${game.id}`}
                      type="button"
                      data-testid={`library-game-item-${game.id}`}
                      onClick={() => {
                        onSelectGame({
                          id: game.id,
                          name: game.name,
                          realm: game.realm,
                          steamAppId: game.steamAppId,
                        });
                        setIsGameDropdownOpen(false);
                      }}
                      className={`group rounded-2xl overflow-hidden border text-right transition cursor-pointer bg-slate-900/90 ${
                        selected
                          ? 'border-emerald-400 ring-1 ring-emerald-400'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="relative h-16 w-full overflow-hidden bg-slate-950">
                        <img
                          src={game.thumbnailUrl}
                          alt={game.name}
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_THUMB_BY_REALM[game.realm];
                          }}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/85 text-[9px] font-extrabold text-white">
                          {REALM_LABELS_FA[game.realm]}
                        </span>
                      </div>
                      <div className="p-2">
                        <div dir="ltr" className="text-[11px] font-black text-white truncate">
                          {game.name}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= COMPACT PATCH INFO & SOCIAL POPOVER ================= */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 pt-16">
          <div
            data-testid="coach-meta-drawer"
            className="w-full max-w-md rounded-2xl bg-[#070B14] border border-white/15 p-4 text-white shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-300">متای پچ فعال</span>
                <span dir="ltr" className="text-xs font-mono text-white/75">
                  {motionPayload.patchVersion}
                </span>
              </div>
              <button
                type="button"
                aria-label="بستن اطلاعات پچ"
                onClick={() => setIsInfoOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <div dir="ltr" className="font-black text-white">
                {motionPayload.gameName}
              </div>
              <p className="text-white/80 leading-relaxed">{motionPayload.patchSummaryFa}</p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                data-testid="coach-open-social-btn"
                onClick={() => {
                  setIsInfoOpen(false);
                  onOpenSocialWorld();
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-[11px] font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>سوشال مدیا GTA</span>
              </button>

              <button
                type="button"
                data-testid="coach-sync-meta-btn"
                onClick={onRefreshAgents}
                disabled={isSyncingMotion || isLoadingClips}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncingMotion || isLoadingClips ? 'animate-spin' : ''}`}
                />
                <span>بروزرسانی زنده</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
