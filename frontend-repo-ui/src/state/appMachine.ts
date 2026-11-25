import {
  ATTACHMENT_CATALOG,
  calculateWeaponStats,
} from '../modules/analyz/engine/presets';
import type { AttachmentSlot, StageCommand } from '../modules/analyz/engine/types';
import type { DeviceType } from '../modules/gamepad/types/trainer';
import type { VideoSource } from '../modules/projector/utils/media';
import {
  createEmptyResource,
  createErrorResource,
  createIdleResource,
  createLoadingResource,
  createReadyResource,
  type CategoryDefinition,
  type GameCategory,
  type GameDefinition,
  type GameId,
  type Language,
  type MediaAnalysisResponse,
  type ResourceState,
  type SkillCoachingPayload,
  type SkillControllerPayload,
  type SkillStagePayload,
  type SkillSummary,
  type SkillVideoPayload,
} from '../types/api';

export type ScreenId = 'discovery' | 'coaching';
export type StageTabId = 'tactical' | 'video' | 'controller';
export type AvaStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface CoachMessage {
  id: string;
  role: 'user' | 'ava';
  text: string;
  gameId: GameId;
  skillId: string;
  timestamp: number;
}

export interface AppState {
  screen: ScreenId;
  language: Language;
  /** 100% API-driven catalogs — strictly empty until API resolves */
  gamesResource: ResourceState<GameDefinition[]>;
  categories: CategoryDefinition[];
  skillsResource: ResourceState<SkillSummary[]>;
  /** Independent per-skill API resources so fast assets reveal without waiting for slow media */
  stageBySkill: Record<string, ResourceState<SkillStagePayload>>;
  videoBySkill: Record<string, ResourceState<SkillVideoPayload>>;
  controllerBySkill: Record<string, ResourceState<SkillControllerPayload>>;
  coachingBySkill: Record<string, ResourceState<SkillCoachingPayload>>;
  /** Hologram runtime /api/v1/ava/{gameId} + .glb readiness */
  hologramReady: boolean;
  /** True while POST /api/v1/media/analyze is running; hides all previous game results */
  mediaAnalyzing: boolean;
  /** Live scanned puzzle topics returned by POST /api/v1/media/analyze (preserved across catalog refreshes) */
  scannedSkills: SkillSummary[];

  selectedGameId: GameId | 'all';
  selectedCategory: GameCategory | 'all';
  searchQuery: string;
  /** Node currently expanded inline on Screen 1 (null until API skills arrive) */
  selectedNodeId: string | null;
  /** Active skill inside Screen 2 (null until API skills arrive) */
  activeSkillId: string | null;
  activeGameId: GameId | null;
  /** Preferred/active stage tab; may auto-switch to first ready tab if current is pending */
  stageTab: StageTabId | null;
  preferredStageTab: StageTabId | null;

  controllerDevice: DeviceType;
  controllerMode: 'demo' | 'practice';
  avaOpen: boolean;
  avaStatus: AvaStatus;
  uploadModalOpen: boolean;
  /** Optional interactive weapon attachment override for weapon stage skills */
  stageCommandOverrides: Record<string, StageCommand>;
  /** Custom uploaded or URL-loaded videos keyed by `${gameId}::${skillId}` */
  customVideos: Record<string, VideoSource>;
  /** Live coaching messages scoped by skillId */
  coachMessages: CoachMessage[];
}

