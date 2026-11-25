import type { StageCommand, StageMode } from '../modules/analyz/engine/types';
import type {
  DeviceModelUrls,
  DeviceType,
  TrainingSequence,
} from '../modules/gamepad/types/trainer';
import { parseVideoUrl, type AmbientColorRGB, type VideoSource } from '../modules/projector/utils/media';
import { VIDEO_CACHE_TTL_SECONDS } from '../modules/media/videoCache';
import type {
  ApiVideoData,
  AvaAvatarConfig,
  CategoryDefinition,
  CoachingStep,
  GameDefinition,
  GameDetailApiResponse,
  GameId,
  GamesApiResponse,
  Language,
  LightweightKeyframe,
  LightweightMediaPayload,
  LocalizedText,
  MediaAnalysisResponse,
  SkillCoachingPayload,
  SkillControllerPayload,
  SkillStagePayload,
  SkillSummary,
  SkillVideoPayload,
  VideoChapter,
} from '../types/api';
import {
  delayWithAbort,
  getPresetTimingProfile,
  type TimingEndpointKey,
  type TimingSimulationProfile,
} from './timingSimulator';

/**
 * 100% API-driven frontend client for AIGAMERIA's live FastAPI backend (:8090).
 * Configure VITE_API_BASE_URL (e.g. "http://localhost:8090") in .env or leave empty
 * for same-origin reverse proxy. Contains ZERO hardcoded games, puzzles, maps,
 * coaching copy, controller presets, or demo videos.
 */
const RAW_API_BASE =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_API_BASE_URL ?? '';

const DEFAULT_LIVE_TIMING = getPresetTimingProfile('live');

const PLATFORM_ALIAS_MAP: Record<string, DeviceType> = {
  ps5: 'ps5',
  ps4: 'ps5',
  playstation: 'ps5',
  'playstation 5': 'ps5',
  dualsense: 'ps5',
  xbox: 'xbox',
  'xbox series x': 'xbox',
  'xbox series s': 'xbox',
  pc: 'pc',
  keyboard: 'pc',
  'keyboard/mouse': 'pc',
  ipad: 'ipad',
  ios: 'ipad',
  mobile: 'ipad',
  iphone: 'ipad',
};

export function normalizePlatformAlias(raw: unknown): DeviceType | undefined {
  if (typeof raw !== 'string') return undefined;
  return PLATFORM_ALIAS_MAP[raw.trim().toLowerCase()];
}

export function resolveApiUrl(
  pathname: string,
  language?: Language,
  baseOverride?: string,
): string {
  const base = (baseOverride ?? RAW_API_BASE).replace(/\/+$/, '');
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (!language) return `${base}${cleanPath}`;
  const sep = cleanPath.includes('?') ? '&' : '?';
  return `${base}${cleanPath}${sep}lang=${encodeURIComponent(language)}`;
}

export function resolveAssetUrl(rawUrl: string, baseOverride?: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  const base = (baseOverride ?? RAW_API_BASE).replace(/\/+$/, '');
  const clean = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${clean}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asLocalizedText(value: unknown): LocalizedText {
  if (typeof value === 'string') return value;
  const rec = asRecord(value);
  if (!rec) return '';
  const map: Record<string, string> = {};
  for (const [k, v] of Object.entries(rec)) {
    if (typeof v === 'string' && v.trim()) {
      map[k.toLowerCase()] = v;
    }
  }
  return Object.keys(map).length > 0 ? map : '';
}

function hexToRgb(hex: string): AmbientColorRGB {
  const clean = hex.replace('#', '').trim();
  if (/^[0-9a-f]{6}$/i.test(clean)) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return { r: 56, g: 189, b: 248 };
}

function computeBoardPos(index: number, total: number): { x: number; y: number } {
  const cols = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(Math.max(1, total)))));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const rows = Math.max(1, Math.ceil(total / cols));
  const x = Math.round(16 + (col / Math.max(1, cols - 1)) * 68);
  const y = Math.round(22 + (row / Math.max(1, rows - 1)) * 56);
  return {
    x: Number.isFinite(x) ? x : 50,
    y: Number.isFinite(y) ? y : 50,
  };
}

