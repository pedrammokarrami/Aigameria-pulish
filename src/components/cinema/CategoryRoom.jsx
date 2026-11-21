import { motion } from 'framer-motion'
import { CATEGORIES } from '../../lib/cinemaData'

/**
 * Focused category room — the floating island's environment becomes the
 * full stage: looping diorama video with physical framing, mood copy and
 * the hub's material language. Content rail is wired to the category.
 */
export default function CategoryRoom({ categoryId, onClose }) {
  const cat = CATEGORIES.find((c) => c.id === categoryId)

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* environment loop */}
      <video
        src={cat.env}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* physical vignette */}
      <div className="cinema-vignette pointer-events-none absolute inset-0" />
      <div className="grain pointer-events-none absolute inset-0 overflow-hidden" />

      {/* header */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
        <motion.button
          type="button"
          onClick={onClose}
          aria-label="close category"
          whileHover={{ x: -3, scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="bevel-ring relative h-12 w-12 cursor-pointer rounded-full"
        >
          <div className="brushed-metal absolute inset-[5px] flex items-center justify-center rounded-full">
            <div className="frosted-glass absolute inset-[10%] rounded-full" />
            <svg viewBox="0 0 24 24" className="icon-engraved relative h-5 w-5" fill="none" stroke={cat.palette.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 5 8 12l6.5 7" />
            </svg>
          </div>
        </motion.button>

        <motion.div
          className="text-right"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <div className="text-[10px] tracking-[0.5em] text-white/50">AIPETROS CINEMA</div>
          <div className="text-2xl font-light tracking-[0.2em]" style={{ color: cat.palette.accent, textShadow: `0 0 20px rgba(${cat.palette.rim}, 0.35)` }}>
            {cat.fa}
          </div>
          <div className="mt-1 text-xs text-white/55">{cat.mood}</div>
        </motion.div>
        <div className="w-12" />
      </div>

      {/* clean initial stage — content grid lands here */}
      <div className="absolute inset-x-0 bottom-[8vh] flex justify-center">
        <motion.div
          className="frosted-glass rounded-2xl px-10 py-6 text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ border: `1px solid rgba(${cat.palette.rim}, 0.25)`, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
        >
          <div className="text-[10px] tracking-[0.5em]" style={{ color: cat.palette.accent }}>ENVIRONMENT ONLINE</div>
          <div className="mt-2 text-sm text-white/65">محیط {cat.fa} فعال است — محتوای این بخش اینجا ریل می‌شود.</div>
        </motion.div>
      </div>
    </motion.div>
  )
}