export type AppAction =
  | { type: 'RESET_API_RESOURCES' }
  | { type: 'GAMES_LOADING' }
  | { type: 'GAMES_LOADED'; games: GameDefinition[]; categories: CategoryDefinition[] }
  | { type: 'GAMES_EMPTY' }
  | { type: 'GAMES_ERROR'; error: string }
  | { type: 'SKILLS_LOADING' }
  | { type: 'SKILLS_LOADED'; skills: SkillSummary[] }
  | { type: 'SKILLS_EMPTY' }
  | { type: 'SKILLS_ERROR'; error: string }
  | { type: 'SKILL_STAGE_LOADING'; skillId: string }
  | { type: 'SKILL_STAGE_LOADED'; skillId: string; payload: SkillStagePayload | null }
  | { type: 'SKILL_STAGE_ERROR'; skillId: string; error: string }
  | { type: 'SKILL_VIDEO_LOADING'; skillId: string }
  | { type: 'SKILL_VIDEO_LOADED'; skillId: string; payload: SkillVideoPayload | null }
  | { type: 'SKILL_VIDEO_ERROR'; skillId: string; error: string }
  | { type: 'SKILL_CONTROLLER_LOADING'; skillId: string }
  | { type: 'SKILL_CONTROLLER_LOADED'; skillId: string; payload: SkillControllerPayload | null }
  | { type: 'SKILL_CONTROLLER_ERROR'; skillId: string; error: string }
  | { type: 'SKILL_COACHING_LOADING'; skillId: string }
  | { type: 'SKILL_COACHING_LOADED'; skillId: string; payload: SkillCoachingPayload | null }
  | { type: 'SKILL_COACHING_ERROR'; skillId: string; error: string }
  | { type: 'SET_HOLOGRAM_READY'; ready: boolean }
  | { type: 'SET_LANGUAGE'; language: Language }
  | { type: 'SELECT_GAME'; gameId: GameId | 'all' }
  | { type: 'SELECT_CATEGORY'; category: GameCategory | 'all' }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'RESET_FILTERS' }
  | { type: 'SELECT_BOARD_NODE'; nodeId: string | null }
  | { type: 'ENTER_COACHING_ROOM'; skillId?: string; stageTab?: StageTabId }
  | { type: 'EXIT_COACHING_ROOM' }
  | { type: 'SET_STAGE_TAB'; tab: StageTabId }
  | { type: 'SET_CONTROLLER_DEVICE'; device: DeviceType }
  | { type: 'SET_CONTROLLER_MODE'; mode: 'demo' | 'practice' }
  | { type: 'TOGGLE_AVA'; open?: boolean }
  | { type: 'SET_AVA_STATUS'; status: AvaStatus }
  | { type: 'TOGGLE_UPLOAD_MODAL'; open?: boolean }
  | { type: 'BEGIN_MEDIA_ANALYSIS' }
  | { type: 'MEDIA_ANALYSIS_FAILED' }
  | { type: 'MEDIA_ANALYSIS_RESOLVED'; result: MediaAnalysisResponse }
  | { type: 'ATTACH_VIDEO_SOURCE'; gameId: GameId; skillId: string; source: VideoSource }
  | { type: 'CYCLE_WEAPON_ATTACHMENT'; skillId: string; slot: AttachmentSlot }
  | { type: 'APPEND_COACH_MESSAGE'; message: CoachMessage };

export function createInitialAppState(): AppState {
  return {
    screen: 'discovery',
    language: 'en',
    gamesResource: createIdleResource<GameDefinition[]>(),
    categories: [],
    skillsResource: createIdleResource<SkillSummary[]>(),
    stageBySkill: {},
    videoBySkill: {},
    controllerBySkill: {},
    coachingBySkill: {},
    hologramReady: false,
    mediaAnalyzing: false,
    scannedSkills: [],

    selectedGameId: 'all',
    selectedCategory: 'all',
    searchQuery: '',
    selectedNodeId: null,
    activeSkillId: null,
    activeGameId: null,
    stageTab: null,
    preferredStageTab: null,

    controllerDevice: 'ps5',
    controllerMode: 'demo',
    avaOpen: false,
    avaStatus: 'idle',
    uploadModalOpen: false,
    stageCommandOverrides: {},
    customVideos: {},
    coachMessages: [],
  };
}

export function selectGames(state: AppState): GameDefinition[] {
  return state.gamesResource.status === 'ready' && state.gamesResource.data
    ? state.gamesResource.data
    : [];
}

export function selectGameById(state: AppState, gameId: GameId | null): GameDefinition | null {
  if (!gameId) return null;
  return selectGames(state).find((g) => g.id === gameId) ?? null;
}