const VALID_STAGE_MODES = new Set<StageMode>([
  'football',
  'basketball',
  'weapon',
  'map',
  'strategy',
]);

function normalizeGame(raw: unknown): GameDefinition | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const id = String(rec.id ?? rec.game_id ?? rec.slug ?? '').trim();
  if (!id) return null;

  const name = asLocalizedText(rec.name ?? rec.title ?? rec.game_name ?? id);
  const shortName = String(
    rec.shortName ?? rec.short_name ?? rec.code ?? id.toUpperCase().slice(0, 8),
  ).trim();
  const category = String(rec.category ?? rec.genre ?? rec.style_key ?? 'general').trim();
  const accentHex = String(rec.accentHex ?? rec.accent_hex ?? rec.accent ?? '#38BDF8').trim();
  const ambientRaw = asRecord(rec.ambientRgb ?? rec.ambient_rgb);
  const ambientRgb: AmbientColorRGB = ambientRaw
    ? {
        r: Number(ambientRaw.r ?? 56),
        g: Number(ambientRaw.g ?? 189),
        b: Number(ambientRaw.b ?? 248),
      }
    : hexToRgb(accentHex);

  const rawModes = Array.isArray(rec.allowedStageModes)
    ? rec.allowedStageModes
    : Array.isArray(rec.allowed_stage_modes)
      ? rec.allowed_stage_modes
      : [];
  const allowedStageModes = rawModes.filter(
    (m): m is StageMode => typeof m === 'string' && VALID_STAGE_MODES.has(m as StageMode),
  );

  return {
    id,
    name,
    shortName,
    category,
    accentHex,
    ambientRgb,
    allowedStageModes,
    tagline: asLocalizedText(rec.tagline ?? rec.subtitle ?? rec.description ?? ''),
  };
}

function normalizeSkill(
  raw: unknown,
  index: number,
  total: number,
  fallbackGame?: GameDefinition | null,
): SkillSummary | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const id = String(rec.id ?? rec.topic_id ?? rec.skill_id ?? rec.slug ?? '').trim();
  const gameId = String(rec.gameId ?? rec.game_id ?? fallbackGame?.id ?? '').trim();
  if (!id || !gameId) return null;

  const posRec = asRecord(rec.boardPos ?? rec.board_pos ?? rec.position);
  const boardPos =
    posRec && typeof posRec.x === 'number' && typeof posRec.y === 'number'
      ? { x: posRec.x, y: posRec.y }
      : computeBoardPos(index, total);

  const connectedRaw = Array.isArray(rec.connectedTo)
    ? rec.connectedTo
    : Array.isArray(rec.connected_to)
      ? rec.connected_to
      : [];

  return {
    id,
    gameId,
    category: String(rec.category ?? fallbackGame?.category ?? 'general').trim(),
    boardPos,
    connectedTo: connectedRaw.map((c) => String(c)).filter(Boolean),
    code: String(rec.code ?? `T-${String(index + 1).padStart(2, '0')}`).trim(),
    title: asLocalizedText(rec.title ?? rec.name ?? id),
    subtitle: asLocalizedText(rec.subtitle ?? ''),
    difficulty: asLocalizedText(rec.difficulty ?? ''),
    durationSec: Number(rec.durationSec ?? rec.duration_sec ?? 0) || 0,
    summary: asLocalizedText(rec.summary ?? rec.description ?? ''),
  };
}

