/**
 * rAF fallback shim — in background/idle browser tabs (and some phone
 * browsers), requestAnimationFrame is throttled to ZERO ticks, which froze
 * framer-motion mount animations (views stayed at opacity:0 forever) and any
 * rAF-gated work. This shim re-points window.requestAnimationFrame to a
 * setTimeout(16ms) scheduler whenever the native rAF doesn't tick within a
 * short probe window.
 */
export function installRafFallback(): void {
  if (typeof window === 'undefined') return;
  const nativeRaf = window.requestAnimationFrame.bind(window);
  let nativeTicks = 0;
  const probe = () => { nativeTicks++; };
  nativeRaf(probe);
  nativeRaf(probe);
  window.setTimeout(() => {
    if (nativeTicks >= 2) return; // healthy environment — keep native rAF
    const shim = (cb: FrameRequestCallback): number =>
      window.setTimeout(() => cb(performance.now()), 16);
    (window as unknown as { requestAnimationFrame: typeof window.requestAnimationFrame }).requestAnimationFrame =
      shim as unknown as typeof window.requestAnimationFrame;
  }, 400);
}
