import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Camera,
  Check,
  Clock,
  Contrast,
  Crop,
  Film,
  Link2,
  Loader2,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  GameDefinition,
  Language,
  LightweightMediaPayload,
  MediaAnalysisResponse,
  ScreenCropPresetId,
  SkillSummary,
} from '../types/api';
import { getUiCopy } from '../data/i18n';
import { postMediaAnalyze } from '../services/aigameriaApi';
import type { TimingSimulationProfile } from '../services/timingSimulator';
import { preprocessUploadedMedia } from '../modules/media/lightweightPreprocess';
import {
  formatFileSize,
  parseVideoUrl,
  type VideoSource,
} from '../modules/projector/utils/media';
import {
  formatTtlCountdown,
  getRemainingTtlSeconds,
  sharedVideoCache,
} from '../modules/media/videoCache';
import { DRAWER_VARIANTS, ENTER_FROM_BOTTOM, SPRINGS } from '../motion/transitions';

interface MediaUploadModalProps {
  open: boolean;
  language: Language;
  activeGame: GameDefinition | null;
  activeSkill: SkillSummary | null;
  timingProfile: TimingSimulationProfile;
  onClose: () => void;
  onBeginAnalysis: () => void;
  onAnalysisResolved: (result: MediaAnalysisResponse) => void;
  onAnalysisFailed: () => void;
  onAttachSource: (source: VideoSource) => void;
}

const CROP_PRESET_IDS: ScreenCropPresetId[] = ['full', 'tv-16-9', 'center-focus'];

/**
 * TV/Monitor Screen Scanner & 8h Free-Stream Link Modal:
 * - Performs lightweight client-side pre-pass in browser memory BEFORE uploading:
 *   downscales images (<=960px), enhances TV/monitor contrast, applies optional
 *   screen-crop presets (Full / 16:9 TV / Center Focus), and extracts up to 3 compact
 *   keyframes (<=640px) from short clips with selectable frames (zero heavy local video retained).
 * - Sends ONLY the lean keyframes + user question (`lang=fa` / `lang=en` / any ISO code)
 *   to POST /api/v1/media/analyze.
 * - Triggers `onBeginAnalysis()` immediately before posting so all dependent result cards
 *   from any previous game are hidden until `/api/v1/media/analyze` confirms the detected game.
 */