export function normalizeGamesResponse(raw: unknown): GamesApiResponse {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray(asRecord(raw)?.games)
      ? (asRecord(raw)!.games as unknown[])
      : Array.isArray(asRecord(raw)?.items)
        ? (asRecord(raw)!.items as unknown[])
        : [];

  const games = arr.map(normalizeGame).filter((g): g is GameDefinition => g !== null);

  const rec = asRecord(raw);
  const rawCats = Array.isArray(rec?.categories) ? (rec!.categories as unknown[]) : [];
  let categories: CategoryDefinition[] = rawCats
    .map((c): CategoryDefinition | null => {
      if (typeof c === 'string' && c.trim()) {
        return { id: c.trim(), label: c.trim() };
      }
      const cRec = asRecord(c);
      if (!cRec) return null;
      const cid = String(cRec.id ?? cRec.slug ?? '').trim();
      if (!cid) return null;
      return { id: cid, label: asLocalizedText(cRec.label ?? cRec.name ?? cid) };
    })
    .filter((c): c is CategoryDefinition => c !== null);

  if (categories.length === 0 && games.length > 0) {
    const seen = new Set<string>();
    categories = games
      .filter((g) => {
        if (!g.category || seen.has(g.category)) return false;
        seen.add(g.category);
        return true;
      })
      .map((g) => ({
        id: g.category,
        label: g.category
          .split(/[-_]/g)
          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
          .join(' '),
      }));
  }

  return { games, categories };
}

export function normalizeGameDetailResponse(
  raw: unknown,
  fallbackGame?: GameDefinition | null,
): GameDetailApiResponse {
  const rec = asRecord(raw);
  if (!rec) return { game: fallbackGame ?? null, skills: [] };

  const game =
    normalizeGame(rec.game ?? (rec.id || rec.game_id ? rec : null)) ?? fallbackGame ?? null;
  const rawList = Array.isArray(rec.skills)
    ? rec.skills
    : Array.isArray(rec.topics)
      ? rec.topics
      : Array.isArray(rec.items)
        ? rec.items
        : [];

  const skills = rawList
    .map((item, idx) => normalizeSkill(item, idx, rawList.length, game))
    .filter((s): s is SkillSummary => s !== null);

  return { game, skills };
}

export function normalizeStageResponse(
  raw: unknown,
  skillId: string,
  gameId: GameId,
): SkillStagePayload | null {
  const rec = asRecord(raw);
  if (!rec) return null;

  const candidate =
    asRecord(rec.stageCommand ?? rec.stage_command ?? rec.stage) ??
    (typeof rec.mode === 'string' && rec.payload ? rec : null);

  if (
    !candidate ||
    typeof candidate.mode !== 'string' ||
    !VALID_STAGE_MODES.has(candidate.mode as StageMode)
  ) {
    return null;
  }

  return {
    gameId: String(rec.gameId ?? rec.game_id ?? gameId),
    skillId: String(rec.skillId ?? rec.skill_id ?? rec.topic_id ?? skillId),
    stageCommand: candidate as unknown as StageCommand,
  };
}

