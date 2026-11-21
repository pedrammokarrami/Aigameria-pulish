import { motion } from 'framer-motion'
import MenuButton from './MenuButton'
import { CinemaIcon, MusicIcon, GamingIcon } from './MenuButton'
import { THEMES } from '../lib/config'

/**
 * AAA-style bottom menu bar.
 * Three circular buttons, no text anywhere — icons only.
 * Positioned low on screen so the video subjects stay visible.
 */
export default function MenuScreen({ active, onHover, onCommit }) {
  const theme = THEMES[active]

  const buttons = [
    { id: 'music', Icon: MusicIcon }, // left — music / podcast
    { id: 'cinema', Icon: CinemaIcon }, // center — cinema / film
    { id: 'gaming', Icon: GamingIcon }, // right — gaming
  ]

  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col">
      {/* subtle top brand mark (very small, minimal) */}
      <motion.div
        className="flex justify-center pt-6"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 0.55, y: 0 }}
        transition={{ delay: 0.4, duration: 1 }}
      >
        <div className="h-px w-24 bg-white/20" />
      </motion.div>

      {/* spacer — keeps video subjects unobstructed */}
      <div className="flex-1" />

      {/* bottom control dock */}
      <motion.div
        className="pointer-events-auto flex items-end justify-center pb-[9vh] gap-[6vw]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        {buttons.map(({ id, Icon }) => (
          <MenuButton
            key={id}
            id={id}
            Icon={Icon}
            active={active === id}
            onHover={() => onHover(id)}
            onSelect={() => onCommit(id)}
          />
        ))}
      </motion.div>

      {/* faint accent line under the dock — matches the active theme */}
      <motion.div
        className="mx-auto mb-4 h-[2px] rounded-full"
        animate={{
          width: 180,
          backgroundColor: theme.accent,
          opacity: 0.35,
        }}
        transition={{ duration: 0.6 }}
      />
    </div>
  )
}
