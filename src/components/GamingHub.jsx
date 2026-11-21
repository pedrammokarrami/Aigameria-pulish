import { motion } from 'framer-motion'
import { THEMES } from '../lib/config'

/**
 * Gaming hub — runs the untouched frontend of
 * https://github.com/pedrammokarrami/Aigameria-new
 *
 * The repository's production build is served verbatim from
 * /aigameria/ (copied into public/aigameria). It is embedded in a
 * fullscreen iframe so its UI/UX, layout, colors and components stay
 * 100% original — no redesign, no restyling, no component changes.
 * Only a floating, minimal "back to main menu" button is layered on top.
 */
export default function GamingHub({ onBack }) {
  const theme = THEMES.gaming

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-[#090B0E]"
      initial={{ opacity: 0, scale: 1.015 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.01 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Aigameria-new frontend — verbatim */}
      <iframe
        src="/aigameria/index.html"
        title="AIGAMERIA — Spatial Gaming Operating System"
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; fullscreen; xr-spatial-tracking; gamepad*"
        allowFullScreen
      />

      {/* floating back-to-menu button (minimal, no text) */}
      <motion.button
        type="button"
        onClick={onBack}
        aria-label="back to menu"
        whileHover={{ x: -3, scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
        className="bevel-ring fixed left-5 top-5 z-50 h-12 w-12 cursor-pointer rounded-full"
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
    </motion.div>
  )
}