export function normalizeMediaStreamResponse(
  raw: unknown,
  skillId: string,
  gameId: GameId,
): SkillVideoPayload | null {
  const rec = asRecord(raw);
  if (!rec) return null;

  const ttlSeconds =
    Number(rec.ttlSeconds ?? rec.ttl_seconds ?? VIDEO_CACHE_TTL_SECONDS) ||
    VIDEO_CACHE_TTL_SECONDS;
  const videoRec = asRecord(rec.video) ?? rec;

  let source: VideoSource | null = null;
  const existingSource = asRecord(videoRec.source);
  if (existingSource && typeof existingSource.kind === 'string') {
    source = existingSource as unknown as VideoSource;
  } else {
    const rawUrl = String(
      videoRec.stream_url ??
        videoRec.streamUrl ??
        videoRec.embed_url ??
        videoRec.embedUrl ??
        videoRec.url ??
        videoRec.src ??
        '',
    ).trim();

    if (rawUrl) {
      const parsed = parseVideoUrl(rawUrl);
      if (parsed.ok) {
        source = {
          ...parsed.source,
          id: String(videoRec.id ?? `stream-${skillId}`),
          title: String(videoRec.title ?? parsed.source.title),
        };
      } else {
        source = {
          id: String(videoRec.id ?? `stream-${skillId}`),
          kind: 'native',
          title: String(videoRec.title ?? skillId),
          src: rawUrl,
        };
      }
    } else if (videoRec.useTacticalProjection || videoRec.use_tactical_projection) {
      source = {
        id: String(videoRec.id ?? `projection-${skillId}`),
        kind: 'demo',
        title: String(videoRec.title ?? skillId),
      };
    }
  }

  if (!source) return null;

  const rawChapters = Array.isArray(videoRec.chapters) ? videoRec.chapters : [];
  const chapters: VideoChapter[] = rawChapters
    .map((ch): VideoChapter | null => {
      const c = asRecord(ch);
      if (!c) return null;
      return {
        timeSec: Number(c.timeSec ?? c.time_sec ?? c.start_sec ?? 0) || 0,
        label: asLocalizedText(c.label ?? c.title ?? ''),
        overlayNote: asLocalizedText(c.overlayNote ?? c.overlay_note ?? c.note ?? ''),
      };
    })
    .filter((c): c is VideoChapter => c !== null);

  const video: ApiVideoData = {
    source,
    chapters,
    durationSec: Number(videoRec.durationSec ?? videoRec.duration_sec ?? 0) || 0,
    useTacticalProjection: Boolean(
      videoRec.useTacticalProjection ?? videoRec.use_tactical_projection ?? false,
    ),
  };

  return {
    gameId: String(rec.gameId ?? rec.game_id ?? gameId),
    skillId: String(rec.skillId ?? rec.skill_id ?? skillId),
    video,
    ttlSeconds,
  };
}

export function normalizeGamepadResponse(
  raw: unknown,
  skillId: string,
  gameId: GameId,
): SkillControllerPayload | null {
  const rec = asRecord(raw);
  if (!rec) return null;

  const seqRec = asRecord(rec.sequences ?? rec.devices ?? rec.layouts);
  if (!seqRec || Object.keys(seqRec).length === 0) {
    return null;
  }

  const normalizedSequences: Partial<Record<DeviceType, TrainingSequence>> = {};
  for (const [k, v] of Object.entries(seqRec)) {
    const mapped = normalizePlatformAlias(k);
    if (mapped && asRecord(v)) {
      normalizedSequences[mapped] = v as unknown as TrainingSequence;
    }
  }

  if (Object.keys(normalizedSequences).length === 0) return null;

  const modelsRec = asRecord(rec.models ?? rec.glb_models);
  const models: Partial<Record<DeviceType, DeviceModelUrls>> | undefined = modelsRec
    ? (modelsRec as Partial<Record<DeviceType, DeviceModelUrls>>)
    : undefined;

  return {
    gameId: String(rec.gameId ?? rec.game_id ?? gameId),
    skillId: String(rec.skillId ?? rec.skill_id ?? skillId),
    sequences: normalizedSequences as Record<DeviceType, TrainingSequence>,
    models,
  };
}

