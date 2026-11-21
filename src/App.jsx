import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BackgroundVideo from './components/BackgroundVideo'
import MenuScreen from './components/MenuScreen'
import HubScreen from './components/HubScreen'
import GamingHub from './components/GamingHub'
import CinemaHub from './components/cinema/CinemaHub'
import { SEGMENTS, THEMES, playMechanicalClick } from './lib/config'

export default function App() {
  // default state: cinema segment (0.0 – 3.6), center button active
  const [view, setView] = useState('menu') // 'menu' | 'cinema' | 'music' | 'gaming'
  const [active, setActive] = useState('cinema')
  const [transitioning, setTransitioning] = useState(false)
  const commitTimer = useRef(null)

  const inMenu = view === 'menu'
  const isHub = view !== 'menu'

  /* ---------------- hover / click: instant segment switch ---------------- */
  const handleHover = useCallback(
    (id) => {
      if (isHub || transitioning) return
      if (id === active) return
      playMechanicalClick(0.4)
      setActive(id)
    },
    [active, isHub, transitioning],
  )

  /* ------------- final click: commit → cinematic transition -------------- */
  const handleCommit = useCallback(
    (id) => {
      if (isHub || transitioning) return
      playMechanicalClick(0.55)
      if (id !== active) setActive(id)
      setTransitioning(true)
      clearTimeout(commitTimer.current)
      commitTimer.current = setTimeout(() => {
        setView(id) // enter hub — video keeps looping its segment behind the hub
        setTransitioning(false)
      }, 950)
    },
    [active, isHub, transitioning],
  )

  const handleBack = useCallback(() => {
    playMechanicalClick(0.5)
    setView('menu')
  }, [])

  useEffect(() => () => clearTimeout(commitTimer.current), [])

  const theme = THEMES[active]

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* persistent fullscreen background video */}
      <BackgroundVideo activeKey={active} zoomed={isHub || transitioning} />

      {/* ------------------------------- UI ------------------------------- */}
      <AnimatePresence mode="wait">
        {inMenu && !transitioning && (
          <motion.div
            key="menu"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            <MenuScreen active={active} onHover={handleHover} onCommit={handleCommit} />
          </motion.div>
        )}

        {view === 'gaming' ? (
          <motion.div
            key="hub-gaming"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <GamingHub onBack={handleBack} />
          </motion.div>
        ) : view === 'cinema' ? (
          <motion.div
            key="hub-cinema"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <CinemaHub onBack={handleBack} />
          </motion.div>
        ) : isHub ? (
          <motion.div
            key={`hub-${view}`}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <HubScreen section={view} onBack={handleBack} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* --------------- cinematic transition shutter (commit) --------------- */}
      <AnimatePresence>
        {transitioning && (
          <motion.div
            key="shutter"
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* soft black dip with a warm accent bloom */}
            <div className="absolute inset-0 bg-black" style={{ opacity: 0.9 }} />
            <motion.div
              className="h-px"
              initial={{ width: 0 }}
              animate={{ width: '30vw' }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              style={{
                background: `linear-gradient(90deg, transparent, rgba(${theme.rim},0.9), transparent)`,
                boxShadow: `0 0 24px rgba(${theme.rim},0.6)`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