export function selectAllSkills(state: AppState): SkillSummary[] {
  return state.skillsResource.status === 'ready' && state.skillsResource.data
    ? state.skillsResource.data
    : [];
}

function collectLocalizedStrings(text: string | Record<string, string> | undefined): string[] {
  if (!text) return [];
  if (typeof text === 'string') return [text];
  return Object.values(text).filter((v): v is string => typeof v === 'string');
}

export function selectVisibleNodes(state: AppState): SkillSummary[] {
  const skills = selectAllSkills(state);
  if (skills.length === 0) return [];
  const gamesById = new Map(selectGames(state).map((g) => [g.id, g]));
  const q = state.searchQuery.trim().toLowerCase();

  return skills.filter((node) => {
    if (state.selectedGameId !== 'all' && node.gameId !== state.selectedGameId) {
      return false;
    }
    if (state.selectedCategory !== 'all' && node.category !== state.selectedCategory) {
      return false;
    }
    if (!q) return true;
    const game = gamesById.get(node.gameId);
    const haystack = [
      node.code,
      ...collectLocalizedStrings(node.title),
      ...collectLocalizedStrings(node.subtitle),
      ...collectLocalizedStrings(node.summary),
      ...collectLocalizedStrings(game?.name),
      game?.shortName ?? '',
      node.category,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function selectActiveSkill(state: AppState): SkillSummary | null {
  const skills = selectAllSkills(state);
  if (skills.length === 0 || !state.activeSkillId) return null;
  const direct = skills.find((s) => s.id === state.activeSkillId);
  if (direct && (!state.activeGameId || direct.gameId === state.activeGameId)) {
    return direct;
  }
  if (state.activeGameId) {
    return skills.find((s) => s.gameId === state.activeGameId) ?? null;
  }
  return null;
}

export function selectActiveGame(state: AppState): GameDefinition | null {
  const skill = selectActiveSkill(state);
  return selectGameById(state, skill?.gameId ?? state.activeGameId);
}

/**
 * Strict gameId isolation guard driven entirely by API-provided game.allowedStageModes.
 * Returns null if stage API has not arrived yet or violates game isolation.
 */
export function selectActiveStageCommand(state: AppState): StageCommand | null {
  const skill = selectActiveSkill(state);
  if (!skill) return null;
  const stageRes = state.stageBySkill[skill.id];
  const baseCommand =
    stageRes?.status === 'ready' ? (stageRes.data?.stageCommand ?? null) : null;
  const candidate = state.stageCommandOverrides[skill.id] ?? baseCommand;
  if (!candidate) return null;

  const game = selectGameById(state, skill.gameId);
  if (game && game.allowedStageModes.length > 0 && !game.allowedStageModes.includes(candidate.mode)) {
    return null;
  }
  return candidate;
}

/**
 * Computes which stage tabs are genuinely ready to render for a skill.
 * Hidden-until-ready: pending or empty API resources are completely excluded.
 */
export function selectReadyStageTabs(state: AppState, skillId: string | null): StageTabId[] {
  if (!skillId) return [];
  const skill = selectAllSkills(state).find((s) => s.id === skillId) ?? null;
  if (!skill) return [];

  const ready: StageTabId[] = [];
  const stageRes = state.stageBySkill[skillId];
  const game = selectGameById(state, skill.gameId);
  const stageCmd =
    stageRes?.status === 'ready' ? (stageRes.data?.stageCommand ?? null) : null;
  if (
    stageCmd &&
    (!game || game.allowedStageModes.length === 0 || game.allowedStageModes.includes(stageCmd.mode))
  ) {
    ready.push('tactical');
  }

  const videoRes = state.videoBySkill[skillId];
  const customVideoKey = `${skill.gameId}::${skill.id}`;
  const hasVideo =
    Boolean(state.customVideos[customVideoKey]) ||
    (videoRes?.status === 'ready' && Boolean(videoRes.data?.video));
  if (hasVideo) {
    ready.push('video');
  }

  const ctrlRes = state.controllerBySkill[skillId];
  if (ctrlRes?.status === 'ready' && Boolean(ctrlRes.data?.sequences)) {
    ready.push('controller');
  }

  return ready;
}

function reconcileActiveStageTab(state: AppState): StageTabId | null {
  const readyTabs = selectReadyStageTabs(state, state.activeSkillId);
  if (readyTabs.length === 0) return null;
  if (state.preferredStageTab && readyTabs.includes(state.preferredStageTab)) {
    return state.preferredStageTab;
  }
  if (state.stageTab && readyTabs.includes(state.stageTab)) {
    return state.stageTab;
  }
  return readyTabs[0];
}

function cycleWeaponSlotInCommand(command: StageCommand, slot: AttachmentSlot): StageCommand {
  if (command.mode !== 'weapon') return command;
  const catalog = ATTACHMENT_CATALOG[slot];
  if (!catalog || catalog.length === 0) return command;
  const current = command.payload.attachments[slot];
  const currentIdx = catalog.findIndex((item) => item.id === current?.id);
  const nextAttachment = catalog[(currentIdx + 1) % catalog.length];
  const nextAttachments = {
    ...command.payload.attachments,
    [slot]: nextAttachment,
  };
  return {
    ...command,
    subtitle: `${nextAttachment.name} · ${nextAttachment.calloutNote}`,
    payload: {
      ...command.payload,
      highlightedSlot: slot,
      attachments: nextAttachments,
      stats: calculateWeaponStats(command.payload.chassis, nextAttachments),
    },
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'RESET_API_RESOURCES':
      return {
        ...state,
        gamesResource: createLoadingResource<GameDefinition[]>(),
        categories: [],
        skillsResource: createLoadingResource<SkillSummary[]>(),
        stageBySkill: {},
        videoBySkill: {},
        controllerBySkill: {},
        coachingBySkill: {},
        hologramReady: false,
        mediaAnalyzing: false,
        scannedSkills: [],
        selectedNodeId: null,
        activeSkillId: null,
        activeGameId: null,
        stageTab: null,
        stageCommandOverrides: {},
      };

    case 'GAMES_LOADING':
      return {
        ...state,
        gamesResource: createLoadingResource<GameDefinition[]>(),
      };

    case 'GAMES_LOADED': {
      if (action.games.length === 0) {
        return {
          ...state,
          gamesResource: createEmptyResource<GameDefinition[]>(),
          categories: [],
        };
      }
      const next: AppState = {
        ...state,
        gamesResource: createReadyResource(action.games),
        categories: action.categories,
      };
      return {
        ...next,
        stageTab: reconcileActiveStageTab(next),
      };
    }

    case 'GAMES_EMPTY':
      return {
        ...state,
        gamesResource: createEmptyResource<GameDefinition[]>(),
        categories: [],
      };

    case 'GAMES_ERROR':
      return {
        ...state,
        gamesResource: createErrorResource<GameDefinition[]>(action.error),
      };

    case 'SKILLS_LOADING':
      return {
        ...state,
        skillsResource: createLoadingResource<SkillSummary[]>(),
      };

    case 'SKILLS_LOADED': {
      const mergedSkills = [...action.skills];
      for (const scanned of state.scannedSkills) {
        if (!mergedSkills.some((s) => s.id === scanned.id)) {
          mergedSkills.push(scanned);
        }
      }
      if (mergedSkills.length === 0) {
        return {
          ...state,
          skillsResource: createEmptyResource<SkillSummary[]>(),
          selectedNodeId: null,
          activeSkillId: null,
          activeGameId: null,
          stageTab: null,
        };
      }
      const existingActive = state.activeSkillId
        ? mergedSkills.find((s) => s.id === state.activeSkillId) ?? null
        : null;
      const defaultSkill = existingActive ?? mergedSkills[0];
      const existingSelected = state.selectedNodeId
        ? mergedSkills.find((s) => s.id === state.selectedNodeId)?.id ?? null
        : null;

      const next: AppState = {
        ...state,
        skillsResource: createReadyResource(mergedSkills),
        selectedNodeId: existingSelected ?? defaultSkill.id,
        activeSkillId: defaultSkill.id,
        activeGameId: defaultSkill.gameId,
      };
      return {
        ...next,
        stageTab: reconcileActiveStageTab(next),
      };
    }

    case 'SKILLS_EMPTY':
      if (state.scannedSkills.length > 0) {
        return {
          ...state,
          skillsResource: createReadyResource(state.scannedSkills),
        };
      }
      if (
        state.skillsResource.status === 'empty' &&
        state.selectedNodeId === null &&
        state.activeSkillId === null
      ) {
        return state;
      }
      return {
        ...state,
        skillsResource: createEmptyResource<SkillSummary[]>(),
        selectedNodeId: null,
        activeSkillId: null,
        activeGameId: null,
        stageTab: null,
      };

    case 'SKILLS_ERROR':
      return {
        ...state,
        skillsResource: createErrorResource<SkillSummary[]>(action.error),
      };

    case 'SKILL_STAGE_LOADING':
      return {
        ...state,
        stageBySkill: {
          ...state.stageBySkill,
          [action.skillId]: createLoadingResource<SkillStagePayload>(),
        },
      };

    case 'SKILL_STAGE_LOADED': {
      const resource =
        action.payload && action.payload.stageCommand
          ? createReadyResource(action.payload)
          : createEmptyResource<SkillStagePayload>();
      const next: AppState = {
        ...state,
        stageBySkill: {
          ...state.stageBySkill,
          [action.skillId]: resource,
        },
      };
      return {
        ...next,
        stageTab: reconcileActiveStageTab(next),
      };
    }

    case 'SKILL_STAGE_ERROR':
      return {
        ...state,
        stageBySkill: {
          ...state.stageBySkill,
          [action.skillId]: createErrorResource<SkillStagePayload>(action.error),
        },
      };

    case 'SKILL_VIDEO_LOADING':
      return {
        ...state,
        videoBySkill: {
          ...state.videoBySkill,
          [action.skillId]: createLoadingResource<SkillVideoPayload>(),
        },
      };

    case 'SKILL_VIDEO_LOADED': {
      const resource =
        action.payload && action.payload.video
          ? createReadyResource(action.payload)
          : createEmptyResource<SkillVideoPayload>();
      const next: AppState = {
        ...state,
        videoBySkill: {
          ...state.videoBySkill,
          [action.skillId]: resource,
        },
      };
      return {
        ...next,
        stageTab: reconcileActiveStageTab(next),
      };
    }

    case 'SKILL_VIDEO_ERROR':
      return {
        ...state,
        videoBySkill: {
          ...state.videoBySkill,
          [action.skillId]: createErrorResource<SkillVideoPayload>(action.error),
        },
      };

    case 'SKILL_CONTROLLER_LOADING':
      return {
        ...state,
        controllerBySkill: {
          ...state.controllerBySkill,
          [action.skillId]: createLoadingResource<SkillControllerPayload>(),
        },
      };

    case 'SKILL_CONTROLLER_LOADED': {
      const resource =
        action.payload && action.payload.sequences
          ? createReadyResource(action.payload)
          : createEmptyResource<SkillControllerPayload>();
      const next: AppState = {
        ...state,
        controllerBySkill: {
          ...state.controllerBySkill,
          [action.skillId]: resource,
        },
      };
      return {
        ...next,
        stageTab: reconcileActiveStageTab(next),
      };
    }

    case 'SKILL_CONTROLLER_ERROR':
      return {
        ...state,
        controllerBySkill: {
          ...state.controllerBySkill,
          [action.skillId]: createErrorResource<SkillControllerPayload>(action.error),
        },
      };

    case 'SKILL_COACHING_LOADING':
      return {
        ...state,
        coachingBySkill: {
          ...state.coachingBySkill,
          [action.skillId]: createLoadingResource<SkillCoachingPayload>(),
        },
      };

    case 'SKILL_COACHING_LOADED': {
      const hasContent =
        action.payload &&
        (action.payload.coachingSteps.length > 0 ||
          action.payload.quickPrompts.length > 0 ||
          (action.payload.symbolSequence?.length ?? 0) > 0 ||
          Boolean(action.payload.voiceExplanation) ||
          Boolean(
            typeof action.payload.summary === 'string'
              ? action.payload.summary.trim()
              : Object.keys(action.payload.summary ?? {}).length > 0,
          ));
      const resource = hasContent && action.payload
        ? createReadyResource(action.payload)
        : createEmptyResource<SkillCoachingPayload>();
      return {
        ...state,
        coachingBySkill: {
          ...state.coachingBySkill,
          [action.skillId]: resource,
        },
      };
    }

    case 'SKILL_COACHING_ERROR':
      return {
        ...state,
        coachingBySkill: {
          ...state.coachingBySkill,
          [action.skillId]: createErrorResource<SkillCoachingPayload>(action.error),
        },
      };

    case 'SET_HOLOGRAM_READY':
      if (state.hologramReady === action.ready) return state;
      return { ...state, hologramReady: action.ready };

    case 'SET_LANGUAGE':
      return { ...state, language: action.language };

    case 'SELECT_GAME': {
      const nextGameId = action.gameId;
      const gameObj = nextGameId === 'all' ? null : selectGameById(state, nextGameId);
      const nextCategory = nextGameId === 'all' ? 'all' : (gameObj?.category ?? state.selectedCategory);
      const skills = selectAllSkills(state);
      const matchingNodes = skills.filter(
        (node) => nextGameId === 'all' || node.gameId === nextGameId,
      );
      const firstMatch = matchingNodes[0] ?? null;
      const keepSelected =
        state.selectedNodeId && matchingNodes.some((n) => n.id === state.selectedNodeId);

      const nextActiveSkill =
        nextGameId === 'all'
          ? selectActiveSkill(state) ?? firstMatch
          : matchingNodes.find((n) => n.id === state.activeSkillId) ?? firstMatch;

      const next: AppState = {
        ...state,
        selectedGameId: nextGameId,
        selectedCategory: nextCategory,
        selectedNodeId: keepSelected ? state.selectedNodeId : (firstMatch?.id ?? null),
        activeSkillId: nextActiveSkill?.id ?? null,
        activeGameId: nextActiveSkill?.gameId ?? null,
      };
      return {
        ...next,
        stageTab: reconcileActiveStageTab(next),
      };
    }

    case 'SELECT_CATEGORY': {
      const nextCategory = action.category;
      const selectedGame =
        state.selectedGameId === 'all' ? null : selectGameById(state, state.selectedGameId);
      const shouldResetGame =
        nextCategory !== 'all' &&
        selectedGame !== null &&
        selectedGame.category !== nextCategory;
      const nextGameId = shouldResetGame ? 'all' : state.selectedGameId;
      const nextState: AppState = {
        ...state,
        selectedCategory: nextCategory,
        selectedGameId: nextGameId,
      };
      const visible = selectVisibleNodes(nextState);
      const keepSelected =
        nextState.selectedNodeId && visible.some((n) => n.id === nextState.selectedNodeId);
      return {
        ...nextState,
        selectedNodeId: keepSelected ? nextState.selectedNodeId : (visible[0]?.id ?? null),
      };
    }

    case 'SET_SEARCH': {
      const nextState: AppState = { ...state, searchQuery: action.query };
      const visible = selectVisibleNodes(nextState);
      const keepSelected =
        nextState.selectedNodeId && visible.some((n) => n.id === nextState.selectedNodeId);
      return {
        ...nextState,
        selectedNodeId: keepSelected ? nextState.selectedNodeId : (visible[0]?.id ?? null),
      };
    }

    case 'RESET_FILTERS': {
      const firstSkill = selectAllSkills(state)[0] ?? null;
      return {
        ...state,
        selectedGameId: 'all',
        selectedCategory: 'all',
        searchQuery: '',
        selectedNodeId: firstSkill?.id ?? null,
      };
    }

    case 'SELECT_BOARD_NODE': {
      if (!action.nodeId) {
        return { ...state, selectedNodeId: null };
      }
      const node = selectAllSkills(state).find((s) => s.id === action.nodeId);
      if (!node) return state;
      const next: AppState = {
        ...state,
        selectedNodeId: node.id,
        activeSkillId: node.id,
        activeGameId: node.gameId,
      };
      return {
        ...next,
        stageTab: reconcileActiveStageTab(next),
      };
    }

    case 'ENTER_COACHING_ROOM': {
      const skills = selectAllSkills(state);
      const targetId = action.skillId ?? state.selectedNodeId ?? state.activeSkillId;
      const skill = targetId ? skills.find((s) => s.id === targetId) ?? null : null;
      if (!skill) {
        return state;
      }
      const next: AppState = {
        ...state,
        screen: 'coaching',
        activeSkillId: skill.id,
        activeGameId: skill.gameId,
        selectedNodeId: skill.id,
        preferredStageTab: action.stageTab ?? state.preferredStageTab,
      };
      return {
        ...next,
        stageTab: reconcileActiveStageTab(next),
      };
    }

    case 'EXIT_COACHING_ROOM':
      return {
        ...state,
        screen: 'discovery',
      };

    case 'SET_STAGE_TAB':
      return {
        ...state,
        stageTab: action.tab,
        preferredStageTab: action.tab,
      };

    case 'SET_CONTROLLER_DEVICE':
      return {
        ...state,
        controllerDevice: action.device,
      };

    case 'SET_CONTROLLER_MODE':
      return {
        ...state,
        controllerMode: action.mode,
      };

    case 'TOGGLE_AVA': {
      const nextOpen = action.open ?? !state.avaOpen;
      return {
        ...state,
        avaOpen: nextOpen,
        avaStatus: nextOpen ? state.avaStatus : 'idle',
      };
    }

    case 'SET_AVA_STATUS':
      if (state.avaStatus === action.status) return state;
      return {
        ...state,
        avaStatus: action.status,
      };

    case 'TOGGLE_UPLOAD_MODAL':
      return {
        ...state,
        uploadModalOpen: action.open ?? !state.uploadModalOpen,
      };

    case 'BEGIN_MEDIA_ANALYSIS':
      // Immediately clear active game/skill & dependent UI surfaces so zero stale data leaks
      return {
        ...state,
        mediaAnalyzing: true,
        activeSkillId: null,
        activeGameId: null,
        stageTab: null,
        preferredStageTab: null,
        hologramReady: false,
        avaOpen: false,
      };

    case 'MEDIA_ANALYSIS_FAILED':
      return {
        ...state,
        mediaAnalyzing: false,
      };

    case 'MEDIA_ANALYSIS_RESOLVED': {
      const { result } = action;
      const existingGames = selectGames(state);
      const nextGames = existingGames.some((g) => g.id === result.game.id)
        ? existingGames.map((g) => (g.id === result.game.id ? result.game : g))
        : [...existingGames, result.game];

      const existingSkills = selectAllSkills(state);
      const nextSkills = existingSkills.some((s) => s.id === result.skill.id)
        ? existingSkills.map((s) => (s.id === result.skill.id ? result.skill : s))
        : [...existingSkills, result.skill];

      // Clear any stale per-topic cached payloads for this topicId so fresh endpoints load cleanly
      const nextStageBySkill = { ...state.stageBySkill };
      const nextVideoBySkill = { ...state.videoBySkill };
      const nextControllerBySkill = { ...state.controllerBySkill };
      const nextCoachingBySkill = { ...state.coachingBySkill };
      const nextStageOverrides = { ...state.stageCommandOverrides };
      delete nextStageBySkill[result.topicId];
      delete nextVideoBySkill[result.topicId];
      delete nextControllerBySkill[result.topicId];
      delete nextCoachingBySkill[result.topicId];
      delete nextStageOverrides[result.topicId];

      if (result.coaching) {
        const c = result.coaching;
        const hasCoaching =
          c.coachingSteps.length > 0 ||
          c.quickPrompts.length > 0 ||
          (c.symbolSequence?.length ?? 0) > 0 ||
          Boolean(c.voiceExplanation) ||
          Boolean(
            typeof c.summary === 'string'
              ? c.summary.trim()
              : Object.keys(c.summary ?? {}).length > 0,
          );
        if (hasCoaching) {
          nextCoachingBySkill[result.topicId] = createReadyResource(c);
        }
      }

      if (result.stageCommand) {
        nextStageBySkill[result.topicId] = createReadyResource<SkillStagePayload>({
          gameId: result.gameId,
          skillId: result.topicId,
          stageCommand: result.stageCommand,
        });
      }

      const nextScannedSkills = state.scannedSkills.some((s) => s.id === result.skill.id)
        ? state.scannedSkills.map((s) => (s.id === result.skill.id ? result.skill : s))
        : [...state.scannedSkills, result.skill];

      const nextState: AppState = {
        ...state,
        mediaAnalyzing: false,
        uploadModalOpen: false,
        screen: 'coaching',
        gamesResource: createReadyResource(nextGames),
        skillsResource: createReadyResource(nextSkills),
        scannedSkills: nextScannedSkills,
        selectedGameId: result.gameId,
        activeGameId: result.gameId,
        activeSkillId: result.topicId,
        selectedNodeId: result.topicId,
        controllerDevice: result.detectedPlatform ?? state.controllerDevice,
        stageBySkill: nextStageBySkill,
        videoBySkill: nextVideoBySkill,
        controllerBySkill: nextControllerBySkill,
        coachingBySkill: nextCoachingBySkill,
        stageCommandOverrides: nextStageOverrides,
        stageTab: null,
        preferredStageTab: null,
        hologramReady: false,
      };

      return {
        ...nextState,
        stageTab: reconcileActiveStageTab(nextState),
      };
    }

    case 'ATTACH_VIDEO_SOURCE': {
      const key = `${action.gameId}::${action.skillId}`;
      const skill = selectAllSkills(state).find((s) => s.id === action.skillId);
      const next: AppState = {
        ...state,
        customVideos: {
          ...state.customVideos,
          [key]: action.source,
        },
        uploadModalOpen: false,
        screen: 'coaching',
        activeSkillId: skill?.id ?? action.skillId,
        activeGameId: skill?.gameId ?? action.gameId,
        preferredStageTab: 'video',
        stageTab: 'video',
      };
      return next;
    }

    case 'CYCLE_WEAPON_ATTACHMENT': {
      const stageRes = state.stageBySkill[action.skillId];
      const baseFromApi =
        stageRes?.status === 'ready' ? (stageRes.data?.stageCommand ?? null) : null;
      const baseCommand = state.stageCommandOverrides[action.skillId] ?? baseFromApi;
      if (!baseCommand || baseCommand.mode !== 'weapon') return state;
      return {
        ...state,
        stageCommandOverrides: {
          ...state.stageCommandOverrides,
          [action.skillId]: cycleWeaponSlotInCommand(baseCommand, action.slot),
        },
      };
    }

    case 'APPEND_COACH_MESSAGE':
      return {
        ...state,
        coachMessages: [...state.coachMessages, action.message],
      };

    default:
      return state;
  }
}

const PERSIAN_ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const RAW_REPO_SLUG_REGEX =
  /Aipetros--porojectot|Ai-petros-game-analyz|Petros-gamepad|Aipetros-live-avatar-hologram/i;

/**
 * Pure text-purity validator ensuring EN copy never contains Persian/Arabic characters
 * or leaked repository slugs.
 */
export function hasEnglishPurityViolation(text: string): string | null {
  if (PERSIAN_ARABIC_REGEX.test(text)) {
    return `Persian/Arabic script detected in EN string: "${text}"`;
  }
  if (RAW_REPO_SLUG_REGEX.test(text)) {
    return `Raw repository slug detected in UI string: "${text}"`;
  }
  return null;
}
