import { AnimatePresence, motion } from 'motion/react';
import { Clock, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import {
  TIMING_ENDPOINTS,
  TIMING_PRESETS,
  clampDelayMs,
  getPresetTimingProfile,
  type TimingEndpointKey,
  type TimingPresetId,
  type TimingSimulationProfile,
} from '../services/timingSimulator';
import { ENTER_FROM_RIGHT, SPRINGS } from '../motion/transitions';

interface TimingSimulatorDrawerProps {
  open: boolean;
  profile: TimingSimulationProfile;
  resourceStatuses: Record<TimingEndpointKey, string>;
  onOpen: () => void;
  onClose: () => void;
  onChangeProfile: (next: TimingSimulationProfile, replay?: boolean) => void;
  onReplayLoad: () => void;
}

const ENDPOINT_LABELS: Record<TimingEndpointKey, { label: string; route: string }> = {
  games: { label: 'Games Catalog', route: '/api/v1/games' },
  gameDetail: { label: 'Game Topics', route: '/api/v1/games/{id}' },
  stage: { label: 'Tactical / Puzzle Stage', route: '/api/v1/stage/{gameId}' },
  media: { label: 'Walkthrough Stream (8h TTL)', route: '/api/v1/media/stream/{gameId}' },
  gamepad: { label: 'Platform Controller', route: '/api/v1/gamepad/{gameId}' },
  coach: { label: 'Puzzle / Coach Analyze', route: '/api/v1/media/analyze · coach' },
  ava: { label: 'Style-Matched AVA Config', route: '/api/v1/ava/{gameId}' },
  glbLoad: { label: '3D .GLB Asset Load', route: 'glb_url' },
};

function statusDotClass(status: string): string {
  switch (status) {
    case 'ready':
      return 'bg-emerald-400';
    case 'loading':
      return 'bg-sky-400 animate-pulse';
    case 'error':
      return 'bg-rose-400';
    case 'empty':
      return 'bg-amber-400/70';
    default:
      return 'bg-slate-600';
  }
}

/**
 * Modular Multi-Latency Timing Simulation Drawer (Alt+T or floating corner button).
 * Allows verifying hidden-until-ready & progressive staggered reveal across arbitrary
 * per-endpoint delays before final freeze ("اوکی نهایی").
 */
export function TimingSimulatorDrawer({
  open,
  profile,
  resourceStatuses,
  onOpen,
  onClose,
  onChangeProfile,
  onReplayLoad,
}: TimingSimulatorDrawerProps) {
  const isSimulated = profile.presetId !== 'live';

  const handlePresetClick = (presetId: Exclude<TimingPresetId, 'custom'>) => {
    onChangeProfile(getPresetTimingProfile(presetId), true);
  };

  const handleDelayChange = (key: TimingEndpointKey, value: number) => {
    onChangeProfile(
      {
        presetId: 'custom',
        delaysMs: {
          ...profile.delaysMs,
          [key]: clampDelayMs(value),
        },
      },
      false,
    );
  };

  return (
    <>
      {/* Discrete floating QA timing trigger (keeps top header clean, 1-line removable on freeze) */}
      <button
        type="button"
        onClick={onOpen}
        data-testid="timing-sim-trigger"
        aria-label="Open multi-latency timing simulator"
        title="Timing Simulator (Alt+T)"
        className={`fixed right-4 bottom-20 z-30 flex h-10 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium backdrop-blur-xl transition-colors sm:bottom-5 ${
          isSimulated
            ? 'border-sky-400/50 bg-sky-500/18 text-sky-100 shadow-[0_8px_24px_rgba(56,189,248,0.22)]'
            : 'border-white/12 bg-[#0C1018]/85 text-slate-300 hover:border-white/25 hover:text-white'
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-sky-400" />
        <span className="hidden sm:inline">
          {isSimulated ? TIMING_PRESETS[profile.presetId as Exclude<TimingPresetId, 'custom'>]?.label ?? 'Custom Timing' : 'Timing'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs"
          >
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="API Multi-Latency Timing Simulator"
              data-testid="timing-sim-drawer"
              dir="ltr"
              variants={ENTER_FROM_RIGHT}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="flex h-full w-full max-w-md flex-col border-l border-white/12 bg-[#0B0F17]/98 shadow-2xl backdrop-blur-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-sky-400" />
                  <div>
                    <h2 className="font-display text-sm font-semibold text-white">
                      Multi-Latency Timing Mode
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Test independent reveal across /api/v1/* & .GLB assets
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close timing simulator"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                {/* Presets */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Latency Presets
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      Object.entries(TIMING_PRESETS) as [
                        Exclude<TimingPresetId, 'custom'>,
                        (typeof TIMING_PRESETS)['live'],
                      ][]
                    ).map(([id, meta]) => {
                      const active = profile.presetId === id;
                      return (
                        <motion.button
                          key={id}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          transition={SPRINGS.tap}
                          data-testid={`timing-preset-${id}`}
                          onClick={() => handlePresetClick(id)}
                          className={`rounded-xl border p-2.5 text-left transition-colors ${
                            active
                              ? 'border-sky-400/60 bg-sky-500/15 text-white'
                              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="text-xs font-semibold">{meta.label}</div>
                          <div className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-400">
                            {meta.description}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Per-Endpoint Delay Sliders & Live Status */}
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Per-Section Delay (ms)
                  </div>
                  <div className="space-y-3">
                    {TIMING_ENDPOINTS.map((key) => {
                      const meta = ENDPOINT_LABELS[key];
                      const status = resourceStatuses[key] ?? 'idle';
                      const value = profile.delaysMs[key];
                      return (
                        <div
                          key={key}
                          className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-2 w-2 rounded-full ${statusDotClass(status)}`}
                                  title={status}
                                />
                                <span className="truncate text-xs font-medium text-white">
                                  {meta.label}
                                </span>
                              </div>
                              <div className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
                                {meta.route}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="font-mono text-[10px] uppercase text-slate-400">
                                {status}
                              </span>
                              <span className="min-w-[54px] rounded-md bg-white/[0.06] px-1.5 py-0.5 text-right font-mono text-[11px] tabular-nums text-sky-300">
                                {value}ms
                              </span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={5000}
                            step={100}
                            value={value}
                            aria-label={`${meta.label} simulated delay in milliseconds`}
                            data-testid={`timing-slider-${key}`}
                            onChange={(e) => handleDelayChange(key, Number(e.target.value))}
                            className="mt-2.5 h-1.5 w-full cursor-pointer accent-sky-400"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-2 border-t border-white/10 px-5 py-4">
                <button
                  type="button"
                  onClick={() => handlePresetClick('live')}
                  className="min-h-[40px] rounded-xl border border-white/12 bg-white/[0.04] px-3.5 text-xs font-medium text-slate-200 hover:bg-white/[0.08]"
                >
                  Reset 0ms
                </button>
                <button
                  type="button"
                  onClick={onReplayLoad}
                  data-testid="timing-replay-btn"
                  className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-sky-500 px-4 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Replay Waterfall</span>
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