export function normalizeCoachTopicResponse(
  raw: unknown,
  skillId: string,
  gameId: GameId,
): SkillCoachingPayload | null {
  const rec = asRecord(raw);
  if (!rec) return null;

  const rawSteps = Array.isArray(rec.coachingSteps)
    ? rec.coachingSteps
    : Array.isArray(rec.coaching_steps)
      ? rec.coaching_steps
      : Array.isArray(rec.puzzle_steps)
        ? rec.puzzle_steps
        : Array.isArray(rec.puzzleSteps)
          ? rec.puzzleSteps
          : Array.isArray(rec.steps)
            ? rec.steps
            : [];

  const coachingSteps: CoachingStep[] = rawSteps
    .map((s, idx): CoachingStep | null => {
      if (typeof s === 'string' && s.trim()) {
        return {
          id: `step-${idx + 1}`,
          cueTime: `0${idx + 1}`,
          title: `Step ${idx + 1}`,
          detail: s.trim(),
          inputHint: '',
        };
      }
      const sr = asRecord(s);
      if (!sr) return null;
      return {
        id: String(sr.id ?? `step-${idx + 1}`),
        cueTime: String(
          sr.cueTime ?? sr.cue_time ?? sr.timestamp ?? sr.step_number ?? `0${idx + 1}`,
        ),
        title: asLocalizedText(sr.title ?? sr.heading ?? sr.symbol ?? `Step ${idx + 1}`),
        detail: asLocalizedText(sr.detail ?? sr.body ?? sr.instruction ?? sr.description ?? ''),
        inputHint: String(sr.inputHint ?? sr.input_hint ?? sr.button ?? sr.input ?? ''),
      };
    })
    .filter((s): s is CoachingStep => s !== null);

  const rawPrompts = Array.isArray(rec.quickPrompts)
    ? rec.quickPrompts
    : Array.isArray(rec.quick_prompts)
      ? rec.quick_prompts
      : Array.isArray(rec.prompts)
        ? rec.prompts
        : [];

  const quickPrompts = rawPrompts
    .map((p) => asLocalizedText(p))
    .filter((p) => (typeof p === 'string' ? p.trim().length > 0 : Object.keys(p).length > 0));

  const rawSymbols = Array.isArray(rec.symbol_sequence)
    ? rec.symbol_sequence
    : Array.isArray(rec.symbolSequence)
      ? rec.symbolSequence
      : Array.isArray(rec.symbols)
        ? rec.symbols
        : [];
  const symbolSequence = rawSymbols
    .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
    .filter(Boolean);

  const summary = asLocalizedText(rec.summary ?? rec.brief ?? rec.solution_summary ?? '');
  const voiceExplanation = asLocalizedText(
    rec.voice_explanation ?? rec.voiceExplanation ?? rec.spoken_summary ?? '',
  );

  if (
    coachingSteps.length === 0 &&
    quickPrompts.length === 0 &&
    symbolSequence.length === 0 &&
    !summary
  ) {
    return null;
  }

  return {
    gameId: String(rec.gameId ?? rec.game_id ?? gameId),
    skillId: String(rec.skillId ?? rec.skill_id ?? rec.topic ?? skillId),
    summary,
    coachingSteps,
    quickPrompts,
    symbolSequence: symbolSequence.length > 0 ? symbolSequence : undefined,
    voiceExplanation:
      (typeof voiceExplanation === 'string'
        ? voiceExplanation.trim().length > 0
        : Object.keys(voiceExplanation).length > 0)
        ? voiceExplanation
        : undefined,
  };
}

export function normalizeAvaResponse(raw: unknown, gameId: GameId): AvaAvatarConfig | null {
  const rec = asRecord(raw);
  if (!rec) return null;

  const glbUrlRaw = String(rec.glb_url ?? rec.glbUrl ?? rec.model_url ?? '').trim();
  if (!glbUrlRaw) return null;

  const styleKey = String(rec.style_key ?? rec.styleKey ?? rec.style ?? 'tactical').trim();
  const animationState = String(
    rec.animation_state ?? rec.animationState ?? rec.state ?? 'idle',
  ).trim();
  const voiceRec = asRecord(rec.voice);
  const voiceName = String(
    rec.voice_name ?? rec.voiceName ?? voiceRec?.voiceName ?? voiceRec?.voice_name ?? '',
  ).trim();
  const personaTone = String(rec.persona_tone ?? rec.personaTone ?? rec.tone ?? '').trim();

  return {
    gameId: String(rec.game_id ?? rec.gameId ?? gameId),
    glbUrl: resolveAssetUrl(glbUrlRaw),
    styleKey,
    animationState,
    voiceName: voiceName || undefined,
    personaTone: personaTone || undefined,
    raw: rec,
  };
}

/**
 * Normalizes POST /api/v1/media/analyze response (e.g. TV photo/video puzzle detection).
 * Strictly returns null if backend did not confirm a real detected gameId — zero fake defaults.
 */
