import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import IslandsScene from './IslandsScene'
import CategoryRoom from './CategoryRoom'
import PersonaStudio from './PersonaStudio'
import SocialClub from './SocialClub'
import StreamStudio from './StreamStudio'
import { CATEGORIES } from '../../lib/cinemaData'
import { useCinemaState } from '../../lib/useCinemaState'

const PANELS = [
  { id: 'personas', fa: 'استودیو پرسونا', en: 'PERSONA' },
  { id: 'social', fa: 'سوشال کلاب زیرزمینی', en: 'CLUB' },
  { id: 'stream', fa: 'استودیو استریم و تلگرام', en: 'STREAM' },
]

/**
 * Cinema & TV Hub — five floating 3D islands + panels.
 * Entry surface for: categories, persona identity, underground club, streams.
 */
export default function CinemaHub({ onBack }) {
  const { persona } = useCinemaState((s) => ({ persona: s.persona }))
  const [focused, setFocused] = useState('film')
  const [room, setRoom] = useState(null) // open category room
  const [panel, setPanel] = useState(null) // personas | social | stream

  const focusedCat = useMemo(() => CATEGORIES.find((c) => c.id === focused), [focused])

  return (
    <motion.div
      className="fixed inset-0 z-30 bg-[#0b0e12]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ---- 3D floating islands ---- */}
      <IslandsScene focusedId={focused} onSelect={(id) => { setFocused(id); setRoom(id) }} />

      {/* ---- header: back + identity badge ---- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-5">
        <motion.button
          type="button"
          onClick={onBack}
          aria-label="back to menu"
          whileHover={{ x: -3, scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="bevel-ring pointer-events-auto relative h-12 w-12 cursor-pointer rounded-full"
        >
          <div className="brushed-metal absolute inset-[5px] flex items-center justify-center rounded-full">
            <div className="frosted-glass absolute inset-[10%] rounded-full" />
            <svg viewBox="0 0 24 24" className="icon-engraved relative h-5 w-5" fill="none" stroke="#f0a938" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 5 8 12l6.5 7" />
            </svg>
          </div>
        </motion.button>

        {/* persona identity badge — visible across the hub */}
        {persona && (
          <motion.div
            className="frosted-glass pointer-events-auto flex items-center gap-3 rounded-full px-4 py-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="h-2 w-2 rounded-full" style={{ background: '#f0a938', boxShadow: '0 0 10px rgba(240,169,56,0.6)' }} />
            <div className="text-xs text-white/85">{persona.primary.fa}</div>
            {persona.secondary && (
              <div className="text-[10px] text-white/45">× {persona.secondary.fa}</div>
            )}
            <div className="h-3 w-px bg-white/15" />
            <div className="text-[10px] tracking-widest text-white/40">{persona.handle}</div>
          </motion.div>
        )}
      </div>

      {/* ---- bottom dock: category selector + panels ---- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-4 pb-[4.5vh]">
        {/* focused mood line */}
        <AnimatePresence mode="wait">
          <motion.div
            key={focused}
            className="text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <div className="text-[10px] tracking-[0.5em]" style={{ color: focusedCat.palette.accent }}>
              {focusedCat.en}
            </div>
            <div className="mt-1 text-sm text-white/60">{focusedCat.mood}</div>
          </motion.div>
        </AnimatePresence>

        {/* category pills + panel buttons — physical metal, no text on island picks? keep labels minimal here (this is navigation, not the AAA menu) */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          {CATEGORIES.map((c) => {
            const active = focused === c.id
            return (
              <motion.button
                key={c.id}
                type="button"
                onClick={() => setFocused(c.id)}
                onDoubleClick={() => setRoom(c.id)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                className="bevel-ring relative h-9 w-9 cursor-pointer rounded-full"
                aria-label={c.fa}
                title={c.fa}
              >
                <div
                  className="absolute inset-[5px] rounded-full"
                  style={{
                    background: `radial-gradient(120% 120% at 30% 20%, #43413e 0%, #2a2724 60%, #1a1815 100%)`,
                    boxShadow: active
                      ? `inset 0 0 0 1.5px rgba(${c.palette.rim}, 0.9), 0 0 16px rgba(${c.palette.rim}, 0.35)`
                      : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                  }}
                />
                <div className="relative flex h-full items-center justify-center">
                  <CategoryGlyph id={c.id} color={active ? c.palette.accent : 'rgba(214,209,198,0.55)'} />
                </div>
              </motion.button>
            )
          })}

          <div className="mx-1 h-7 w-px bg-white/15" />

          {PANELS.map((p) => (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => setPanel(p.id)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className="brushed-metal frosted-glass cursor-pointer rounded-full px-4 py-2 text-[11px] text-white/75"
              style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), 0 6px 16px rgba(0,0,0,0.45)' }}
            >
              {p.fa}
            </motion.button>
          ))}

          {/* enter the focused room */}
          <motion.button
            type="button"
            onClick={() => setRoom(focused)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="brushed-metal cursor-pointer rounded-full px-5 py-2 text-[11px] font-semibold"
            style={{
              color: focusedCat.palette.accent,
              boxShadow: `inset 0 0 0 1.5px rgba(${focusedCat.palette.rim}, 0.75), 0 6px 18px rgba(0,0,0,0.5)`,
            }}
          >
            ورود به {focusedCat.fa}
          </motion.button>
        </div>
      </div>

      {/* ---- overlays ---- */}
      <AnimatePresence mode="wait">
        {room && (
          <CategoryRoom key="room" categoryId={room} onClose={() => setRoom(null)} />
        )}
        {panel === 'personas' && <PersonaStudio key="personas" onClose={() => setPanel(null)} />}
        {panel === 'social' && <SocialClub key="social" onClose={() => setPanel(null)} />}
        {panel === 'stream' && <StreamStudio key="stream" onClose={() => setPanel(null)} />}
      </AnimatePresence>
    </motion.div>
  )
}

/* ---- minimal engraved glyphs per category ---- */
function CategoryGlyph({ id, color }) {
  const common = { fill: 'none', stroke: color, strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" {...common}>
      {id === 'film' && <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 6v12M17 6v12M3 10h4M3 14h4M17 10h4M17 14h4" /></>}
      {id === 'series' && <><rect x="3" y="5" width="18" height="11" rx="2" /><path d="M8 19h8M12 16v3" /></>}
      {id === 'anime' && <><circle cx="12" cy="8" r="3" /><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /></>}
      {id === 'documentary' && <><path d="M3 19 10 8l4 6 3-4 4 9z" /></>}
      {id === 'tv' && <><rect x="3" y="6" width="13" height="12" rx="1.5" /><path d="M18 8v8M21 6v12" /></>}
    </svg>
  )
}
