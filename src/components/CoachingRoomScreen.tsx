import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ChevronRight,
  Gamepad2,
  Map as MapIcon,
  Pause,
  Play,
  RotateCcw,
  Send,
  Video,
  Volume2,
} from 'lucide-react';
import {
  resolveLocalizedText,
  type GameDefinition,
  type Language,
  type SkillCoachingPayload,
  type SkillControllerPayload,
  type SkillSummary,
  type SkillVideoPayload,
} from '../types/api';
import { getUiCopy } from '../data/i18n';
import { TacticalCanvas } from '../modules/analyz/canvas/TacticalCanvas';
import { WeaponStatsOverlay } from '../modules/analyz/components/WeaponStatsOverlay';
import type { AttachmentSlot, StageCommand, WeaponStats } from '../modules/analyz/engine/types';
import type { DeviceType } from '../modules/gamepad/types/trainer';
import type { VideoSource } from '../modules/projector/utils/media';
import type { AvaStatus, CoachMessage, StageTabId } from '../state/appMachine';
import {
  ENTER_FROM_BOTTOM,
  ENTER_FROM_RIGHT,
  ENTER_FROM_TOP,
  REVEAL_BEHIND_MENU,
  SCREEN_VARIANTS,
  SPRINGS,
  STAGE_PANEL_VARIANTS,
} from '../motion/transitions';
import { TacticalVideoPlayer } from './TacticalVideoPlayer';
import { ControllerGuideStage } from './ControllerGuideStage';
import { WorldLanguagePicker } from './WorldLanguagePicker';

interface CoachingRoomScreenProps {
  language: Language;
  skill: SkillSummary;
  game: GameDefinition | null;
  sameGameSkills: SkillSummary[];
  readyStageTabs: StageTabId[];
  stageCommand: StageCommand | null;
  baseStageCommand: StageCommand | null;
  videoPayload: SkillVideoPayload | null;
  controllerPayload: SkillControllerPayload | null;
  coachingPayload: SkillCoachingPayload | null;
  stageTab: StageTabId | null;
  controllerDevice: DeviceType;
  controllerMode: 'demo' | 'practice';
  avaStatus: AvaStatus;
  hologramReady: boolean;
  customVideo?: VideoSource;
  messages: CoachMessage[];
  coachError: string | null;
  onBack: () => void;
  onSelectSkill: (skillId: string) => void;
  onSetLanguage: (lang: Language) => void;
  onSetStageTab: (tab: StageTabId) => void;
  onSetControllerDevice: (device: DeviceType) => void;
  onSetControllerMode: (mode: 'demo' | 'practice') => void;
  onCycleWeaponSlot: (slot: AttachmentSlot) => void;
  onOpenUpload: () => void;
  onLaunchAvaVoiceExplanation: (text: string) => void;
  onSendPrompt: (prompt: string) => Promise<void>;
}

const STAGE_TAB_META: Record<StageTabId, { icon: typeof MapIcon }> = {
  tactical: { icon: MapIcon },
  video: { icon: Video },
  controller: { icon: Gamepad2 },
};

