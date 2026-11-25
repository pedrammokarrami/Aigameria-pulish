import type { StageCommand, StageMode } from '../modules/analyz/engine/types';
import type {
  DeviceModelUrls,
  DeviceType,
  TrainingSequence,
} from '../modules/gamepad/types/trainer';
import type { AmbientColorRGB, VideoSource } from '../modules/projector/utils/media';

/** Any ISO 639-1 world language code (e.g., 'en', 'fa', 'ar', 'es', 'ja', 'de', 'tr', ...). */
export type Language = string;

/** Dynamic backend-defined game & category identifiers (zero hardcoded frontend unions). */
export type GameId = string;
export type GameCategory = string;

/**
 * Backend APIs may return either a localized map (`{ en, fa, es, ... }`)
 * or a plain pre-localized string based on the `Accept-Language` / `?lang=` request.
 */
export type LocalizedText = string | Record<string, string>;

export function resolveLocalizedText(
  value: LocalizedText | null | undefined,
  language: Language,
): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const normalized = language.trim().toLowerCase();
  const base = normalized.split(/[-_]/)[0] || 'en';
  if (typeof value[normalized] === 'string' && value[normalized].trim()) {
    return value[normalized];
  }
  if (typeof value[base] === 'string' && value[base].trim()) {
    return value[base];
  }
  if (typeof value.en === 'string' && value.en.trim()) {
    return value.en;
  }
  const first = Object.values(value).find((v) => typeof v === 'string' && v.trim());
  return first ?? '';
}

export interface CategoryDefinition {
  id: GameCategory;
  label: LocalizedText;
}

export interface GameDefinition {
  id: GameId;
  name: LocalizedText;
  shortName: string;
  category: GameCategory;
  accentHex: string;
  ambientRgb: AmbientColorRGB;
  allowedStageModes: StageMode[];
  tagline: LocalizedText;
}

export interface CoachingStep {
  id: string;
  cueTime: string;
  title: LocalizedText;
  detail: LocalizedText;
  inputHint: string;
}

export interface VideoChapter {
  timeSec: number;
  label: LocalizedText;
  overlayNote: LocalizedText;
}

/**
 * Lightweight skill summary returned by GET /api/aigameria/skills.
 * Heavy per-surface payloads (stage, video, controller, coaching) load independently
 * from their own granular endpoints so fast assets never block on slower media.
 */
export interface SkillSummary {
  id: string;
  gameId: GameId;
  category: GameCategory;
  /** Percentage position [0..100] on the interactive tactical discovery board */
  boardPos: { x: number; y: number };
  connectedTo: string[];
  code: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  difficulty: LocalizedText;
  durationSec: number;
  summary: LocalizedText;
}

export interface GamesApiResponse {
  games: GameDefinition[];
  categories: CategoryDefinition[];
}

export interface SkillsApiResponse {
  skills: SkillSummary[];
}

export interface SkillStagePayload {
  gameId: GameId;
  skillId: string;
  stageCommand: StageCommand | null;
}

export interface ApiVideoData {
  source: VideoSource;
  chapters: VideoChapter[];
  durationSec: number;
  /** When true, ProjectionScreen projects the game-isolated TacticalCanvas reel */
  useTacticalProjection?: boolean;
}

export interface SkillVideoPayload {
  gameId: GameId;
  skillId: string;
  video: ApiVideoData | null;
  ttlSeconds: number;
}

export interface SkillControllerPayload {
  gameId: GameId;
  skillId: string;
  sequences: Record<DeviceType, TrainingSequence> | null;
  models?: Partial<Record<DeviceType, DeviceModelUrls>>;
}

export interface SkillCoachingPayload {
  gameId: GameId;
  skillId: string;
  summary: LocalizedText;
  coachingSteps: CoachingStep[];
  quickPrompts: LocalizedText[];
  /** Optional ordered puzzle symbol / button sequence returned dynamically by API */
  symbolSequence?: string[];
  /** Optional spoken explanation script returned dynamically by API for AVA voice playback */
  voiceExplanation?: LocalizedText;
}

export interface GameDetailApiResponse {
  game: GameDefinition | null;
  skills: SkillSummary[];
}

/** Style-specific 3D .GLB hologram voice avatar returned by GET /api/v1/ava/{gameId}. */
export interface AvaAvatarConfig {
  gameId: GameId;
  glbUrl: string;
  styleKey: string;
  animationState: string;
  voiceName?: string;
  personaTone?: string;
  raw?: Record<string, unknown>;
}

export type ScreenCropPresetId = 'full' | 'tv-16-9' | 'center-focus';

export interface ScreenCropRect {
  /** Normalized crop origin & size in [0..1] */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LightweightKeyframe {
  timestampSec: number;
  width: number;
  height: number;
  dataUrl: string;
  approxBytes: number;
}

export interface LightweightMediaPayload {
  mediaType: 'image' | 'video';
  fileName: string;
  mimeType: string;
  originalBytes: number;
  processedBytes: number;
  width: number;
  height: number;
  durationSec?: number;
  contrastEnhanced: boolean;
  cropPreset: ScreenCropPresetId;
  cropRect: ScreenCropRect;
  keyframes: LightweightKeyframe[];
}

export interface MediaAnalysisResponse {
  ok: boolean;
  gameId: GameId;
  game: GameDefinition;
  topicId: string;
  skill: SkillSummary;
  detectedPlatform?: DeviceType;
  coaching: SkillCoachingPayload | null;
  stageCommand?: StageCommand | null;
  streamUrl?: string;
  ttlSeconds?: number;
}

export type ResourceStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

export interface ResourceState<T> {
  status: ResourceStatus;
  data: T | null;
  error: string | null;
  loadedAt: number | null;
}

export function createIdleResource<T>(): ResourceState<T> {
  return { status: 'idle', data: null, error: null, loadedAt: null };
}

export function createLoadingResource<T>(): ResourceState<T> {
  return { status: 'loading', data: null, error: null, loadedAt: null };
}

export function createReadyResource<T>(data: T, loadedAt = Date.now()): ResourceState<T> {
  return { status: 'ready', data, error: null, loadedAt };
}

export function createEmptyResource<T>(loadedAt = Date.now()): ResourceState<T> {
  return { status: 'empty', data: null, error: null, loadedAt };
}

export function createErrorResource<T>(error: string): ResourceState<T> {
  return { status: 'error', data: null, error, loadedAt: null };
}
