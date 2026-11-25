import type { HologramVisualMood, PipelinePhase } from '../types/voicePersona';

/**
 * Maps backend `style_key` and `animation_state` from GET /api/v1/ava/{id}
 * to style-matched 3D holographic visual energy and motion cadence while
 * preserving the crisp micro-dot #030a14 holographic aesthetic.
 */
export function deriveAvaStyleVisualMood(
  baseMood: HologramVisualMood,
  styleKey: string | null | undefined,
  animationState: string | null | undefined,
): HologramVisualMood {
  const key = (styleKey ?? '').trim().toLowerCase();
  const anim = (animationState ?? '').trim().toLowerCase();

  const animSpeedMultiplier =
    anim === 'speaking' || anim === 'briefing'
      ? 1.24
      : anim === 'celebrate' || anim === 'energetic'
        ? 1.38
        : anim === 'thinking'
          ? 0.92
          : 1.0;

  if (/sport|athlet|football|soccer|basket|pitch|court/.test(key)) {
    return {
      ...baseMood,
      deepColor: [0.05, 0.78, 0.62],
      midColor: [0.34, 0.96, 0.82],
      coreColor: [0.92, 1.0, 0.96],
      dispersion: baseMood.dispersion * 1.05,
      scanSpeed: baseMood.scanSpeed * 1.12 * animSpeedMultiplier,
      accentHex: '#34d399',
      label: 'Athletic',
    };
  }

  if (/story|character|rpg|narrative|adventure/.test(key)) {
    return {
      ...baseMood,
      deepColor: [0.24, 0.56, 0.98],
      midColor: [0.58, 0.82, 1.0],
      coreColor: [0.96, 0.95, 1.0],
      dispersion: baseMood.dispersion * 1.14,
      scanSpeed: baseMood.scanSpeed * 0.95 * animSpeedMultiplier,
      accentHex: '#818cf8',
      label: 'Story',
    };
  }

  if (/strat|moba|rts|commander|dota|lol/.test(key)) {
    return {
      ...baseMood,
      deepColor: [0.08, 0.74, 0.88],
      midColor: [0.44, 0.95, 0.98],
      coreColor: [0.95, 1.0, 1.0],
      dispersion: baseMood.dispersion * 0.9,
      scanSpeed: baseMood.scanSpeed * 1.05 * animSpeedMultiplier,
      accentHex: '#38bdf8',
      label: 'Strategy',
    };
  }

  // Default: tactical / soldier / shooter
  return {
    ...baseMood,
    deepColor: [0.06, 0.72, 0.99],
    midColor: [0.46, 0.95, 1.0],
    coreColor: [0.96, 1.0, 1.0],
    scanSpeed: baseMood.scanSpeed * animSpeedMultiplier,
    accentHex: '#22d3ee',
    label: 'Tactical',
  };
}

/**
 * Reconciles live voice pipeline phase with backend `animation_state` from /api/v1/ava/{id}.
 * Live active phases (listening, thinking, speaking, barge_in) always take priority during
 * real-time interaction; when idle, honors backend animation_state hints.
 */
export function resolveEffectiveHologramPhase(
  livePhase: PipelinePhase,
  animationState: string | null | undefined,
): PipelinePhase {
  if (livePhase !== 'idle') return livePhase;
  const anim = (animationState ?? '').trim().toLowerCase();
  if (anim === 'speaking' || anim === 'briefing' || anim === 'talking') return 'speaking';
  if (anim === 'listening') return 'listening';
  if (anim === 'thinking' || anim === 'analyzing') return 'thinking';
  return 'idle';
}
