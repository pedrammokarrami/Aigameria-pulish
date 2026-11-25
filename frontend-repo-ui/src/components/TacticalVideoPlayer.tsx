import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Upload } from 'lucide-react';
import {
  resolveLocalizedText,
  type ApiVideoData,
  type GameDefinition,
  type Language,
  type SkillSummary,
} from '../types/api';
import { getUiCopy } from '../data/i18n';
import { TacticalCanvas } from '../modules/analyz/canvas/TacticalCanvas';
import type { StageCommand } from '../modules/analyz/engine/types';
import { ProjectionScreen } from '../modules/projector/components/ProjectionScreen';
import {
  computeAmbientGlow,
  formatTimecode,
  type AmbientColorRGB,
  type VideoSource,
} from '../modules/projector/utils/media';
import type { TutorialChapter } from '../modules/projector/utils/tutorials';
import {
  VIDEO_CACHE_TTL_SECONDS,
  formatTtlCountdown,
  getRemainingTtlSeconds,
  sharedVideoCache,
  type CachedVideoEntry,
} from '../modules/media/videoCache';

interface TacticalVideoPlayerProps {
  skill: SkillSummary;
  game: GameDefinition | null;
  stageCommand: StageCommand | null;
  apiVideo: ApiVideoData | null;
  ttlSeconds?: number;
  language: Language;
  customSource?: VideoSource;
  onOpenUpload: () => void;
}

const DEFAULT_AMBIENT_RGB: AmbientColorRGB = { r: 78, g: 162, b: 224 };

/**
 * 100% API-driven ProjectionScreen + VisionControls player.
 * Strict hidden-until-ready: renders null if neither API video nor custom uploaded video exists.
 * Zero hardcoded game RGB tables or fallback fake demos.
 */
