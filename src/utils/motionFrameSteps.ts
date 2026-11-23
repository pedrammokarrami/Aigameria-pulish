/**
 * Typed re-export of motion's frameloop internals (also exported publicly by
 * framer-motion/motion): the render-step pipeline used to drive the frameloop
 * manually when native rAF is frozen (see utils/rafFallback.ts).
 */
export { frameData, frameSteps } from 'framer-motion';
