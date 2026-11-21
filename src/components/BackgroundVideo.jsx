import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { SEGMENTS, THEMES } from '../lib/config'

/**
 * Fullscreen background video (intro.mp4 at project root / public).
 * Plays only the segment bound to `activeKey`, looping it seamlessly.
 * - rAF-driven loop guard (frame-accurate, no visible jump)
 * - muted, autoplay, object-cover, 100vw x 100vh
 * - smooth cinematic zoom (scale 1.03) on every segment switch
 */
export default function BackgroundVideo({ activeKey, zoomed }) {
  const videoRef = useRef(null)
  const segRef = useRef(SEGMENTS[activeKey])
  const zoomRef = useRef(zoomed)
  segRef.current = SEGMENTS[activeKey]
  zoomRef.current = zoomed

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let raf = 0

    const tick = () => {
      const seg = segRef.current
      // hard-seek guard: clamp into the active segment (loop)
      if (video.currentTime >= seg.end || video.currentTime < seg.start - 0.05) {
        video.currentTime = seg.start
      }
      // keep playback rate natural; slight boost when zoomed (cinematic feel)
      video.playbackRate = 1.0
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // restart loop at the segment start on loop-boundary end event too
    const onEnded = () => {
      video.currentTime = segRef.current.start
      video.play().catch(() => {})
    }
    video.addEventListener('ended', onEnded)

    // autoplay safety
    const tryPlay = () => video.play().catch(() => {})
    video.addEventListener('loadeddata', tryPlay)
    tryPlay()

    return () => {
      cancelAnimationFrame(raf)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('loadeddata', tryPlay)
    }
  }, [])

  // when the active segment changes → seek instantly to its start
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const seg = SEGMENTS[activeKey]
    if (video.readyState >= 1) {
      video.currentTime = seg.start
    } else {
      const onMeta = () => {
        video.currentTime = seg.start
        video.removeEventListener('loadedmetadata', onMeta)
      }
      video.addEventListener('loadedmetadata', onMeta)
    }
    video.play().catch(() => {})
  }, [activeKey])

  const theme = THEMES[activeKey]

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* zoom layer — spring-based scale, very soft */}
      <motion.div
        className="absolute inset-0"
        animate={{ scale: zoomed ? 1.03 : 1 }}
        transition={{ type: 'spring', stiffness: 34, damping: 20, mass: 1.1 }}
      >
        <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src="/intro.mp4"
            muted
            playsInline
            autoPlay
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
          />
      </motion.div>

      {/* ambient light wash tinted by the active section */}
      <motion.div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        animate={{ background: `radial-gradient(60% 55% at 50% 60%, ${theme.glow}, transparent 70%)` }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        style={{ opacity: 0.35 }}
      />

      {/* cinematic vignette + film grain */}
      <div className="cinema-vignette pointer-events-none absolute inset-0" />
      <div className="grain pointer-events-none absolute inset-0 overflow-hidden" />
    </div>
  )
}
