import type { Transition, Variants } from 'motion/react';

/**
 * Apple / iPhone 17 Pro Max calibrated declarative spring physics for 120Hz displays.
 * Strictly GPU-composited transform & opacity properties with fluid layout choreography.
 */
export const SPRINGS = {
  /** Snappy pill/tab indicator & micro-layout shifts */
  snappy: {
    type: 'spring',
    stiffness: 450,
    damping: 36,
    mass: 0.78,
  } satisfies Transition,

  /** Smooth layout displacement when new API menus or tabs emerge */
  layout: {
    type: 'spring',
    stiffness: 380,
    damping: 34,
    mass: 0.86,
  } satisfies Transition,

  /** Spatial drawer, preview card, and coaching panel continuity */
  sheet: {
    type: 'spring',
    stiffness: 340,
    damping: 31,
    mass: 0.88,
  } satisfies Transition,

  /** Screen-to-screen spatial continuity */
  screen: {
    type: 'spring',
    stiffness: 310,
    damping: 30,
    mass: 0.9,
  } satisfies Transition,

  /** Tactile press feedback under 140ms */
  tap: {
    type: 'spring',
    stiffness: 540,
    damping: 34,
    mass: 0.68,
  } satisfies Transition,
} as const;

export const SCREEN_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.988,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRINGS.screen,
  },
  exit: {
    opacity: 0,
    scale: 0.988,
    y: -8,
    transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Enters smoothly downward from top (header strips, category/game rows) */
export const ENTER_FROM_TOP: Variants = {
  initial: {
    opacity: 0,
    y: -16,
    scale: 0.985,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRINGS.layout,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.985,
    transition: { duration: 0.14, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Rises smoothly upward from bottom (bottom dock, mobile preview sheets, upload modal) */
export const ENTER_FROM_BOTTOM: Variants = {
  initial: {
    opacity: 0,
    y: 26,
    scale: 0.975,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRINGS.sheet,
  },
  exit: {
    opacity: 0,
    y: 18,
    scale: 0.98,
    transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Slides smoothly from right-to-left (inline coaching card, steps drawer, timing drawer) */
export const ENTER_FROM_RIGHT: Variants = {
  initial: {
    opacity: 0,
    x: 28,
    scale: 0.985,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: SPRINGS.sheet,
  },
  exit: {
    opacity: 0,
    x: 18,
    scale: 0.985,
    transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Emerges cleanly from behind an existing menu/bar while sibling motion `layout`
 * containers smoothly shift down or aside without layout jump or overlap.
 */
export const REVEAL_BEHIND_MENU: Variants = {
  initial: {
    opacity: 0,
    y: -12,
    scale: 0.94,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRINGS.layout,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    transition: { duration: 0.14, ease: [0.16, 1, 0.3, 1] },
  },
};

export const STAGE_PANEL_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.992,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRINGS.sheet,
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.992,
    transition: { duration: 0.14, ease: [0.16, 1, 0.3, 1] },
  },
};

export const DRAWER_VARIANTS: Variants = ENTER_FROM_BOTTOM;