export function TacticalVideoPlayer({
  skill,
  game,
  stageCommand,
  apiVideo,
  ttlSeconds = VIDEO_CACHE_TTL_SECONDS,
  language,
  customSource,
  onOpenUpload,
}: TacticalVideoPlayerProps) {
  const copy = getUiCopy(language);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeSource: VideoSource | null = useMemo(() => {
    if (customSource) return customSource;
    return apiVideo?.source ?? null;
  }, [customSource, apiVideo]);

  const baseDuration = apiVideo?.durationSec ?? skill.durationSec;
  const baseAmbientRgb = game?.ambientRgb ?? DEFAULT_AMBIENT_RGB;

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(baseDuration);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ambientRgb, setAmbientRgb] = useState<AmbientColorRGB>(baseAmbientRgb);
  const [replayNonce, setReplayNonce] = useState(0);
  const [cacheEntry, setCacheEntry] = useState<CachedVideoEntry | null>(null);
  const [remainingTtl, setRemainingTtl] = useState<number>(ttlSeconds);

  const chapters: TutorialChapter[] = useMemo(() => {
    const rawChapters = apiVideo?.chapters ?? [];
    return rawChapters.map((ch, idx) => {
      const next = rawChapters[idx + 1];
      return {
        id: `${skill.id}-ch-${idx}`,
        index: idx + 1,
        title: resolveLocalizedText(ch.label, language),
        startTime: ch.timeSec,
        endTime: next ? next.timeSec : baseDuration,
        ambientColor: baseAmbientRgb,
        keyFormula: skill.code,
        caption: resolveLocalizedText(ch.overlayNote, language),
      };
    });
  }, [apiVideo, skill.id, skill.code, language, baseDuration, baseAmbientRgb]);

  useEffect(() => {
    if (!activeSource) return;
    setAmbientRgb(baseAmbientRgb);
    setCurrentTime(0);
    setDuration(baseDuration);
    setIsPlaying(true);
    setReplayNonce((n) => n + 1);

    const existing = sharedVideoCache.get(skill.gameId, skill.id);
    const entry =
      existing && existing.source.id === activeSource.id
        ? existing
        : sharedVideoCache.set(skill.gameId, skill.id, activeSource);
    setCacheEntry(entry);
    setRemainingTtl(getRemainingTtlSeconds(entry));
  }, [skill.gameId, skill.id, baseDuration, baseAmbientRgb, activeSource]);

  useEffect(() => {
    if (!cacheEntry) return;
    const id = window.setInterval(() => {
      setRemainingTtl(getRemainingTtlSeconds(cacheEntry));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cacheEntry]);

  useEffect(() => {
    if (!activeSource || activeSource.kind !== 'demo' || !isPlaying) return;
    const id = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.25 * playbackRate;
        if (next >= duration) {
          setReplayNonce((n) => n + 1);
          return 0;
        }
        return next;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [activeSource, isPlaying, playbackRate, duration]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const handleSeek = useCallback(
    (nextTime: number) => {
      const clamped = Math.max(0, Math.min(duration, nextTime));
      setCurrentTime(clamped);
      if (activeSource?.kind === 'demo') {
        setReplayNonce((n) => n + 1);
      }
    },
    [duration, activeSource],
  );

  const handleToggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    }
  }, []);

  const activeChapter = useMemo(() => {
    let current = chapters[0];
    for (const ch of chapters) {
      if (currentTime >= ch.startTime) current = ch;
    }
    return current;
  }, [chapters, currentTime]);

  const ambientGlow = useMemo(
    () => computeAmbientGlow(ambientRgb, 'cinema', isPlaying),
    [ambientRgb, isPlaying],
  );

  // Strict Hidden-Until-Ready guard: never render broken video container or fake demo when absent
  if (!activeSource) {
    return null;
  }

  const gameMatchedReel =
    activeSource.kind === 'demo' && stageCommand ? (
      <div className="relative h-full w-full bg-[#070A10]">
        <TacticalCanvas
          command={stageCommand}
          isPlaying={isPlaying}
          replayNonce={replayNonce}
        />
        {activeChapter && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto absolute inset-x-3 bottom-[96px] z-20 flex items-center justify-between gap-2.5 rounded-xl border border-white/12 bg-[#07090D]/90 px-3 py-1.5 backdrop-blur-md"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[11px] font-semibold text-white">
                {activeChapter.title}
                <span className="ml-2 font-sans font-normal text-slate-300">
                  — {activeChapter.caption}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {chapters.map((ch) => {
                const isCurrent = ch.id === activeChapter.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleSeek(ch.startTime)}
                    className={`min-h-[28px] rounded-lg px-2 font-mono text-[10px] tabular-nums transition-colors ${
                      isCurrent
                        ? 'bg-sky-400/20 text-sky-200 ring-1 ring-sky-400/50'
                        : 'bg-white/6 text-slate-300 hover:bg-white/12 hover:text-white'
                    }`}
                  >
                    {formatTimecode(ch.startTime)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    ) : undefined;

  const topOverlay = (
    <div
      onClick={(e) => e.stopPropagation()}
      className="pointer-events-auto absolute inset-x-3 top-2.5 z-20 flex flex-wrap items-center justify-between gap-2"
    >
      <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-[#07090D]/86 px-2.5 py-1.5 text-[11px]">
        {game && (
          <>
            <span className="font-semibold" style={{ color: game.accentHex }}>
              {game.shortName}
            </span>
            <span className="text-slate-500">·</span>
          </>
        )}
        <span className="font-mono tabular-nums text-slate-200">{skill.code}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <div
          data-testid="video-cache-ttl-badge"
          className="flex items-center gap-1.5 rounded-xl border border-white/12 bg-[#07090D]/86 px-2.5 py-1.5 font-mono text-[11px] tabular-nums text-slate-300"
        >
          <Clock className="h-3 w-3 text-sky-400" />
          <span>
            {copy.cacheTtlLabel}: {formatTtlCountdown(remainingTtl)}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenUpload}
          className="titanium-btn flex min-h-[30px] items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-medium text-slate-100 transition-colors"
        >
          <Upload className="h-3 w-3 text-sky-300" />
          <span className="hidden sm:inline">{copy.uploadMedia}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      data-testid="tactical-video-player"
      data-game-id={skill.gameId}
      data-stage-mode={stageCommand?.mode ?? 'stream'}
      data-cache-ttl={ttlSeconds}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-[#07090D]"
    >
      <ProjectionScreen
        embedded
        source={activeSource}
        ambientGlow={ambientGlow}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        playbackRate={playbackRate}
        isFullscreen={isFullscreen}
        customDemoRenderer={gameMatchedReel}
        customChapters={chapters}
        topOverlay={topOverlay}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onSetPlaying={setIsPlaying}
        onTimeUpdate={setCurrentTime}
        onDurationReady={setDuration}
        onSeek={handleSeek}
        onVolumeChange={(v) => {
          setVolume(v);
          if (v > 0 && isMuted) setIsMuted(false);
        }}
        onToggleMute={() => setIsMuted((m) => !m)}
        onPlaybackRateChange={setPlaybackRate}
        onToggleFullscreen={handleToggleFullscreen}
        onAmbientColorChange={setAmbientRgb}
        onOpenLoadModal={onOpenUpload}
      />
    </div>
  );
}
