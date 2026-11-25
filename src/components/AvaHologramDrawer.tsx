import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Mic, MicOff, SendHorizontal, X } from 'lucide-react';
import {
  resolveLocalizedText,
  type AvaAvatarConfig,
  type GameDefinition,
  type Language,
  type SkillSummary,
} from '../types/api';
import { fetchAvaConfig, resolveAssetUrl } from '../services/aigameriaApi';
import { delayWithAbort, type TimingSimulationProfile } from '../services/timingSimulator';
import { SoldierHologram } from '../modules/hologram/components/SoldierHologram';
import { HologramAudioEngine } from '../modules/hologram/utils/audioEngine';
import type { PointCloudData } from '../modules/hologram/utils/pointCloud';
import { loadGlbUrlToPointCloud } from '../modules/hologram/utils/glbLoader';
import {
  deriveAvaStyleVisualMood,
  resolveEffectiveHologramPhase,
} from '../modules/hologram/utils/avaStyleMapper';
import {
  deriveHologramVisualMood,
  detectMultilingualLanguage,
  isRtlLanguage,
} from '../modules/hologram/utils/personaPromptBuilder';
import { splitSubtitleSegments } from '../modules/hologram/utils/language';
import {
  VoicePipelineService,
  type ConversationTurn,
} from '../modules/hologram/services/voicePipelineService';
import {
  DEFAULT_VOICE_PERSONA,
  type GeminiVoiceName,
  type PipelinePhase,
  type ResolvedLanguage,
  type VoicePersonaState,
} from '../modules/hologram/types/voicePersona';
import type { AvaStatus, CoachMessage } from '../state/appMachine';