export function normalizeMediaAnalyzeResponse(raw: unknown): MediaAnalysisResponse | null {
  const rec = asRecord(raw);
  if (!rec) return null;

  const gameRec = asRecord(rec.game);
  const detectedGameId = String(
    rec.game_id ?? rec.gameId ?? gameRec?.id ?? gameRec?.game_id ?? '',
  ).trim();
  if (!detectedGameId) return null;

  const game: GameDefinition =
    normalizeGame(
      gameRec ?? {
        id: detectedGameId,
        name: rec.game_name ?? rec.gameName ?? detectedGameId,
        short_name: rec.short_name ?? rec.shortName ?? detectedGameId.toUpperCase().slice(0, 8),
        category: rec.category ?? rec.style_key ?? 'story',
        accent_hex: rec.accent_hex ?? rec.accentHex ?? '#38BDF8',
        allowed_stage_modes: rec.allowed_stage_modes ?? rec.allowedStageModes ?? [],
        tagline: rec.game_tagline ?? rec.tagline ?? '',
      },
    ) ?? {
      id: detectedGameId,
      name: detectedGameId,
      shortName: detectedGameId.toUpperCase().slice(0, 8),
      category: 'story',
      accentHex: '#38BDF8',
      ambientRgb: { r: 56, g: 189, b: 248 },
      allowedStageModes: [],
      tagline: '',
    };

  const topicId = String(
    rec.topic_id ?? rec.topicId ?? rec.skill_id ?? rec.skillId ?? rec.puzzle_id ?? `${detectedGameId}-puzzle`,
  ).trim();

  const skill: SkillSummary = {
    id: topicId,
    gameId: detectedGameId,
    category: game.category,
    boardPos: { x: 50, y: 50 },
    connectedTo: [],
    code: String(rec.code ?? 'SCAN-01'),
    title: asLocalizedText(rec.puzzle_title ?? rec.title ?? rec.topic_title ?? topicId),
    subtitle: asLocalizedText(rec.subtitle ?? rec.chapter ?? ''),
    difficulty: asLocalizedText(rec.difficulty ?? ''),
    durationSec: Number(rec.duration_sec ?? rec.durationSec ?? 0) || 0,
    summary: asLocalizedText(rec.summary ?? rec.solution_summary ?? ''),
  };

  const coaching = normalizeCoachTopicResponse(rec, topicId, detectedGameId);
  const stagePayload = normalizeStageResponse(rec, topicId, detectedGameId);
  const detectedPlatform = normalizePlatformAlias(
    rec.platform ?? rec.detected_platform ?? rec.device ?? rec.console,
  );

  return {
    ok: rec.ok !== false,
    gameId: detectedGameId,
    game,
    topicId,
    skill,
    detectedPlatform,
    coaching,
    stageCommand: stagePayload?.stageCommand ?? null,
    streamUrl:
      typeof (rec.stream_url ?? rec.streamUrl) === 'string'
        ? String(rec.stream_url ?? rec.streamUrl)
        : undefined,
    ttlSeconds: Number(rec.ttl_seconds ?? rec.ttlSeconds ?? VIDEO_CACHE_TTL_SECONDS),
  };
}

