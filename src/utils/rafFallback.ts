/**
 * rAF fallback — background/idle browser tabs (and some phones) throttle
 * requestAnimationFrame to ZERO ticks, which leaves framer-motion exit
 * animations permanently unfinished (hub views stack instead of swapping)
 * and stalls every rAF-gated loop in the app.
 *
 * Two-part defense:
 * 1. Shim — if the native rAF produces no ticks across two probe windows,
 *    window.requestAnimationFrame is re-pointed at a setTimeout(16ms)
 *    scheduler with a paired clearTimeout-based cancelAnimationFrame. If the
 *    environment later becomes healthy again (visibilitychange/pageshow
 *    re-probe), the native rAF is restored.
 * 2. Motion driver — motion's frameloop captured the native rAF at module-eval
 *    time, so re-pointing the global cannot reach it. While shimmed, the
 *    frameloop render steps (exported by motion as frameSteps/frameData) are
 *    driven manually on a short interval so pending instant/exit animations
 *    actually finish even when native rAF is dead.
 *
 * Every mode change dispatches 'aipetros-raf-frozen' (detail: boolean) so the
 * app can enable MotionConfig skipAnimations while frozen.
 */

import { frameData, frameSteps } from './motionFrameSteps';

export const RAF_FROZEN_EVENT = 'aipetros-raf-frozen';

let installed = false;
let shimmed = false;
let nativeRaf: typeof window.requestAnimationFrame | null = null;
let nativeCancel: typeof window.cancelAnimationFrame | null = null;
let motionDriver = 0;

function probeNativeTicks(windowMs: number): number {
  if (!nativeRaf) return 0;
  let ticks = 0;
  const t0 = performance.now();
  const loop = () => {
    ticks++;
    if (performance.now() - t0 < windowMs) nativeRaf!(loop);
  };
  nativeRaf(loop);
  return ticks;
}

/** Manually runs one full motion frameloop pass (steps in pipeline order). */
let lastDrive = 0;
function driveMotionFrame(): void {
  if (!frameSteps) return;
  const now = performance.now();
  // Real elapsed time so animations finish on wall-clock schedule even when
  // the browser clamps our driver to 1 tick/second in hidden tabs. Capped so
  // a long gap can't teleport an animation to its end in one jump.
  const elapsed = lastDrive ? Math.min(now - lastDrive, 100) : 16;
  lastDrive = now;
  frameData.delta = elapsed;
  frameData.timestamp = now;
  frameData.isProcessing = true;
  const order = [
    'setup',
    'read',
    'resolveKeyframes',
    'preUpdate',
    'update',
    'preRender',
    'render',
    'postRender',
  ] as const;
  for (const key of order) {
    try {
      frameSteps[key]?.process(frameData);
    } catch {
      // a failing render step must never kill the driver loop
    }
  }
  frameData.isProcessing = false;
}

/** Current frozen state — lets late-mounting listeners read it synchronously. */
export function isRafShimmed(): boolean {
  return shimmed;
}

function dispatchFrozen(frozen: boolean): void {
  try {
    window.dispatchEvent(new CustomEvent(RAF_FROZEN_EVENT, { detail: frozen }));
  } catch {
    // non-fatal
  }
}

function installShim(): void {
  if (shimmed || !nativeRaf) return;
  shimmed = true;
  const shim = (cb: FrameRequestCallback): number =>
    window.setTimeout(() => cb(performance.now()), 16);
  window.requestAnimationFrame = shim as typeof window.requestAnimationFrame;
  // Paired cancel: the HTML spec keeps rAF handles and timer ids in separate
  // counters (Blink only shares a pool by accident), so cancelAnimationFrame
  // must be re-pointed too or cancelled frames keep ticking in FF/Safari.
  window.cancelAnimationFrame = ((id: number) => {
    window.clearTimeout(id);
  }) as typeof window.cancelAnimationFrame;
  // Drive motion's captured-at-module-eval frameloop manually while frozen.
  if (!motionDriver) {
    motionDriver = window.setInterval(driveMotionFrame, 32);
  }
  dispatchFrozen(true);
}

function restoreNative(): void {
  if (!shimmed || !nativeRaf || !nativeCancel) return;
  shimmed = false;
  if (motionDriver) {
    window.clearInterval(motionDriver);
    motionDriver = 0;
  }
  window.requestAnimationFrame = nativeRaf;
  window.cancelAnimationFrame = nativeCancel;
  dispatchFrozen(false);
}

export function installRafFallback(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  nativeRaf = window.requestAnimationFrame.bind(window);
  nativeCancel = window.cancelAnimationFrame.bind(window);

  const evaluate = () => {
    if (shimmed) {
      // Tab visible/healthy again? Re-probe native rAF and restore it.
      if (!document.hidden && probeNativeTicks(300) > 0) restoreNative();
      return;
    }
    if (probeNativeTicks(500) > 0) return; // healthy — keep native rAF
    // Zero ticks: distinguish "rAF throttled to zero" from "main thread
    // momentarily blocked" with a second confirmation probe.
    window.setTimeout(() => {
      if (!shimmed && probeNativeTicks(400) === 0) installShim();
    }, 250);
  };

  evaluate();
  window.addEventListener('visibilitychange', evaluate);
  window.addEventListener('pageshow', evaluate);
}
