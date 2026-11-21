import { motion } from 'framer-motion'
import { THEMES } from '../lib/config'

const HUB_TITLES = {
  cinema: 'CINEMA',
  music: 'MUSIC & PODCAST',
  gaming: 'GAMING',
}

/**
 * Clean initial hub page for each section, with a back-to-menu button.
 * Keeps the same physical/AAA material language as the menu.
 */
export default function HubScreen({ section, onBack }) {
  const theme = THEMES[section]
  const title = HUB_TITLES[section]

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* header */}
      <motion.header
        className="pointer-events-auto flex items-center justify-between px-8 pt-7"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* back button — no text, minimal engraved chevron */}
        <motion.button
          type="button"
          onClick={onBack}
          whileHover={{ x: -3, scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="bevel-ring relative h-12 w-12 cursor-pointer rounded-full"
          aria-label="back to menu"
        >
          <div className="brushed-metal absolute inset-[5px] flex items-center justify-center rounded-full">
            <div className="frosted-glass absolute inset-[10%] rounded-full" />
            <svg
              viewBox="0 0 24 24"
              className="icon-engraved relative h-5 w-5"
              fill="none"
              stroke={theme.accent}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 5 8 12l6.5 7" />
            </svg>
          </div>
        </motion.button>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] font-semibold tracking-[0.45em] text-white/50">AIPETROS</div>
            <div
              className="text-xl font-light tracking-[0.28em]"
              style={{ color: theme.accent, textShadow: `0 0 18px rgba(${theme.rim}, 0.35)` }}
            >
              {title}
            </div>
          </div>
          <div
            className="h-9 w-[2px] rounded-full"
            style={{ backgroundColor: theme.accent, boxShadow: `0 0 12px rgba(${theme.rim}, 0.5)` }}
          />
        </div>
      </motion.header>

      {/* hub body — clean initial stage */}
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          className="pointer-events-auto flex flex-col items-center gap-6"
          initial={{ y: 26, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="rounded-2xl px-14 py-12 text-center"
            style={{
              background: 'rgba(10, 9, 8, 0.42)',
              backdropFilter: 'blur(14px)',
              border: `1px solid rgba(${theme.rim}, 0.22)`,
              boxShadow: `0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 60px rgba(${theme.rim}, 0.08)`,
            }}
          >
            <div className="text-[10px] tracking-[0.5em] text-white/40">HUB ONLINE</div>
            <div className="mt-3 text-4xl font-extralight tracking-[0.18em]" style={{ color: theme.accent }}>
              {title}
            </div>
            <div className="mx-auto mt-5 h-px w-40" style={{ background: `linear-gradient(90deg, transparent, rgba(${theme.rim},0.5), transparent)` }} />
            <div className="mt-5 text-sm text-white/45">This hub is ready for your content.</div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
