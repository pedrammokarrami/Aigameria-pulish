import { AnimatePresence, motion } from 'motion/react';
import { Compass, Layers, Mic, Upload } from 'lucide-react';
import type { Language } from '../types/api';
import { getUiCopy } from '../data/i18n';
import type { AvaStatus, ScreenId } from '../state/appMachine';
import { ENTER_FROM_BOTTOM, SPRINGS } from '../motion/transitions';

interface BottomActionDockProps {
  screen: ScreenId;
  language: Language;
  avaStatus: AvaStatus;
  hasActiveSkill: boolean;
  voiceReady: boolean;
  onPrimaryLeftAction: () => void;
  onVoicePress: () => void;
  onUploadPress: () => void;
}

export function BottomActionDock({
  screen,
  language,
  avaStatus,
  hasActiveSkill,
  voiceReady,
  onPrimaryLeftAction,
  onVoicePress,
  onUploadPress,
}: BottomActionDockProps) {
  const copy = getUiCopy(language);
  const isListening = avaStatus === 'listening';

  return (
    <motion.nav
      aria-label="Primary tactical dock"
      variants={ENTER_FROM_BOTTOM}
      initial="initial"
      animate="animate"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 safe-bottom"
    >
      <motion.div
        layout
        transition={SPRINGS.layout}
        className="pointer-events-auto flex h-14 w-full max-w-md items-center justify-between gap-2 rounded-2xl border border-white/15 bg-[#0C1018]/94 px-2.5 shadow-[0_18px_46px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.14)] brushed-titanium"
      >
        {/* Left: Quick Navigation / Coaching Room Switch (hidden on Discovery until API skill is ready) */}
        <div className="flex min-w-[108px] items-center justify-start">
          <AnimatePresence mode="popLayout">
            {(screen === 'coaching' || hasActiveSkill) && (
              <motion.button
                key={screen === 'discovery' ? 'dock-stage' : 'dock-board'}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                whileTap={{ scale: 0.94 }}
                transition={SPRINGS.snappy}
                type="button"
                onClick={onPrimaryLeftAction}
                aria-label={screen === 'discovery' ? copy.enterCoachingRoom : copy.backToBoard}
                className="titanium-btn flex min-h-[42px] items-center gap-2 rounded-xl px-3 text-xs font-medium text-slate-100 whitespace-nowrap"
              >
                {screen === 'discovery' ? (
                  <>
                    <Layers className="h-4 w-4 text-sky-400" />
                    <span>{copy.stageTabs.tactical}</span>
                  </>
                ) : (
                  <>
                    <Compass className="h-4 w-4 text-sky-400" />
                    <span>{copy.backToBoard}</span>
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Center: Prominent Sculptural Voice / Hologram Launch Trigger (hidden until .GLB ready) */}
        <div className="flex items-center justify-center">
          <AnimatePresence>
            {voiceReady && (
              <motion.button
                key="dock-voice-btn"
                data-testid="dock-voice-btn"
                type="button"
                initial={{ opacity: 0, y: 16, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.92 }}
                transition={SPRINGS.sheet}
                onClick={onVoicePress}
                aria-label={isListening ? copy.voiceStop : copy.voiceStart}
                className={`relative -mt-4 flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-xl transition-colors ${
                  isListening
                    ? 'border-amber-200 bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 shadow-[0_10px_28px_rgba(245,158,11,0.45)]'
                    : 'titanium-btn-primary border-sky-100/80 text-slate-950 shadow-[0_10px_28px_rgba(56,189,248,0.45)]'
                }`}
              >
                <Mic className="h-5 w-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Right: TV Screen Scan / Media Upload (always accessible to scan any puzzle/game screen) */}
        <div className="flex min-w-[108px] items-center justify-end">
          <motion.button
            key="dock-upload-btn"
            data-testid="dock-upload-btn"
            layout
            whileTap={{ scale: 0.94 }}
            transition={SPRINGS.snappy}
            type="button"
            onClick={onUploadPress}
            aria-label={copy.uploadMedia}
            className="titanium-btn flex min-h-[42px] items-center gap-2 rounded-xl px-3 text-xs font-medium text-slate-100 whitespace-nowrap"
          >
            <Upload className="h-4 w-4 text-sky-400" />
            <span>{copy.uploadMedia}</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.nav>
  );
}