async function fetchJsonWithTiming<T>(
  pathname: string,
  endpointKey: TimingEndpointKey,
  language: Language,
  timing: TimingSimulationProfile = DEFAULT_LIVE_TIMING,
  signal?: AbortSignal,
): Promise<T | null> {
  const delayMs = timing.delaysMs[endpointKey] ?? 0;
  if (delayMs > 0) {
    await delayWithAbort(delayMs, signal);
  }

  const response = await fetch(resolveApiUrl(pathname, language), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Accept-Language': language,
    },
    signal,
  });

  if (response.status === 204 || response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`API ${pathname} returned HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null;
  }
  const payload = (await response.json()) as T;
  // AIGAMERIA FastAPI envelope: {success, data} — unwrap so the existing
  // normalizers see the inner payload directly.
  const rec = payload as Record<string, unknown> | null;
  if (rec && typeof rec === 'object' && 'success' in rec && 'data' in rec) {
    return rec.data as T;
  }
  return payload;
}

/** 1. GET /api/v1/games */
export async function fetchGamesCatalog(
  language: Language,
  timing: TimingSimulationProfile = DEFAULT_LIVE_TIMING,
  signal?: AbortSignal,
): Promise<GamesApiResponse | null> {
  const raw = await fetchJsonWithTiming<unknown>('/api/v1/games', 'games', language, timing, signal);
  if (!raw) return null;
  return normalizeGamesResponse(raw);
}

/** 2. GET /api/v1/games/{id} */
export async function fetchGameDetail(
  gameId: GameId,
  language: Language,
  timing: TimingSimulationProfile = DEFAULT_LIVE_TIMING,
  signal?: AbortSignal,
  fallbackGame?: GameDefinition | null,
): Promise<GameDetailApiResponse | null> {
  const raw = await fetchJsonWithTiming<unknown>(
    `/api/v1/games/${encodeURIComponent(gameId)}`,
    'gameDetail',
    language,
    timing,
    signal,
  );
  if (!raw) return null;
  return normalizeGameDetailResponse(raw, fallbackGame);
}

/** 3. GET /api/v1/coach/{id}/topics/{topic} */
export async function fetchCoachTopic(
  gameId: GameId,
  topicId: string,
  language: Language,
  timing: TimingSimulationProfile = DEFAULT_LIVE_TIMING,
  signal?: AbortSignal,
): Promise<SkillCoachingPayload | null> {
  const raw = await fetchJsonWithTiming<unknown>(
    `/api/v1/coach/${encodeURIComponent(gameId)}/topics/${encodeURIComponent(topicId)}`,
    'coach',
    language,
    timing,
    signal,
  );
  if (!raw) return null;
  return normalizeCoachTopicResponse(raw, topicId, gameId);
}

/** 4. GET /api/v1/media/stream/{gameId}?topic={topicId} */
export async function fetchMediaStream(
  gameId: GameId,
  topicId: string,
  language: Language,
  timing: TimingSimulationProfile = DEFAULT_LIVE_TIMING,
  signal?: AbortSignal,
): Promise<SkillVideoPayload | null> {
  const raw = await fetchJsonWithTiming<unknown>(
    `/api/v1/media/stream/${encodeURIComponent(gameId)}?topic=${encodeURIComponent(topicId)}`,
    'media',
    language,
    timing,
    signal,
  );
  if (!raw) return null;
  return normalizeMediaStreamResponse(raw, topicId, gameId);
}

/** 5. GET /api/v1/stage/{gameId}?topic={topicId} */
export async function fetchStage(
  gameId: GameId,
  topicId: string,
  language: Language,
  timing: TimingSimulationProfile = DEFAULT_LIVE_TIMING,
  signal?: AbortSignal,
): Promise<SkillStagePayload | null> {
  const raw = await fetchJsonWithTiming<unknown>(
    `/api/v1/stage/${encodeURIComponent(gameId)}?topic=${encodeURIComponent(topicId)}`,
    'stage',
    language,
    timing,
    signal,
  );
  if (!raw) return null;
  return normalizeStageResponse(raw, topicId, gameId);
}

/** 6. GET /api/v1/gamepad/{gameId}?topic={topicId} */
export async function fetchGamepad(
  gameId: GameId,
  topicId: string,
  language: Language,
  timing: TimingSimulationProfile = DEFAULT_LIVE_TIMING,
  signal?: AbortSignal,
): Promise<SkillControllerPayload | null> {
  const raw = await fetchJsonWithTiming<unknown>(
    `/api/v1/gamepad/${encodeURIComponent(gameId)}?topic=${encodeURIComponent(topicId)}`,
    'gamepad',
    language,
    timing,
    signal,
  );
  if (!raw) return null;
  return normalizeGamepadResponse(raw, topicId, gameId);
}

/** 7. GET /api/v1/ava/{gameId} — reads glb_url, style_key, animation_state */
export async function fetchAvaConfig(
  gameId: GameId,
  language: Language,
  timing: TimingSimulationProfile = DEFAULT_LIVE_TIMING,
  signal?: AbortSignal,
): Promise<AvaAvatarConfig | null> {
  const raw = await fetchJsonWithTiming<unknown>(
    `/api/v1/ava/${encodeURIComponent(gameId)}`,
    'ava',
    language,
    timing,
    signal,
  );
  if (!raw) return null;
  return normalizeAvaResponse(raw, gameId);
}

/** POST /api/v1/coach/{id}/topics/{topic} — live topic-scoped coaching Q&A */
export async function postCoachPrompt(params: {
  prompt: string;
  gameId: string;
  topicId: string;
  gameName: string;
  skillTitle: string;
  language: Language;
}): Promise<{ ok?: boolean; reply?: string; error?: string }> {
  const url = resolveApiUrl(
    `/api/v1/coach/${encodeURIComponent(params.gameId)}/topics/${encodeURIComponent(params.topicId)}`,
    params.language,
  );
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Language': params.language,
    },
    body: JSON.stringify({
      prompt: params.prompt,
      game_id: params.gameId,
      topic: params.topicId,
      game_name: params.gameName,
      skill_title: params.skillTitle,
      language: params.language,
    }),
  });

  const data = (await res.json()) as { ok?: boolean; reply?: string; answer?: string; error?: string };
  const reply = data.reply ?? data.answer;
  if (!res.ok || !reply) {
    throw new Error(data.error || `Coach API returned HTTP ${res.status}`);
  }
  return { ok: true, reply };
}

/**
 * POST /api/v1/media/analyze — sends ONLY lean client-side pre-processed TV/monitor
 * keyframes (downscaled, contrast-enhanced, optionally cropped) + user question.
 */
export async function postMediaAnalyze(params: {
  payload: LightweightMediaPayload;
  selectedKeyframes?: LightweightKeyframe[];
  question: string;
  language: Language;
  hintGameId?: string | null;
  timing?: TimingSimulationProfile;
  signal?: AbortSignal;
}): Promise<MediaAnalysisResponse> {
  const delayMs = params.timing?.delaysMs.coach ?? 0;
  if (delayMs > 0) {
    await delayWithAbort(delayMs, params.signal);
  }

  const framesToSend =
    params.selectedKeyframes && params.selectedKeyframes.length > 0
      ? params.selectedKeyframes
      : params.payload.keyframes;

  const res = await fetch(resolveApiUrl('/api/v1/media/analyze', params.language), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Language': params.language,
    },
    signal: params.signal,
    body: JSON.stringify({
      question: params.question.trim(),
      lang: params.language,
      hint_game_id: params.hintGameId ?? undefined,
      media_type: params.payload.mediaType,
      file_name: params.payload.fileName,
      mime_type: params.payload.mimeType,
      original_bytes: params.payload.originalBytes,
      processed_bytes: framesToSend.reduce((sum, kf) => sum + kf.approxBytes, 0),
      width: params.payload.width,
      height: params.payload.height,
      duration_sec: params.payload.durationSec,
      contrast_enhanced: params.payload.contrastEnhanced,
      crop_preset: params.payload.cropPreset,
      crop_rect: params.payload.cropRect,
      keyframes: framesToSend.map((kf) => ({
        timestamp_sec: kf.timestampSec,
        width: kf.width,
        height: kf.height,
        data_url: kf.dataUrl,
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Media analyze API returned HTTP ${res.status}`);
  }
  const raw = (await res.json()) as unknown;
  const normalized = normalizeMediaAnalyzeResponse(raw);
  if (!normalized) {
    throw new Error('Media analyze API did not confirm a detected game.');
  }
  return normalized;
}
