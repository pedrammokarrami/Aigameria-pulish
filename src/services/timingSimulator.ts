/**
 * Modular Frontend Multi-Latency Timing Simulator.
 * Lets QA & developers simulate fast .GLB loads vs. delayed video streams,
 * staggered waterfalls, or slow backend responses without modifying the backend.
 * Designed for 1-line removal upon final freeze ("اوکی نهایی").
 */

export type TimingEndpointKey =
  | 'games'
  | 'gameDetail'
  | 'stage'
  | 'media'
  | 'gamepad'
  | 'coach'
  | 'ava'
  | 'glbLoad';

export type TimingPresetId =
  | 'live'
  | 'fast-glb-slow-video'
  | 'staggered-waterfall'
  | 'slow-backend'
  | 'custom';

export interface TimingSimulationProfile {
  presetId: TimingPresetId;
  delaysMs: Record<TimingEndpointKey, number>;
}

export const TIMING_ENDPOINTS: readonly TimingEndpointKey[] = [
  'games',
  'gameDetail',
  'stage',
  'media',
  'gamepad',
  'coach',
  'ava',
  'glbLoad',
] as const;

const ZERO_DELAYS: Record<TimingEndpointKey, number> = {
  games: 0,
  gameDetail: 0,
  stage: 0,
  media: 0,
  gamepad: 0,
  coach: 0,
  ava: 0,
  glbLoad: 0,
};

export const TIMING_PRESETS: Record<
  Exclude<TimingPresetId, 'custom'>,
  {
    label: string;
    description: string;
    delaysMs: Record<TimingEndpointKey, number>;
  }
> = {
  live: {
    label: 'Live (0ms)',
    description: 'Direct backend speed with zero simulated delay.',
    delaysMs: { ...ZERO_DELAYS },
  },
  'fast-glb-slow-video': {
    label: 'Fast .GLB / Slow Video',
    description: 'Controller & AVA .GLB arrive in ~160ms while video stream resolves at 2800ms.',
    delaysMs: {
      games: 120,
      gameDetail: 180,
      gamepad: 160,
      ava: 160,
      glbLoad: 180,
      stage: 900,
      coach: 1450,
      media: 2800,
    },
  },
  'staggered-waterfall': {
    label: 'Staggered Waterfall',
    description: 'Each section resolves on its own staggered cadence to test independent reveals.',
    delaysMs: {
      games: 260,
      gameDetail: 520,
      gamepad: 760,
      ava: 960,
      glbLoad: 420,
      stage: 1350,
      coach: 1900,
      media: 2650,
    },
  },
  'slow-backend': {
    label: 'Slow Backend',
    description: 'High-latency network simulation (1.2s–3.4s) to verify strict hidden-until-ready.',
    delaysMs: {
      games: 1200,
      gameDetail: 1500,
      gamepad: 1800,
      ava: 1600,
      glbLoad: 1100,
      stage: 2300,
      coach: 2800,
      media: 3400,
    },
  },
};

export function getPresetTimingProfile(
  presetId: Exclude<TimingPresetId, 'custom'>,
): TimingSimulationProfile {
  return {
    presetId,
    delaysMs: { ...TIMING_PRESETS[presetId].delaysMs },
  };
}

export function clampDelayMs(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(8000, Math.round(value));
}

const QUERY_PARAM_TO_KEY: Record<string, TimingEndpointKey> = {
  delayGames: 'games',
  delayGameDetail: 'gameDetail',
  delayStage: 'stage',
  delayMedia: 'media',
  delayVideo: 'media',
  delayGamepad: 'gamepad',
  delayController: 'gamepad',
  delayCoach: 'coach',
  delayAva: 'ava',
  delayGlb: 'glbLoad',
};

export function parseTimingSimulationFromSearch(search: string): {
  profile: TimingSimulationProfile;
  panelInitiallyOpen: boolean;
} {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const presetParam = params.get('preset') as Exclude<TimingPresetId, 'custom'> | null;
  const baseProfile =
    presetParam && presetParam in TIMING_PRESETS
      ? getPresetTimingProfile(presetParam)
      : getPresetTimingProfile('live');

  let customized = false;
  const delaysMs = { ...baseProfile.delaysMs };

  for (const [paramName, key] of Object.entries(QUERY_PARAM_TO_KEY)) {
    const raw = params.get(paramName);
    if (raw !== null && raw.trim() !== '') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        delaysMs[key] = clampDelayMs(parsed);
        customized = true;
      }
    }
  }

  return {
    profile: {
      presetId: customized ? 'custom' : baseProfile.presetId,
      delaysMs,
    },
    panelInitiallyOpen: params.get('timing') === 'open' || params.get('timing') === '1',
  };
}

/** Abort-aware delay helper for simulating per-endpoint or per-asset network latency. */
export function delayWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  const safeMs = clampDelayMs(ms);
  if (safeMs <= 0) return Promise.resolve();
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, safeMs);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
