import { motion } from 'framer-motion'
import { THEMES } from '../lib/config'

/* ------------------------------------------------------------------ */
/*  Minimal engraved icons — pure SVG strokes, no text                */
/* ------------------------------------------------------------------ */

export function MusicIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {/* studio microphone */}
      <rect x="19" y="8" width="10" height="20" rx="5" />
      <path d="M13 22c0 6.6 4.9 11 11 11s11-4.4 11-11" />
      <path d="M24 33v7M18 40h12" />
    </svg>
  )
}

export function CinemaIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {/* classic film projector / camera */}
      <rect x="10" y="18" width="20" height="16" rx="2.5" />
      <path d="M30 22.5 39 18v16l-9-4.5" />
      <circle cx="16" cy="12" r="3.4" />
      <circle cx="25" cy="12" r="3.4" />
    </svg>
  )
}

export function GamingIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {/* game controller */}
      <path d="M16 14h16c5 0 8 3.6 8 8 0 6-2.5 13-6.5 13-3 0-3.8-2.6-5.5-4h-8c-1.7 1.4-2.5 4-5.5 4C10.5 35 8 28 8 22c0-4.4 3-8 8-8Z" />
      <path d="M16 21v6M13 24h6" />
      <circle cx="30" cy="21.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="33.5" cy="25" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Circular brushed-metal button with beveled ring + frosted glass   */
/* ------------------------------------------------------------------ */

const SIZES = { md: 'h-[clamp(84px,10vw,132px)] w-[clamp(84px,10vw,132px)]' }

export default function MenuButton({ id, Icon, active, onSelect, onHover, size = 'md' }) {
  const theme = THEMES[id]
  const activeRim = `rgba(${theme.rim}, 0.9)`
  const dimRim = 'rgba(255,255,255,0.08)'

  return (
    <motion.button
      type="button"
      aria-label={id}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onSelect}
      whileHover={{ y: -6, scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24, mass: 0.7 }}
      className={`relative cursor-pointer rounded-full outline-none ${SIZES[size]}`}
      style={{ perspective: 800 }}
    >
      {/* active halo glow — soft, physical light spilling onto metal */}
      <motion.div
        className="halo-breathe pointer-events-none absolute -inset-[26%] rounded-full"
        animate={{
          boxShadow: active
            ? `0 0 60px 6px rgba(${theme.rim}, 0.35), 0 0 130px 22px rgba(${theme.rim}, 0.16), inset 0 0 30px rgba(${theme.rim}, 0.12)`
            : '0 0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />

      {/* outer machined bevel ring */}
      <motion.div
        className="bevel-ring absolute inset-0 rounded-full"
        animate={{ boxShadow: active ? `inset 0 0 0 1.5px ${activeRim}` : 'inset 0 0 0 1.5px rgba(255,255,255,0.10)' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      {/* brushed dark metal face */}
      <div className="brushed-metal absolute inset-[7px] rounded-full">
        {/* subtle 3D press: top-light bevel */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: active
              ? 'inset 0 2px 4px rgba(0,0,0,0.55), inset 0 -1px 1px rgba(255,255,255,0.12)'
              : 'inset 0 2px 5px rgba(0,0,0,0.4), inset 0 -2px 2px rgba(255,255,255,0.10)',
          }}
        />
        {/* frosted glass center well */}
        <div className="frosted-glass absolute inset-[16%] rounded-full" />

        {/* engraved icon */}
        <motion.div
          className="icon-engraved absolute inset-0 flex items-center justify-center"
          animate={{ color: active ? theme.accent : 'rgba(214, 209, 198, 0.62)' }}
          transition={{ duration: 0.35 }}
        >
          <Icon />
        </motion.div>
      </div>

      {/* inner soft reflection on glass */}
      <div
        className="pointer-events-none absolute inset-[16%] rounded-full"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.10) 0%, transparent 38%)',
        }}
      />
    </motion.button>
  )
}
