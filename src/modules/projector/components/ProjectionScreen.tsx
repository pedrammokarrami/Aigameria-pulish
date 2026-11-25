import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { AlertCircle, Play, Pause, Upload } from 'lucide-react';
import type { AmbientColorRGB, AmbientGlowSpec, VideoSource } from '../utils/media';
import type { TutorialChapter } from '../utils/tutorials';
import { VisionControls } from './VisionControls';

interface ProjectionScreenProps {
  source: VideoSource;
  ambientGlow: AmbientGlowSpec;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  embedded?: boolean;
  customDemoRenderer?: ReactNode;
  customChapters?: TutorialChapter[];
  topOverlay?: ReactNode;
  onTogglePlay: () => void;
  onSetPlaying: (playing: boolean) => void;
  onTimeUpdate: (time: number) => void;
  onDurationReady: (duration: number) => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onToggleFullscreen: () => void;
  onAmbientColorChange: (rgb: AmbientColorRGB) => void;
  onOpenLoadModal: () => void;
}

export function ProjectionScreen({
  source,
  ambientGlow,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  isFullscreen,
  embedded = false,
  customDemoRenderer,
  customChapters,
  topOverlay,
  onTogglePlay,
  onSetPlaying,
  onTimeUpdate,
  onDurationReady,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onPlaybackRateChange,
  onToggleFullscreen,
  onAmbientColorChange,
  onOpenLoadModal,
}: ProjectionScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const samplerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const [controlsVisible, setControlsVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nativeError, setNativeError] = useState<string | null>(null);
  const [centerFeedback, setCenterFeedback] = useState<'play' | 'pause' | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  // Reset native video error whenever source changes
  useEffect(() => {
    setNativeError(null);
    if (source.kind === 'youtube' || source.kind === 'vimeo') {
      onAmbientColorChange({ r: 126, g: 162, b: 210 });
    }
  }, [source.id, source.kind, onAmbientColorChange]);

  // Auto-hide controls after 4.2s of mouse idle while playing
  const scheduleAutoHide = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    setControlsVisible(true);
    if (isPlaying && !menuOpen) {
      idleTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 4200);
    }
  }, [isPlaying, menuOpen]);

  useEffect(() => {
    scheduleAutoHide();
    return () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [scheduleAutoHide]);

  // Sync native <video> element properties
  useEffect(() => {
    const el = videoRef.current;
    if (!el || source.kind !== 'native') return;
    el.volume = isMuted ? 0 : volume;
    el.muted = isMuted;
  }, [volume, isMuted, source.kind]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || source.kind !== 'native') return;
    el.playbackRate = playbackRate;
  }, [playbackRate, source.kind]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || source.kind !== 'native') return;
    if (isPlaying) {
      el.play().catch(() => {
        onSetPlaying(false);
      });
    } else {
      el.pause();
    }
  }, [isPlaying, source.kind, source.src, onSetPlaying]);

  // Sample average frame luminance/color from native local video for realistic wall light bleed
  useEffect(() => {
    if (source.kind !== 'native' || !isPlaying) return;
    const interval = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      try {
        if (!samplerCanvasRef.current) {
          samplerCanvasRef.current = document.createElement('canvas');
          samplerCanvasRef.current.width = 12;
          samplerCanvasRef.current.height = 8;
        }
        const ctx = samplerCanvasRef.current.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, 12, 8);
        const data = ctx.getImageData(0, 0, 12, 8).data;
        let r = 0;
        let g = 0;
        let b = 0;
        const count = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        onAmbientColorChange({
          r: Math.max(70, Math.round(r / count)),
          g: Math.max(80, Math.round(g / count)),
          b: Math.max(95, Math.round(b / count)),
        });
      } catch {
        // Cross-origin video frames cannot be sampled; keep calm neutral ambient glow
      }
    }, 900);
    return () => window.clearInterval(interval);
  }, [source.kind, isPlaying, onAmbientColorChange]);

  const handleVideoSurfaceClick = () => {
    if (source.kind === 'youtube' || source.kind === 'vimeo') return;
    scheduleAutoHide();
    const nextPlaying = !isPlaying;
    onTogglePlay();
    setCenterFeedback(nextPlaying ? 'play' : 'pause');
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setCenterFeedback(null);
    }, 480);
  };

  const handleSeekInternal = (time: number) => {
    onSeek(time);
    if (source.kind === 'native' && videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const effectiveChapters = customChapters;

  const isEmbed = source.kind === 'youtube' || source.kind === 'vimeo';

  const screenFrame = (
    <div
      data-testid="projection-screen"
      className={embedded ? 'relative flex h-full w-full flex-col' : 'relative flex flex-col items-center'}
      style={
        embedded
          ? undefined
          : {
              width: 'min(95vw, calc((100vh - 168px) * 16 / 9))',
            }
      }
    >
      {/* Pull-down anodized top motorized roller housing */}
      <div
        aria-hidden="true"
        className="relative z-20 -mb-[2px] flex h-[10px] w-full items-center justify-between rounded-t-[4px] rounded-b-[2px] border border-white/14 bg-gradient-to-b from-[#3b404b] via-[#22262e] to-[#12141a] px-2 shadow-[0_6px_16px_rgba(0,0,0,0.62)]"
      >
        <span className="h-[3px] w-3 rounded-full bg-white/15" />
        <span className="h-[1.5px] w-16 rounded-full bg-white/12" />
        <span className="h-[3px] w-3 rounded-full bg-white/15" />
      </div>

      {/* Crisp matte-black aluminum projection frame with ambient screen light bleed */}
      <div
        className={`relative w-full rounded-[3px] bg-[#111318] p-[5px] sm:p-[7px] ring-1 ring-white/12 transition-shadow duration-700 ${
          embedded ? 'flex-1 min-h-0' : 'aspect-video'
        }`}
        style={{
          boxShadow: `0 0 42px 6px ${ambientGlow.primaryRgba}, 0 0 90px 18px ${ambientGlow.secondaryRgba}, 0 18px 36px -8px rgba(0, 0, 0, 0.72)`,
        }}
      >
        <div className="matte-screen-surface relative h-full w-full p-[2px] shadow-[inset_0_1px_4px_rgba(15,23,42,0.18)]">
          <div
            data-testid="video-container-16-9"
            onMouseMove={scheduleAutoHide}
            onPointerMove={scheduleAutoHide}
            onFocusCapture={scheduleAutoHide}
            onMouseLeave={() => {
              if (isPlaying && !menuOpen) setControlsVisible(false);
            }}
            onClick={handleVideoSurfaceClick}
            className={`relative h-full w-full overflow-hidden bg-[#080B12] ${
              !isEmbed && !controlsVisible && isPlaying ? 'cursor-none' : 'cursor-default'
            }`}
          >
            {/* Optional top status/chapter overlay passed by host */}
            {topOverlay}

            {/* 1. API-supplied tactical projection renderer */}
            {source.kind === 'demo' && customDemoRenderer && (
              <div className="h-full w-full">{customDemoRenderer}</div>
            )}

              {/* 2. Native HTML5 video player (Direct URL or Local File) */}
              {source.kind === 'native' && source.src && (
                <>
                  <video
                    ref={videoRef}
                    src={source.src}
                    playsInline
                    preload="metadata"
                    crossOrigin={source.isLocalFile ? undefined : 'anonymous'}
                    onLoadedMetadata={(e) => {
                      const dur = e.currentTarget.duration;
                      if (Number.isFinite(dur) && dur > 0) {
                        onDurationReady(dur);
                      }
                    }}
                    onTimeUpdate={(e) => {
                      onTimeUpdate(e.currentTarget.currentTime);
                    }}
                    onEnded={() => onSetPlaying(false)}
                    onError={() => {
                      setNativeError(
                        'This video link could not be played directly in the browser. Verify the direct file URL (MP4/WebM) or upload a local video file.'
                      );
                      onSetPlaying(false);
                    }}
                    className="block h-full w-full object-contain bg-[#111318] brightness-[1.07] contrast-[1.06] saturate-[1.04]"
                  />

                  {nativeError && (
                    <div
                      role="alert"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/92 px-6 text-center"
                    >
                      <AlertCircle className="h-9 w-9 text-amber-400" />
                      <h2 className="mt-3 text-base font-semibold text-zinc-100">
                        Unable to play video source
                      </h2>
                      <p className="mt-1.5 max-w-md text-sm text-zinc-400">{nativeError}</p>
                      <button
                        type="button"
                        onClick={onOpenLoadModal}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/16"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Load Another Video</span>
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* 3. YouTube / Vimeo embedded 16:9 player */}
              {isEmbed && source.embedUrl && (
                <iframe
                  src={source.embedUrl}
                  title={source.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="block h-full w-full border-0 bg-black brightness-[1.05] contrast-[1.04]"
                />
              )}

              {/* Brief VisionOS center Play/Pause feedback badge */}
              {centerFeedback && !isEmbed && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-1/2 z-20 flex h-14 w-14 sm:h-16 sm:w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 vision-glass text-white"
                >
                  {centerFeedback === 'play' ? (
                    <Play className="h-6 w-6 translate-x-[1px] fill-current" />
                  ) : (
                    <Pause className="h-6 w-6 fill-current" />
                  )}
                </div>
              )}

              {/* VisionOS Glassmorphic Video Controls (auto-hides on idle) */}
              {!isEmbed && !nativeError && (
                <VisionControls
                  visible={controlsVisible || !isPlaying}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  volume={volume}
                  isMuted={isMuted}
                  playbackRate={playbackRate}
                  isFullscreen={isFullscreen}
                  title={source.title}
                  chapters={effectiveChapters}
                  onTogglePlay={onTogglePlay}
                  onSeek={handleSeekInternal}
                  onVolumeChange={onVolumeChange}
                  onToggleMute={onToggleMute}
                  onPlaybackRateChange={onPlaybackRateChange}
                  onToggleFullscreen={onToggleFullscreen}
                  onInteraction={scheduleAutoHide}
                  onMenuOpenChange={setMenuOpen}
                />
              )}
            </div>
          </div>
        </div>

        {/* Weighted matte-black bottom tension bar */}
        <div
          aria-hidden="true"
          className="relative z-20 -mt-[1px] flex h-[6px] w-full items-center justify-center rounded-b-[3px] bg-gradient-to-b from-[#171920] to-[#2e333e] shadow-[0_6px_14px_rgba(0,0,0,0.58)]"
        >
          <span className="h-[3px] w-7 translate-y-[2px] rounded-b-sm bg-[#272b34] ring-1 ring-white/10" />
        </div>
      </div>
  );

  if (embedded) {
    return (
      <div className="relative flex h-full w-full items-stretch justify-stretch p-1.5 sm:p-2">
        {screenFrame}
      </div>
    );
  }

  return (
    <main
      className="relative z-10 flex h-screen w-screen items-center justify-center px-[2.5vw] pt-[68px] pb-[78px] sm:pt-[76px] sm:pb-[86px]"
      aria-label="Projection training screen"
    >
      {screenFrame}
    </main>
  );
}