interface AvaHologramDrawerProps {
  open: boolean;
  status: AvaStatus;
  language: Language;
  activeGame: GameDefinition | null;
  activeSkill: SkillSummary | null;
  avaGameId: string | null;
  messages: CoachMessage[];
  timingProfile: TimingSimulationProfile;
  reloadNonce: number;
  autoSpeakText?: string | null;
  onAutoSpeakConsumed?: () => void;
  onClose: () => void;
  onStatusChange: (status: AvaStatus) => void;
  onHologramReadyChange: (ready: boolean, avaStatus: string, glbStatus: string) => void;
  onRecordMessages: (userText: string, avaReply: string) => void;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const UI_REVEAL_DELAY_MS = 1150;
const CLOSE_COLLAPSE_MS = 820;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function mapPhaseToAvaStatus(phase: PipelinePhase): AvaStatus {
  if (phase === 'listening' || phase === 'barge_in') return 'listening';
  if (phase === 'thinking') return 'thinking';
  if (phase === 'speaking') return 'speaking';
  return 'idle';
}

/**
 * Full-screen 3D holographic voice overlay (#030a14):
 * - Fetches style-matched `glb_url`, `style_key`, and `animation_state` directly from
 *   GET /api/v1/ava/{id} (strictly isolated per active game — never reuses a mismatched model).
 * - Stays strictly hidden until BOTH /api/v1/ava/{id} and its .GLB point-cloud mesh finish loading.
 * - Executes exact 2.6s bottom-to-top helical particle assembly on open & 0.78s collapse on close.
 */
export function AvaHologramDrawer({
  open,
  language,
  activeGame,
  activeSkill,
  avaGameId,
  timingProfile,
  reloadNonce,
  autoSpeakText,
  onAutoSpeakConsumed,
  onClose,
  onStatusChange,
  onHologramReadyChange,
  onRecordMessages,
}: AvaHologramDrawerProps) {
  const [isMounted, setIsMounted] = useState(open);
  const [stageOpen, setStageOpen] = useState(open);
  const [isUiRevealed, setIsUiRevealed] = useState(false);

  const [avaConfig, setAvaConfig] = useState<AvaAvatarConfig | null>(null);
  const [pointCloud, setPointCloud] = useState<PointCloudData | null>(null);
  const [modelMode, setModelMode] = useState<'loading' | 'glb' | 'error'>('loading');
  const [persona, setPersona] = useState<VoicePersonaState>(() => ({
    ...DEFAULT_VOICE_PERSONA,
    language: 'en',
  }));
  const [apiVoiceName, setApiVoiceName] = useState<GeminiVoiceName | undefined>(undefined);
  const [phase, setPhase] = useState<PipelinePhase>('idle');
  const [bargeInPulseNonce, setBargeInPulseNonce] = useState(0);
  const [subtitleText, setSubtitleText] = useState('');
  const [subtitleLang, setSubtitleLang] = useState<ResolvedLanguage>('en');
  const [subtitleTone, setSubtitleTone] = useState<'speech' | 'interim' | 'error'>('speech');
  const [isSoftwareGl, setIsSoftwareGl] = useState(false);
  const [inputText, setInputText] = useState('');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const historyRef = useRef<ConversationTurn[]>([]);
  const loadedKeyRef = useRef<string | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const subtitleHideTimerRef = useRef<number | null>(null);
  const personaRef = useRef(persona);
  personaRef.current = persona;
  const apiVoiceNameRef = useRef(apiVoiceName);
  apiVoiceNameRef.current = apiVoiceName;
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  const onHologramReadyChangeRef = useRef(onHologramReadyChange);
  onHologramReadyChangeRef.current = onHologramReadyChange;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const audioEngine = useMemo(() => new HologramAudioEngine(), []);
  const pipelineService = useMemo(() => new VoicePipelineService(), []);

  const baseMood = useMemo(() => deriveHologramVisualMood(persona), [persona]);
  const visualMood = useMemo(
    () =>
      deriveAvaStyleVisualMood(
        baseMood,
        avaConfig?.styleKey,
        avaConfig?.animationState,
      ),
    [baseMood, avaConfig?.styleKey, avaConfig?.animationState],
  );
  const effectivePhase = useMemo(
    () => resolveEffectiveHologramPhase(phase, avaConfig?.animationState),
    [phase, avaConfig?.animationState],
  );

  useEffect(() => {
    onStatusChangeRef.current(mapPhaseToAvaStatus(phase));
  }, [phase]);

  const showTransientSubtitle = useCallback(
    (
      text: string,
      lang: ResolvedLanguage,
      tone: 'speech' | 'interim' | 'error',
      autoHideMs = 0,
    ) => {
      if (subtitleHideTimerRef.current !== null) {
        window.clearTimeout(subtitleHideTimerRef.current);
        subtitleHideTimerRef.current = null;
      }
      setSubtitleText(text);
      setSubtitleLang(lang);
      setSubtitleTone(tone);
      if (autoHideMs > 0) {
        subtitleHideTimerRef.current = window.setTimeout(() => {
          setSubtitleText('');
          subtitleHideTimerRef.current = null;
        }, autoHideMs);
      }
    },
    [],
  );

  const stopVoiceSession = useCallback(() => {
    pipelineService.interrupt();
    audioEngine.stop();
    audioEngine.stopMicMonitor();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort errors
      }
      recognitionRef.current = null;
    }
    setPhase('idle');
  }, [audioEngine, pipelineService]);

  const beginSmoothClose = useCallback(() => {
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    stopVoiceSession();
    setIsUiRevealed(false);
    setStageOpen(false);
    setSubtitleText('');

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setIsMounted(false);
      onCloseRef.current();
      return;
    }

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setIsMounted(false);
      onCloseRef.current();
    }, CLOSE_COLLAPSE_MS);
  }, [stopVoiceSession]);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsMounted(true);
      setStageOpen(true);
      setIsUiRevealed(false);
      audioEngine.unlock();

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        setIsUiRevealed(true);
      } else {
        revealTimerRef.current = window.setTimeout(() => {
          revealTimerRef.current = null;
          setIsUiRevealed(true);
        }, UI_REVEAL_DELAY_MS);
      }
    } else if (isMounted && stageOpen) {
      beginSmoothClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!isMounted || !stageOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        beginSmoothClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMounted, stageOpen, beginSmoothClose]);

  // Reset cached style-specific .GLB on explicit Timing Simulator replay
  useEffect(() => {
    if (reloadNonce > 0) {
      loadedKeyRef.current = null;
      setAvaConfig(null);
      setPointCloud(null);
      setModelMode('loading');
      onHologramReadyChangeRef.current(false, 'loading', 'idle');
    }
  }, [reloadNonce]);

  // Load style-specific AVA avatar from GET /api/v1/ava/{id} + GLTFLoader (strict game isolation)
  useEffect(() => {
    if (!avaGameId) {
      loadedKeyRef.current = null;
      setAvaConfig(null);
      setPointCloud(null);
      setModelMode('loading');
      onHologramReadyChangeRef.current(false, 'idle', 'idle');
      return;
    }

    const controller = new AbortController();

    const loadStyleMatchedAvatar = async () => {
      try {
        onHologramReadyChangeRef.current(false, 'loading', 'idle');
        const cfg = await fetchAvaConfig(avaGameId, language, timingProfile, controller.signal);
        if (controller.signal.aborted) return;

        if (!cfg || !cfg.glbUrl) {
          loadedKeyRef.current = null;
          setAvaConfig(null);
          setPointCloud(null);
          setModelMode('error');
          onHologramReadyChangeRef.current(false, 'empty', 'empty');
          if (open) {
            showTransientSubtitle(
              'No style-matched .GLB avatar configured for this game.',
              'en',
              'error',
            );
          }
          return;
        }

        setAvaConfig(cfg);
        if (cfg.voiceName) {
          setApiVoiceName(cfg.voiceName as GeminiVoiceName);
        }
        if (cfg.personaTone) {
          setPersona((prev) => ({ ...prev, tone: cfg.personaTone as VoicePersonaState['tone'] }));
        }

        const resolvedGlbUrl = resolveAssetUrl(cfg.glbUrl);
        const cacheKey = `${avaGameId}::${cfg.styleKey}::${resolvedGlbUrl}`;

        if (loadedKeyRef.current === cacheKey && pointCloud) {
          setModelMode('glb');
          onHologramReadyChangeRef.current(true, 'ready', 'ready');
          return;
        }

        // Clear any stale model from a previous game immediately (zero cross-game leakage)
        setPointCloud(null);
        setModelMode('loading');
        onHologramReadyChangeRef.current(false, 'ready', 'loading');

        if (timingProfile.delaysMs.glbLoad > 0) {
          await delayWithAbort(timingProfile.delaysMs.glbLoad, controller.signal);
        }

        const loaded = await loadGlbUrlToPointCloud(resolvedGlbUrl);
        if (controller.signal.aborted) return;

        loadedKeyRef.current = cacheKey;
        setPointCloud(loaded.cloud);
        setModelMode('glb');
        onHologramReadyChangeRef.current(true, 'ready', 'ready');
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : 'Failed to load style-matched .GLB avatar.';
        console.error('[AVA /api/v1/ava .GLB Pipeline Error]', err);
        loadedKeyRef.current = null;
        setPointCloud(null);
        setModelMode('error');
        onHologramReadyChangeRef.current(false, 'error', 'error');
        if (open) {
          showTransientSubtitle(`3D avatar failed to load: ${message}`, 'en', 'error');
        }
      }
    };

    void loadStyleMatchedAvatar();
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avaGameId, language, timingProfile, reloadNonce]);

  useEffect(() => {
    audioEngine.setVadConfig(
      persona.pipeline.vadThreshold,
      persona.pipeline.vadEnabled && persona.pipeline.bargeInEnabled
        ? () => {
            pipelineService.interrupt();
            setBargeInPulseNonce((n) => n + 1);
            setPhase('barge_in');
          }
        : null,
    );
  }, [
    audioEngine,
    persona.pipeline.bargeInEnabled,
    persona.pipeline.vadEnabled,
    persona.pipeline.vadThreshold,
    pipelineService,
  ]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      if (subtitleHideTimerRef.current !== null) window.clearTimeout(subtitleHideTimerRef.current);
      stopVoiceSession();
      audioEngine.dispose();
    };
  }, [stopVoiceSession, audioEngine]);

  const speakWithHologram = useCallback(
    async (
      replyText: string,
      resolvedLang: ResolvedLanguage,
      routingPlan: Awaited<ReturnType<VoicePipelineService['sendTurn']>>['routingPlan'],
    ) => {
      const segments = splitSubtitleSegments(replyText, 110);
      showTransientSubtitle(segments[0] ?? replyText, resolvedLang, 'speech', 0);
      setPhase('speaking');

      const updateSegment = (ratio: number) => {
        if (segments.length <= 1) return;
        const idx = Math.min(segments.length - 1, Math.floor(ratio * segments.length));
        setSubtitleText(segments[idx]);
      };

      const curPersona = personaRef.current;
      try {
        const tts = await pipelineService.synthesizeSpeech({
          text: replyText,
          lang: resolvedLang,
          persona: curPersona,
          routingPlan,
          voiceNameOverride: apiVoiceNameRef.current,
        });
        if (tts.audioBase64) {
          await audioEngine.playBase64Audio(tts.audioBase64, updateSegment, {
            speed: curPersona.speed,
            pitch: curPersona.pitch,
            lang: resolvedLang,
          });
          setPhase((cur) => (cur === 'speaking' ? 'idle' : cur));
          showTransientSubtitle(
            segments[segments.length - 1] ?? replyText,
            resolvedLang,
            'speech',
            3600,
          );
          return;
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }

      try {
        await audioEngine.speakWithSpeechSynthesis(replyText, resolvedLang, updateSegment, {
          speed: curPersona.speed,
          pitch: curPersona.pitch,
          lang: resolvedLang,
        });
      } finally {
        setPhase((cur) => (cur === 'speaking' ? 'idle' : cur));
        showTransientSubtitle(
          segments[segments.length - 1] ?? replyText,
          resolvedLang,
          'speech',
          3600,
        );
      }
    },
    [audioEngine, pipelineService, showTransientSubtitle],
  );

  // Auto-speak API-provided voice walkthrough explanation once style-matched .GLB is ready & open
  useEffect(() => {
    const trimmed = autoSpeakText?.trim();
    if (!open || !trimmed || modelMode !== 'glb') return;
    onAutoSpeakConsumed?.();
    const detectedLang = detectMultilingualLanguage(
      trimmed,
      'auto',
      language === 'fa' ? 'fa' : 'en',
    );
    const timer = window.setTimeout(() => {
      void speakWithHologram(trimmed, detectedLang, {
        primaryEngine: detectedLang === 'fa' ? 'f5-tts-persian' : 'cosyvoice2',
        fallbackChain: ['browser-speech'],
        geminiVoice: apiVoiceNameRef.current ?? 'Kore',
        styleDirective: avaConfig?.styleKey ?? 'story',
        usesZeroShotCloning: false,
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [autoSpeakText, language, modelMode, onAutoSpeakConsumed, open, speakWithHologram]);

  const sendMessage = useCallback(
    async (rawPrompt: string) => {
      const trimmed = rawPrompt.trim();
      if (!trimmed) return;

      audioEngine.unlock();
      audioEngine.stop();
      pipelineService.interrupt();

      setPhase('thinking');
      showTransientSubtitle('Thinking...', 'en', 'interim', 0);

      const gameLabel =
        (activeGame ? resolveLocalizedText(activeGame.name, 'en') : '') ||
        activeSkill?.gameId ||
        'Active Game';
      const contextLines: string[] = [];
      if (activeSkill) {
        const skillLabel = resolveLocalizedText(activeSkill.title, 'en') || activeSkill.code;
        contextLines.push(`Active Game: ${gameLabel} (gameId=${activeSkill.gameId}).`);
        contextLines.push(`Active Topic: ${skillLabel} (${activeSkill.code}).`);
        contextLines.push(
          `Stay strictly within ${gameLabel} tactics and inputs; never mention unrelated games.`,
        );
      }
      if (avaConfig?.styleKey) {
        contextLines.push(`Avatar Style: ${avaConfig.styleKey}.`);
      }
      contextLines.push(
        language && language !== 'en'
          ? `Selected UI language code is "${language}". Match the user's spoken/written language naturally.`
          : 'Respond concisely in clear English.',
      );

      try {
        const turn = await pipelineService.sendTurn({
          message: trimmed,
          history: historyRef.current,
          persona: personaRef.current,
          contextNote: contextLines.join(' '),
        });

        historyRef.current = [
          ...historyRef.current.slice(-8),
          { role: 'user', text: trimmed },
          { role: 'model', text: turn.reply },
        ];
        onRecordMessages(trimmed, turn.reply);
        await speakWithHologram(turn.reply, turn.lang, turn.routingPlan);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const fallbackMsg =
          err instanceof Error ? err.message : 'Unable to reach live voice service.';
        showTransientSubtitle(fallbackMsg, 'en', 'error', 5000);
        setPhase('idle');
      }
    },
    [
      activeGame,
      activeSkill,
      audioEngine,
      avaConfig?.styleKey,
      language,
      onRecordMessages,
      pipelineService,
      showTransientSubtitle,
      speakWithHologram,
    ],
  );

  const toggleMicrophone = useCallback(() => {
    audioEngine.unlock();

    if (phase === 'listening' || phase === 'barge_in') {
      stopVoiceSession();
      setSubtitleText('');
      return;
    }

    const wasInterrupting = phase === 'speaking' || phase === 'thinking';
    if (wasInterrupting) {
      pipelineService.interrupt();
      audioEngine.stop();
      setBargeInPulseNonce((n) => n + 1);
    }

    const SpeechCtor = getSpeechRecognitionCtor();
    if (!SpeechCtor) {
      showTransientSubtitle(
        'Live microphone speech recognition is unavailable here. Type your message below.',
        'en',
        'error',
        4500,
      );
      return;
    }

    void audioEngine.startMicMonitor();

    try {
      const recognition = new SpeechCtor();
      recognition.lang = language === 'fa' ? 'fa-IR' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let interim = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const res = event.results[i];
          const transcript = res?.[0]?.transcript ?? '';
          if (res?.isFinal) finalText += transcript;
          else interim += transcript;
        }
        if (interim.trim()) {
          showTransientSubtitle(interim.trim(), 'en', 'interim', 0);
        }
        if (finalText.trim()) {
          audioEngine.stopMicMonitor();
          recognitionRef.current = null;
          void sendMessage(finalText.trim());
        }
      };

      recognition.onerror = () => {
        audioEngine.stopMicMonitor();
        recognitionRef.current = null;
        setPhase('idle');
        showTransientSubtitle(
          'Microphone capture was unavailable. Type your message below.',
          'en',
          'error',
          4500,
        );
      };

      recognition.onend = () => {
        audioEngine.stopMicMonitor();
        recognitionRef.current = null;
        setPhase((cur) => (cur === 'listening' || cur === 'barge_in' ? 'idle' : cur));
      };

      recognitionRef.current = recognition;
      setPhase(wasInterrupting ? 'barge_in' : 'listening');
      showTransientSubtitle('Listening...', 'en', 'interim', 0);
      recognition.start();
    } catch {
      audioEngine.stopMicMonitor();
      recognitionRef.current = null;
      setPhase('idle');
      showTransientSubtitle('Unable to start microphone capture.', 'en', 'error', 4500);
    }
  }, [
    audioEngine,
    language,
    phase,
    pipelineService,
    sendMessage,
    showTransientSubtitle,
    stopVoiceSession,
  ]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    void sendMessage(text);
  };

  if (!isMounted) return null;

  const detectedInputLang = inputText.trim()
    ? detectMultilingualLanguage(inputText, 'auto', 'en')
    : 'en';
  const inputDir = isRtlLanguage(detectedInputLang) ? 'rtl' : 'ltr';
  const subtitleDir = isRtlLanguage(subtitleLang) ? 'rtl' : 'ltr';
  const glassClass = isSoftwareGl ? 'liquid-glass' : 'liquid-glass gpu-glass';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="3D Holographic Voice Overlay"
      dir="ltr"
      data-testid="hologram-fullscreen-overlay"
      data-state={stageOpen ? 'open' : 'closing'}
      data-ui-revealed={isUiRevealed ? 'true' : 'false'}
      data-model-mode={modelMode}
      data-ava-style-key={avaConfig?.styleKey ?? ''}
      data-ava-animation-state={avaConfig?.animationState ?? ''}
      data-ava-glb-url={avaConfig?.glbUrl ?? ''}
      className="fixed inset-0 z-50 h-dvh w-screen overflow-hidden bg-[#030a14] text-[#e6f7ff]"
    >
      {/* Full-Screen 3D Hologram Stage with Exact Bottom-to-Top Helical Assembly */}
      <SoldierHologram
        pointCloud={pointCloud}
        backgroundCloud={null}
        audioEngine={audioEngine}
        phase={effectivePhase}
        visualMood={visualMood}
        bargeInPulseNonce={bargeInPulseNonce}
        modelMode={modelMode}
        isOpen={stageOpen}
        onSoftwareGlDetected={setIsSoftwareGl}
        className="fixed inset-0 z-0 h-full w-full touch-none select-none"
      />

      {/* Minimal Top-Right Close (×) Control — Delayed Reveal */}
      <button
        type="button"
        onClick={beginSmoothClose}
        data-testid="close-hologram-btn"
        aria-label="Close hologram"
        tabIndex={isUiRevealed ? 0 : -1}
        className={`fixed top-4 right-4 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-cyan-200/65 transition-all duration-500 hover:bg-cyan-300/14 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300 sm:top-5 sm:right-6 ${
          isUiRevealed
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Delayed Minimal Bottom Stack */}
      <div
        aria-hidden={!isUiRevealed}
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-3 pb-5 transition-all duration-700 ease-out sm:px-6 sm:pb-7 ${
          isUiRevealed
            ? 'translate-y-0 opacity-100'
            : 'translate-y-6 opacity-0'
        }`}
      >
        {subtitleText && (
          <div
            data-testid="floating-subtitle"
            dir={subtitleDir}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto max-w-[min(600px,92vw)] rounded-2xl px-4 py-2 text-center text-sm leading-relaxed sm:text-[15px] ${
              subtitleDir === 'rtl' ? 'font-bilingual-rtl' : 'font-bilingual-ltr'
            } ${
              subtitleTone === 'error'
                ? 'bg-[#2a0c16]/85 text-rose-100 ring-1 ring-rose-400/35'
                : subtitleTone === 'interim'
                  ? 'bg-[#030a14]/75 text-cyan-100/85'
                  : 'bg-[#030a14]/82 text-[#eefbff] shadow-[0_6px_28px_rgba(0,0,0,0.65)]'
            }`}
          >
            {subtitleText}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          aria-label="Voice and text message"
          data-testid="hologram-chat-capsule"
          className={`${
            isUiRevealed ? 'pointer-events-auto' : 'pointer-events-none'
          } ${glassClass} flex h-14 w-full max-w-[min(560px,94vw)] items-center gap-1.5 rounded-full px-2 sm:h-[58px] sm:gap-2 sm:px-2.5`}
        >
          <button
            type="button"
            onClick={toggleMicrophone}
            tabIndex={isUiRevealed ? 0 : -1}
            data-testid="hologram-mic-btn"
            aria-label={
              phase === 'listening' || phase === 'barge_in'
                ? 'Stop voice input'
                : phase === 'speaking'
                  ? 'Interrupt and speak'
                  : 'Start voice input'
            }
            aria-pressed={phase === 'listening' || phase === 'barge_in'}
            className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
              phase === 'listening' || phase === 'barge_in'
                ? 'bg-cyan-300/25 text-white ring-1 ring-cyan-200/75'
                : phase === 'speaking'
                  ? 'bg-rose-400/18 text-rose-100 ring-1 ring-rose-300/45 hover:bg-rose-400/30'
                  : 'text-cyan-100/85 hover:bg-cyan-300/14 hover:text-white'
            }`}
          >
            {phase === 'listening' || phase === 'barge_in' ? (
              <MicOff className="h-[19px] w-[19px]" aria-hidden="true" />
            ) : (
              <Mic className="h-[19px] w-[19px]" aria-hidden="true" />
            )}
          </button>

          <label htmlFor="hologram-chat-input" className="sr-only">
            Message
          </label>
          <input
            id="hologram-chat-input"
            type="text"
            value={inputText}
            dir={inputDir}
            tabIndex={isUiRevealed ? 0 : -1}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Speak or type a message..."
            autoComplete="off"
            className={`min-w-0 flex-1 bg-transparent px-2 text-sm text-cyan-50 placeholder:text-cyan-200/45 focus:outline-none sm:text-[15px] ${
              inputDir === 'rtl' ? 'font-bilingual-rtl text-right' : 'font-bilingual-ltr text-left'
            }`}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || phase === 'thinking'}
            tabIndex={isUiRevealed ? 0 : -1}
            data-testid="hologram-send-btn"
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-cyan-300/20 text-cyan-50 ring-1 ring-cyan-200/35 transition-all duration-150 hover:bg-cyan-300/30 hover:text-white active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-300/8 disabled:text-cyan-200/35 disabled:ring-cyan-200/12"
          >
            <SendHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}