export function CoachingRoomScreen({
  language,
  skill,
  game,
  sameGameSkills,
  readyStageTabs,
  stageCommand,
  baseStageCommand,
  videoPayload,
  controllerPayload,
  coachingPayload,
  stageTab,
  controllerDevice,
  controllerMode,
  avaStatus,
  hologramReady,
  customVideo,
  messages,
  coachError,
  onBack,
  onSelectSkill,
  onSetLanguage,
  onSetStageTab,
  onSetControllerDevice,
  onSetControllerMode,
  onCycleWeaponSlot,
  onOpenUpload,
  onLaunchAvaVoiceExplanation,
  onSendPrompt,
}: CoachingRoomScreenProps) {
  const copy = getUiCopy(language);

  const [stagePlaying, setStagePlaying] = useState(true);
  const [replayNonce, setReplayNonce] = useState(0);
  const [promptInput, setPromptInput] = useState('');

  const skillMessages = messages.filter((m) => m.skillId === skill.id);

  const weaponDeltas = useMemo<WeaponStats | null>(() => {
    if (!stageCommand || stageCommand.mode !== 'weapon') return null;
    if (!baseStageCommand || baseStageCommand.mode !== 'weapon') return null;
    const cur = stageCommand.payload.stats;
    const base = baseStageCommand.payload.stats;
    return {
      damage: cur.damage - base.damage,
      accuracy: cur.accuracy - base.accuracy,
      fireRate: cur.fireRate - base.fireRate,
      mobility: cur.mobility - base.mobility,
      control: cur.control - base.control,
    };
  }, [stageCommand, baseStageCommand]);

  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = promptInput.trim();
    if (!trimmed) return;
    setPromptInput('');
    await onSendPrompt(trimmed);
  };

  const showActiveStageSurface =
    (stageTab === 'tactical' && Boolean(stageCommand)) ||
    (stageTab === 'video' && Boolean(customVideo || videoPayload?.video)) ||
    (stageTab === 'controller' && Boolean(controllerPayload?.sequences));

  const showCoachingPanel = Boolean(coachingPayload) || skillMessages.length > 0;
  const voiceExplanationText = coachingPayload?.voiceExplanation
    ? resolveLocalizedText(coachingPayload.voiceExplanation, language).trim()
    : '';
  const symbolSequence = coachingPayload?.symbolSequence ?? [];

  return (
    <motion.div
      key="screen-coaching"
      variants={SCREEN_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      data-testid="coaching-room-screen"
      data-game-id={skill.gameId}
      data-stage-mode={stageCommand?.mode ?? 'pending'}
      data-ready-tabs={readyStageTabs.join(',')}
      className="flex min-h-screen flex-col bg-[#07090D] pb-24"
    >
      {/* Context Header — clean production header without top-right AVA or API Timing buttons */}
      <motion.header
        variants={ENTER_FROM_TOP}
        initial="initial"
        animate="animate"
        className="sticky top-0 z-20 border-b border-white/10 bg-[#090C12]/94 safe-top"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={SPRINGS.tap}
              onClick={onBack}
              aria-label={copy.backToBoard}
              className="titanium-btn flex min-h-[42px] items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-slate-100 whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{copy.backToBoard}</span>
            </motion.button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span
                  className="font-semibold"
                  style={{ color: game?.accentHex ?? '#38BDF8' }}
                >
                  {game ? resolveLocalizedText(game.name, language) : skill.gameId.toUpperCase()}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{skill.code}</span>
              </div>
              <h1 className="truncate font-display text-sm font-bold text-white sm:text-base">
                {resolveLocalizedText(skill.title, language)}
              </h1>
            </div>
          </div>

          <WorldLanguagePicker
            language={language}
            onSelectLanguage={onSetLanguage}
          />
        </div>
      </motion.header>

      {/* Unified Single-Screen Workspace */}
      <motion.main
        layout
        transition={SPRINGS.layout}
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 pt-4 sm:px-6 lg:grid lg:grid-cols-[1.45fr_0.95fr] lg:items-start"
      >
        <motion.section layout transition={SPRINGS.layout} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <AnimatePresence>
              {readyStageTabs.length > 0 && (
                <motion.div
                  key="stage-tab-bar"
                  layout
                  variants={ENTER_FROM_TOP}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  role="tablist"
                  aria-label="Coaching stage views"
                  data-testid="stage-tab-bar"
                  className="flex items-center gap-1 rounded-2xl border border-white/12 bg-[#0E131D] p-1 shadow-inner"
                >
                  <AnimatePresence mode="popLayout">
                    {readyStageTabs.map((id) => {
                      const Icon = STAGE_TAB_META[id].icon;
                      const active = stageTab === id;
                      return (
                        <motion.button
                          key={id}
                          layout
                          variants={REVEAL_BEHIND_MENU}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          role="tab"
                          type="button"
                          data-testid={`stage-tab-${id}`}
                          aria-selected={active}
                          onClick={() => onSetStageTab(id)}
                          className={`relative flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                            active ? 'text-slate-950' : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="stage-tab-indicator"
                              transition={SPRINGS.snappy}
                              className="absolute inset-0 rounded-xl bg-gradient-to-b from-sky-300 to-sky-500 shadow-[0_4px_16px_rgba(56,189,248,0.3)]"
                            />
                          )}
                          <Icon className="relative z-10 h-3.5 w-3.5" />
                          <span className="relative z-10">{copy.stageTabs[id]}</span>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {sameGameSkills.length > 1 && (
              <motion.div
                layout
                variants={REVEAL_BEHIND_MENU}
                initial="initial"
                animate="animate"
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
              >
                {sameGameSkills.map((item) => {
                  const active = item.id === skill.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectSkill(item.id)}
                      className={`min-h-[36px] rounded-xl px-3 font-mono text-xs font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'titanium-btn border-sky-400/60 text-sky-100'
                          : 'border border-white/8 bg-white/[0.03] text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.code}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {showActiveStageSurface && (
              <motion.div
                key="active-stage-container"
                layout
                layoutId="active-skill-shell"
                variants={ENTER_FROM_BOTTOM}
                initial="initial"
                animate="animate"
                exit="exit"
                className="relative overflow-hidden rounded-3xl border border-white/14 bg-[#0B0E15] shadow-2xl"
              >
                <div className="h-[380px] w-full sm:h-[460px] lg:h-[520px]">
                  <AnimatePresence mode="wait">
                    {stageTab === 'tactical' && stageCommand && (
                      <motion.div
                        key={`tactical-${skill.id}`}
                        variants={STAGE_PANEL_VARIANTS}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="relative h-full w-full"
                      >
                        <TacticalCanvas
                          command={stageCommand}
                          isPlaying={stagePlaying}
                          replayNonce={replayNonce}
                          onCycleWeaponSlot={onCycleWeaponSlot}
                        />

                        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2">
                          <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-white/14 bg-[#07090D]/90 p-1.5 shadow-lg">
                            <button
                              type="button"
                              onClick={() => setStagePlaying((p) => !p)}
                              aria-label={stagePlaying ? copy.pause : copy.play}
                              className="titanium-btn-primary flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-slate-950"
                            >
                              {stagePlaying ? (
                                <Pause className="h-3.5 w-3.5" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                              <span>{stagePlaying ? copy.pause : copy.play}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setReplayNonce((n) => n + 1)}
                              aria-label={copy.replay}
                              className="titanium-btn flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl text-slate-200"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {stageCommand.mode === 'weapon' && (
                            <div className="pointer-events-none rounded-xl border border-white/12 bg-[#07090D]/88 px-3 py-1.5 text-[11px] text-slate-300">
                              {copy.weaponClickHint}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {stageTab === 'video' && (customVideo || videoPayload?.video) && (
                      <motion.div
                        key={`video-${skill.id}`}
                        variants={STAGE_PANEL_VARIANTS}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="h-full w-full"
                      >
                        <TacticalVideoPlayer
                          skill={skill}
                          game={game}
                          stageCommand={stageCommand}
                          apiVideo={videoPayload?.video ?? null}
                          ttlSeconds={videoPayload?.ttlSeconds}
                          language={language}
                          customSource={customVideo}
                          onOpenUpload={onOpenUpload}
                        />
                      </motion.div>
                    )}

                    {stageTab === 'controller' && controllerPayload?.sequences && (
                      <motion.div
                        key={`controller-${skill.id}`}
                        variants={STAGE_PANEL_VARIANTS}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="h-full w-full"
                      >
                        <ControllerGuideStage
                          skill={skill}
                          controllerPayload={controllerPayload}
                          language={language}
                          device={controllerDevice}
                          mode={controllerMode}
                          onChangeDevice={onSetControllerDevice}
                          onChangeMode={onSetControllerMode}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {stageTab === 'tactical' && stageCommand?.mode === 'weapon' && (
                  <div className="border-t border-white/10 bg-[#0A0E17] p-3">
                    <WeaponStatsOverlay
                      stats={stageCommand.payload.stats}
                      deltas={weaponDeltas}
                      accent={game?.accentHex ?? '#F59E0B'}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <AnimatePresence mode="popLayout">
          {showCoachingPanel && (
            <motion.section
              key={`coaching-panel-${skill.id}`}
              layout
              variants={ENTER_FROM_RIGHT}
              initial="initial"
              animate="animate"
              exit="exit"
              aria-label={copy.coachingHeading}
              data-testid="coaching-steps-panel"
              className="flex flex-col justify-between rounded-3xl border border-white/12 bg-[#111621] p-5 shadow-2xl brushed-titanium"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-white/8 pb-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-semibold text-white">
                      {copy.coachingHeading}
                    </h2>
                    {coachingPayload && (
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {resolveLocalizedText(coachingPayload.summary, language)}
                      </p>
                    )}
                  </div>

                  {/* Style-Matched 3D .GLB Voice Explanation Trigger (strictly hidden until .GLB ready) */}
                  <AnimatePresence>
                    {hologramReady && voiceExplanationText && (
                      <motion.button
                        key="ava-voice-explain"
                        type="button"
                        data-testid="ava-explain-btn"
                        initial={{ opacity: 0, scale: 0.88, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileTap={{ scale: 0.95 }}
                        transition={SPRINGS.snappy}
                        onClick={() => onLaunchAvaVoiceExplanation(voiceExplanationText)}
                        className="titanium-btn-primary flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-slate-950 whitespace-nowrap"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>{copy.voiceWalkthroughAction}</span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Ordered Puzzle Symbol Sequence (API-driven, hidden when absent) */}
                {symbolSequence.length > 0 && (
                  <motion.div
                    data-testid="puzzle-symbol-sequence"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={SPRINGS.sheet}
                    className="rounded-2xl border border-sky-400/22 bg-sky-500/[0.06] p-3"
                  >
                    <div className="mb-2 text-[11px] font-semibold tracking-wide text-sky-300">
                      {copy.symbolSequenceLabel}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {symbolSequence.map((symbol, idx) => (
                        <motion.div
                          key={`${symbol}-${idx}`}
                          initial={{ opacity: 0, scale: 0.85, x: 10 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            transition: {
                              ...SPRINGS.snappy,
                              delay: Math.min(idx * 0.05, 0.25),
                            },
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <span className="flex items-center gap-1.5 rounded-xl border border-sky-300/30 bg-[#0A111D] px-2.5 py-1 text-xs font-semibold text-white">
                            <span className="font-mono text-[10px] text-sky-300">
                              {idx + 1}
                            </span>
                            <span>{symbol}</span>
                          </span>
                          {idx < symbolSequence.length - 1 && (
                            <ChevronRight
                              className="h-3.5 w-3.5 text-sky-400/70 rtl:rotate-180"
                              aria-hidden="true"
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {coachingPayload && coachingPayload.coachingSteps.length > 0 && (
                  <ol className="space-y-3">
                    {coachingPayload.coachingSteps.map((step, index) => (
                      <motion.li
                        key={step.id}
                        initial={{ opacity: 0, x: 18 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          transition: {
                            ...SPRINGS.sheet,
                            delay: Math.min(index * 0.055, 0.25),
                          },
                        }}
                        className="rounded-2xl border border-white/8 bg-white/[0.025] p-3.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-display font-semibold text-white">
                            {index + 1}. {resolveLocalizedText(step.title, language)}
                          </span>
                          <span className="font-mono text-[11px] tabular-nums text-sky-300 shrink-0">
                            {step.cueTime}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                          {resolveLocalizedText(step.detail, language)}
                        </p>
                        <div className="mt-2 font-mono text-[11px] text-slate-400">
                          {step.inputHint}
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                )}

                {coachingPayload && coachingPayload.quickPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {coachingPayload.quickPrompts.map((qp, idx) => {
                      const promptText = resolveLocalizedText(qp, language);
                      return (
                        <motion.button
                          key={idx}
                          type="button"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: { ...SPRINGS.snappy, delay: 0.08 + idx * 0.04 },
                          }}
                          onClick={() => void onSendPrompt(promptText)}
                          className="titanium-btn min-h-[36px] rounded-xl px-3 py-1.5 text-start text-xs text-slate-200 transition-colors hover:border-sky-400/50"
                        >
                          {promptText}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {skillMessages.length > 0 && (
                  <div className="space-y-2 border-t border-white/8 pt-3">
                    {skillMessages.slice(-4).map((msg) => (
                      <div
                        key={msg.id}
                        className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-sky-500/15 text-sky-100'
                            : 'border border-white/10 bg-[#0A0E16] text-slate-200'
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                  </div>
                )}

                {avaStatus === 'thinking' && (
                  <p className="text-xs text-sky-300">{copy.coachThinking}</p>
                )}

                {coachError && (
                  <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {coachError}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmitPrompt} className="mt-5 flex items-center gap-2">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder={copy.promptPlaceholder}
                  aria-label={copy.promptPlaceholder}
                  className="min-h-[46px] flex-1 rounded-2xl border border-white/12 bg-[#090C12] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                />
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.94 }}
                  transition={SPRINGS.tap}
                  disabled={avaStatus === 'thinking'}
                  aria-label={copy.sendPrompt}
                  className="titanium-btn-primary flex min-h-[46px] min-w-[46px] items-center justify-center rounded-2xl text-slate-950 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </form>
            </motion.section>
          )}
        </AnimatePresence>
      </motion.main>
    </motion.div>
  );
}
