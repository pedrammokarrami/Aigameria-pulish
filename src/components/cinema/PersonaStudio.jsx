import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PERSONAS, TASTES, GENDERS, ROLE_LABELS, filterPersonas } from '../../lib/cinemaData'
import { setPersona, clearPersona } from '../../lib/cinemaStore'
import { useCinemaState } from '../../lib/useCinemaState'

/**
 * Persona Studio — 50+ cinematic identities, filtered by age (8..99),
 * gender and visual taste. Pick one, or fuse two into a hybrid identity
 * that travels across the whole platform.
 */
export default function PersonaStudio({ onClose }) {
  const { persona } = useCinemaState((s) => ({ persona: s.persona }))
  const [age, setAge] = useState(persona?.age ?? 25)
  const [gender, setGender] = useState(persona?.gender ?? 'any')
  const [tastes, setTastes] = useState(persona?.tastes ?? [])
  const [picked, setPicked] = useState(persona?.primary ?? null) // first persona
  const [second, setSecond] = useState(persona?.secondary ?? null) // fusion persona
  const [handle, setHandle] = useState(persona?.handle ?? '')

  const results = useMemo(() => filterPersonas({ age, gender, tastes }), [age, gender, tastes])

  const toggleTaste = (id) =>
    setTastes((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))

  const pick = (p) => {
    if (!picked) return setPicked(p)
    if (picked.en === p.en) return setPicked(null)
    if (!second && picked.en !== p.en) return setSecond(p.en === second?.en ? null : p)
    // replace second
    setSecond(p.en === second?.en ? null : p)
  }

  const fuseMode = picked && second

  const commit = () => {
    if (!picked) return
    setPersona({
      primary: picked,
      secondary: fuseMode ? second : null,
      age, gender, tastes,
      handle: handle.trim() || `${picked.en.split(' ')[0].toLowerCase()}_${String(age).padStart(2, '0')}`,
    })
    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="frosted-glass flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl"
        style={{ border: '1px solid rgba(240,169,56,0.22)', background: 'rgba(12,11,10,0.88)' }}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <div className="text-[10px] tracking-[0.45em] text-amber/80">AIPETROS PERSONA</div>
            <div className="text-lg text-white/90">استودیو پرسونای سینمایی</div>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:text-white">
            بستن
          </button>
        </div>

        {/* filters */}
        <div className="grid gap-4 border-b border-white/10 px-6 py-4 md:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/50">سن</label>
            <input
              type="range" min="8" max="99" value={age}
              onChange={(e) => setAge(+e.target.value)}
              className="w-40 accent-[#f0a938]"
            />
            <span className="w-8 text-center text-sm text-white/85">{age}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {GENDERS.map((g) => (
              <Chip key={g.id} active={gender === g.id} onClick={() => setGender(g.id)}>{g.fa}</Chip>
            ))}
            <div className="mx-2 h-4 w-px bg-white/15" />
            {TASTES.map((t) => (
              <Chip key={t.id} active={tastes.includes(t.id)} onClick={() => toggleTaste(t.id)}>{t.fa}</Chip>
            ))}
          </div>
        </div>

        {/* results */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-3 text-[11px] text-white/40">{results.length} پرسونا مطابق فیلتر شما — برای ترکیب، دو پرسونا انتخاب کنید</div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p) => {
              const isPicked = picked?.en === p.en
              const isSecond = second?.en === p.en
              return (
                <motion.button
                  key={p.en}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  onClick={() => pick(p)}
                  className="brushed-metal cursor-pointer rounded-xl p-3.5 text-right"
                  style={{
                    boxShadow: isPicked
                      ? 'inset 0 0 0 1.5px rgba(240,169,56,0.85), 0 8px 20px rgba(0,0,0,0.4)'
                      : isSecond
                        ? 'inset 0 0 0 1.5px rgba(212,175,92,0.7), 0 8px 20px rgba(0,0,0,0.4)'
                        : 'inset 0 0 0 1px rgba(255,255,255,0.07), 0 8px 20px rgba(0,0,0,0.35)',
                  }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-white/90">{p.fa}</span>
                    <span className="text-[9px] tracking-widest text-white/35">{p.en.toUpperCase()}</span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/50">{p.desc}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white/45">{p.minAge}–{p.maxAge}</span>
                    {p.gender !== 'any' && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white/45">{p.gender === 'male' ? 'مرد' : 'زن'}</span>}
                    {p.roles.slice(0, 2).map((r) => (
                      <span key={r} className="rounded bg-amber/10 px-1.5 py-0.5 text-[9px] text-amber/80">{ROLE_LABELS[r]}</span>
                    ))}
                  </div>
                </motion.button>
              )
            })}
            {!results.length && (
              <div className="col-span-full py-10 text-center text-sm text-white/40">
                با این فیلترها پرسونایی نیست — سن را جابه‌جا کنید یا سلیقه‌ها را کم کنید.
              </div>
            )}
          </div>
        </div>

        {/* commit bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {picked ? (
              <>
                <span className="text-white/85">{picked.fa}</span>
                {second && <><span className="text-white/35">×</span><span className="text-amber/90">{second.fa}</span></>}
              </>
            ) : (
              <span className="text-white/40">هنوز پرسونایی انتخاب نشده</span>
            )}
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="هندل عمومی (اختیاری)"
              className="w-44 rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white/85 outline-none focus:border-amber/60"
            />
          </div>
          <div className="flex gap-2">
            {persona && (
              <button type="button" onClick={() => { clearPersona(); onClose() }} className="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-xs text-white/60 hover:text-white">
                حذف هویت فعلی
              </button>
            )}
            <motion.button
              type="button"
              onClick={commit}
              disabled={!picked}
              whileHover={picked ? { scale: 1.03 } : undefined}
              whileTap={picked ? { scale: 0.97 } : undefined}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className="cursor-pointer rounded-full px-6 py-2 text-xs font-bold"
              style={{
                background: picked ? 'linear-gradient(160deg, rgba(240,169,56,0.25), rgba(240,169,56,0.08))' : 'rgba(255,255,255,0.04)',
                color: picked ? '#f0a938' : 'rgba(255,255,255,0.3)',
                boxShadow: picked ? 'inset 0 0 0 1.5px rgba(240,169,56,0.75), 0 8px 20px rgba(0,0,0,0.4)' : 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                cursor: picked ? 'pointer' : 'not-allowed',
              }}
            >
              {fuseMode ? 'فوز و ثبت هویت ترکیبی' : 'ثبت هویت'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-full px-3 py-1 text-[11px] transition-colors"
      style={{
        background: active ? 'rgba(240,169,56,0.16)' : 'rgba(255,255,255,0.04)',
        color: active ? '#f0a938' : 'rgba(255,255,255,0.55)',
        boxShadow: active ? 'inset 0 0 0 1px rgba(240,169,56,0.6)' : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      {children}
    </button>
  )
}