export function MediaUploadModal({
  open,
  language,
  activeGame,
  activeSkill,
  timingProfile,
  onClose,
  onBeginAnalysis,
  onAnalysisResolved,
  onAnalysisFailed,
  onAttachSource,
}: MediaUploadModalProps) {
  const copy = getUiCopy(language);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedFileRef = useRef<File | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [mode, setMode] = useState<'scan' | 'stream'>('scan');
  const [contrastEnhanced, setContrastEnhanced] = useState(true);
  const [cropPreset, setCropPreset] = useState<ScreenCropPresetId>('tv-16-9');
  const [leanPayload, setLeanPayload] = useState<LightweightMediaPayload | null>(null);
  const [selectedFrameIndices, setSelectedFrameIndices] = useState<number[]>([0]);
  const [question, setQuestion] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<'idle' | 'preprocessing' | 'analyzing'>(
    'idle',
  );

  const cachedEntries = open ? sharedVideoCache.listValid() : [];

  // Reset modal transient capture state when closed so heavy memory is never retained
  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      abortRef.current = null;
      selectedFileRef.current = null;
      setLeanPayload(null);
      setSelectedFrameIndices([0]);
      setProcessingState('idle');
      setError(null);
      setMode('scan');
    }
  }, [open]);

  const runClientPrepass = useCallback(
    async (file: File, nextContrast: boolean, nextCrop: ScreenCropPresetId) => {
      setError(null);
      setProcessingState('preprocessing');
      try {
        const processed = await preprocessUploadedMedia(file, {
          contrastEnhanced: nextContrast,
          cropPreset: nextCrop,
        });
        setLeanPayload(processed);
        setSelectedFrameIndices(processed.keyframes.map((_, idx) => idx));
      } catch (err) {
        setLeanPayload(null);
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to optimize selected screen image or video.',
        );
      } finally {
        setProcessingState('idle');
      }
    },
    [],
  );

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    selectedFileRef.current = file;
    await runClientPrepass(file, contrastEnhanced, cropPreset);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleContrast = async () => {
    const next = !contrastEnhanced;
    setContrastEnhanced(next);
    if (selectedFileRef.current && processingState === 'idle') {
      await runClientPrepass(selectedFileRef.current, next, cropPreset);
    }
  };

  const handleSelectCropPreset = async (preset: ScreenCropPresetId) => {
    if (preset === cropPreset) return;
    setCropPreset(preset);
    if (selectedFileRef.current && processingState === 'idle') {
      await runClientPrepass(selectedFileRef.current, contrastEnhanced, preset);
    }
  };

  const handleToggleKeyframe = (idx: number) => {
    setSelectedFrameIndices((prev) => {
      if (prev.includes(idx)) {
        // Keep at least one frame selected
        return prev.length > 1 ? prev.filter((i) => i !== idx) : prev;
      }
      return [...prev, idx].sort((a, b) => a - b);
    });
  };

  const handleAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leanPayload || processingState !== 'idle') return;

    const chosenFrames = leanPayload.keyframes.filter((_, idx) =>
      selectedFrameIndices.includes(idx),
    );
    const activeQuestion = question.trim() || copy.questionPlaceholder;

    setError(null);
    setProcessingState('analyzing');
    // Immediately clear/hide stale dependent results from any previous game
    onBeginAnalysis();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await postMediaAnalyze({
        payload: leanPayload,
        selectedKeyframes: chosenFrames.length > 0 ? chosenFrames : leanPayload.keyframes,
        question: activeQuestion,
        language,
        hintGameId: activeGame?.id ?? null,
        timing: timingProfile,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      // If API included an 8h free-stream URL inline, cache ONLY the lightweight link reference
      if (response.streamUrl) {
        const parsed = parseVideoUrl(response.streamUrl);
        const source: VideoSource = parsed.ok
          ? {
              ...parsed.source,
              title: leanPayload.fileName.replace(/\.[a-z0-9]{2,5}$/i, ''),
              subtitle: `${response.game.shortName} · 8h TTL`,
            }
          : {
              id: `stream-${Date.now()}`,
              kind: 'native',
              title: leanPayload.fileName.replace(/\.[a-z0-9]{2,5}$/i, ''),
              src: response.streamUrl,
            };
        sharedVideoCache.set(response.gameId, response.topicId, source);
      }

      // Release original file handle immediately after sending lean payload
      selectedFileRef.current = null;
      setProcessingState('idle');
      onAnalysisResolved(response);
    } catch (err) {
      if (controller.signal.aborted) return;
      setProcessingState('idle');
      onAnalysisFailed();
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reach /api/v1/media/analyze right now.',
      );
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSkill) return;
    const outcome = parseVideoUrl(urlInput);
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    setError(null);
    // Store only lightweight 8h free-stream URL reference (zero local video download)
    sharedVideoCache.set(activeSkill.gameId, activeSkill.id, outcome.source);
    setUrlInput('');
    onAttachSource(outcome.source);
  };

  const selectedFramesCount = selectedFrameIndices.length;
  const selectedFramesBytes = leanPayload
    ? leanPayload.keyframes
        .filter((_, idx) => selectedFrameIndices.includes(idx))
        .reduce((sum, kf) => sum + kf.approxBytes, 0)
    : 0;
  const primaryPreviewFrame =
    leanPayload?.keyframes[selectedFrameIndices[0] ?? 0] ?? leanPayload?.keyframes[0] ?? null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={copy.uploadModalTitle}
            data-testid="media-upload-modal"
            variants={DRAWER_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/14 bg-[#0D1118] shadow-2xl brushed-titanium"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-display text-base font-semibold text-white">
                  {copy.uploadModalTitle}
                </h2>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                  {copy.uploadModalSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={copy.closeLabel}
                className="flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Clean Mode Switch (Scan TV / Puzzle vs 8h Stream URL when active skill exists) */}
            {activeSkill && (
              <div className="border-b border-white/8 px-5 py-2.5">
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#080B12] p-1">
                  <button
                    type="button"
                    data-testid="upload-tab-scan"
                    onClick={() => {
                      setMode('scan');
                      setError(null);
                    }}
                    className={`flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      mode === 'scan'
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{copy.scanTvMode}</span>
                  </button>
                  <button
                    type="button"
                    data-testid="upload-tab-stream"
                    onClick={() => {
                      setMode('stream');
                      setError(null);
                    }}
                    className={`flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      mode === 'stream'
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    <span>{copy.streamUrlMode}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4 overflow-y-auto px-5 py-5">
              {mode === 'scan' ? (
                <form onSubmit={handleAnalyzeSubmit} className="space-y-4">
                  <input
                    ref={fileInputRef}
                    data-testid="media-file-input"
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
                  />

                  {/* Dropzone / Capture Picker OR Lightweight Pre-Pass Preview */}
                  {!leanPayload ? (
                    <button
                      type="button"
                      data-testid="media-dropzone-btn"
                      disabled={processingState !== 'idle'}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-8 text-center transition-colors hover:border-sky-400/55 hover:bg-sky-500/[0.06] disabled:opacity-60"
                    >
                      {processingState === 'preprocessing' ? (
                        <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/12 text-sky-300">
                          <Camera className="h-5 w-5" />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-white">
                        {processingState === 'preprocessing'
                          ? copy.preprocessingScreen
                          : copy.dropZoneTitle}
                      </span>
                      <span className="text-xs text-slate-400">{copy.dropZoneHint}</span>
                    </button>
                  ) : (
                    <motion.div
                      variants={ENTER_FROM_BOTTOM}
                      initial="initial"
                      animate="animate"
                      data-testid="media-prepass-preview"
                      className="space-y-3 rounded-2xl border border-white/12 bg-[#080B12] p-3.5"
                    >
                      {/* Lightweight Downscaled Preview Thumbnail */}
                      {primaryPreviewFrame && (
                        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
                          <img
                            src={primaryPreviewFrame.dataUrl}
                            alt="Pre-processed TV screen preview"
                            className="max-h-48 w-full object-contain"
                          />
                          {processingState === 'preprocessing' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-xs">
                              <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
                            </div>
                          )}
                          <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-lg bg-black/75 px-2.5 py-1 font-mono text-[11px] text-slate-200">
                            <span>
                              {primaryPreviewFrame.width}×{primaryPreviewFrame.height}
                            </span>
                            <span className="text-emerald-300">
                              {formatFileSize(leanPayload.originalBytes)} →{' '}
                              {formatFileSize(selectedFramesBytes)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Client-Side TV Pre-Pass Controls: Contrast Boost + Screen Crop Presets */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          data-testid="toggle-tv-contrast"
                          aria-pressed={contrastEnhanced}
                          disabled={processingState !== 'idle'}
                          onClick={() => void handleToggleContrast()}
                          className={`flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors ${
                            contrastEnhanced
                              ? 'border-sky-400/55 bg-sky-500/18 text-sky-100'
                              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:text-white'
                          }`}
                        >
                          <Contrast className="h-3.5 w-3.5" />
                          <span>{copy.tvContrastLabel}</span>
                        </button>

                        <button
                          type="button"
                          disabled={processingState !== 'idle'}
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-medium text-sky-300 hover:text-sky-200"
                        >
                          {copy.changeCapture}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                          <Crop className="h-3.5 w-3.5 text-sky-400" />
                          <span>{copy.cropPresetLabel}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {CROP_PRESET_IDS.map((preset) => {
                            const active = cropPreset === preset;
                            return (
                              <button
                                key={preset}
                                type="button"
                                data-testid={`crop-preset-${preset}`}
                                aria-pressed={active}
                                disabled={processingState !== 'idle'}
                                onClick={() => void handleSelectCropPreset(preset)}
                                className={`min-h-[34px] rounded-xl border px-2 text-xs font-medium transition-colors ${
                                  active
                                    ? 'border-sky-400/60 bg-sky-500/20 text-sky-100'
                                    : 'border-white/10 bg-white/[0.025] text-slate-300 hover:text-white'
                                }`}
                              >
                                {copy.cropPresets[preset]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selectable Video Keyframe Strip (when short clip has multiple frames) */}
                      {leanPayload.keyframes.length > 1 && (
                        <div className="space-y-1.5 border-t border-white/8 pt-2.5">
                          <p className="text-[11px] text-slate-400">
                            {copy.selectKeyframesHint} ({selectedFramesCount}/
                            {leanPayload.keyframes.length})
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {leanPayload.keyframes.map((kf, idx) => {
                              const selected = selectedFrameIndices.includes(idx);
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  data-testid={`keyframe-select-${idx}`}
                                  aria-pressed={selected}
                                  onClick={() => handleToggleKeyframe(idx)}
                                  className={`relative overflow-hidden rounded-xl border transition-all ${
                                    selected
                                      ? 'border-sky-400 ring-1 ring-sky-400/50'
                                      : 'border-white/10 opacity-55 hover:opacity-90'
                                  }`}
                                >
                                  <img
                                    src={kf.dataUrl}
                                    alt={`Frame ${idx + 1}`}
                                    className="h-16 w-full object-cover"
                                  />
                                  <span className="absolute bottom-1 start-1 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] text-white">
                                    {kf.timestampSec.toFixed(1)}s
                                  </span>
                                  {selected && (
                                    <span className="absolute top-1 end-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-400 text-slate-950">
                                      <Check className="h-2.5 w-2.5" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* User Question Input (EN / FA / any language) */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="aigameria-scan-question"
                      className="block text-xs font-medium text-slate-300"
                    >
                      {copy.questionLabel}
                    </label>
                    <input
                      id="aigameria-scan-question"
                      data-testid="media-question-input"
                      type="text"
                      dir="auto"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder={copy.questionPlaceholder}
                      className="min-h-[46px] w-full rounded-2xl border border-white/12 bg-white/[0.04] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                    />
                  </div>

                  {error && (
                    <p
                      data-testid="media-analyze-error"
                      className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
                    >
                      {error}
                    </p>
                  )}

                  {/* Primary Analyze CTA */}
                  <motion.button
                    type="submit"
                    data-testid="media-analyze-submit"
                    whileTap={{ scale: 0.97 }}
                    transition={SPRINGS.tap}
                    disabled={!leanPayload || processingState !== 'idle'}
                    className="titanium-btn-primary flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {processingState === 'analyzing' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{copy.analyzingScreen}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>{copy.analyzeScreenAction}</span>
                        <Send className="h-3.5 w-3.5" />
                      </>
                    )}
                  </motion.button>
                </form>
              ) : (
                /* 8h TTL Free-Stream URL Tab (Zero Heavy Disk Download) */
                <div className="space-y-4">
                  <form onSubmit={handleUrlSubmit} className="space-y-2">
                    <label
                      htmlFor="aigameria-video-url"
                      className="block text-xs font-medium text-slate-300"
                    >
                      {copy.videoUrlLabel}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Link2 className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                          id="aigameria-video-url"
                          type="url"
                          value={urlInput}
                          onChange={(e) => {
                            setUrlInput(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder={copy.videoUrlPlaceholder}
                          className="min-h-[44px] w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pe-3 ps-9 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="min-h-[44px] rounded-xl bg-sky-500 px-4 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 whitespace-nowrap"
                      >
                        {copy.loadUrlAction}
                      </button>
                    </div>
                    {error && <p className="text-xs text-rose-400">{error}</p>}
                  </form>

                  {cachedEntries.length > 0 && (
                    <div className="space-y-2 border-t border-white/8 pt-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{copy.cachedVideosTitle}</span>
                        <span className="font-mono tabular-nums">28800s</span>
                      </div>
                      <div className="space-y-1.5">
                        {cachedEntries.slice(0, 4).map((entry) => (
                          <button
                            key={entry.cacheKey}
                            type="button"
                            onClick={() => onAttachSource(entry.source)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-start transition-colors hover:border-sky-400/40 hover:bg-white/[0.06]"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <Film className="h-4 w-4 shrink-0 text-sky-400" />
                              <div className="min-w-0">
                                <div className="truncate text-xs font-medium text-white">
                                  {entry.source.title}
                                </div>
                                <div className="truncate text-[11px] text-slate-400">
                                  {entry.gameId.toUpperCase()} · {entry.source.kind}
                                </div>
                              </div>
                            </div>
                            <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] tabular-nums text-slate-400">
                              <Clock className="h-3 w-3" />
                              {formatTtlCountdown(getRemainingTtlSeconds(entry))}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
