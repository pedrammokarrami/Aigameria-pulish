import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_COPY } from '../data/i18n';
import type {
  CategoryDefinition,
  GameDefinition,
  SkillControllerPayload,
  SkillStagePayload,
  SkillSummary,
  SkillVideoPayload,
} from '../types/api';
import {
  appReducer,
  createInitialAppState,
  hasEnglishPurityViolation,
  selectActiveSkill,
  selectActiveStageCommand,
  selectGames,
  selectReadyStageTabs,
  selectVisibleNodes,
} from './appMachine';
import {
  VIDEO_CACHE_TTL_SECONDS,
  VideoTtlCache,
  formatTtlCountdown,
  getRemainingTtlSeconds,
} from '../modules/media/videoCache';

// Minimal synthetic fixtures scoped exclusively to unit testing state transitions
const TEST_CATEGORIES: CategoryDefinition[] = [
  { id: 'football', label: { en: 'Football' } },
  { id: 'tactical-fps', label: { en: 'Tactical FPS' } },
];

const TEST_GAMES: GameDefinition[] = [
  {
    id: 'sport-alpha',
    name: { en: 'Sport Alpha' },
    shortName: 'SA',
    category: 'football',
    accentHex: '#34D399',
    ambientRgb: { r: 52, g: 211, b: 153 },
    tagline: { en: 'Pitch control' },
    allowedStageModes: ['football'],
  },
  {
    id: 'fps-beta',
    name: { en: 'FPS Beta' },
    shortName: 'FB',
    category: 'tactical-fps',
    accentHex: '#38BDF8',
    ambientRgb: { r: 56, g: 189, b: 248 },
    tagline: { en: 'Tactical map & loadout' },
    allowedStageModes: ['map', 'weapon'],
  },
];

const TEST_SKILLS: SkillSummary[] = [
  {
    id: 'skill-sport-1',
    gameId: 'sport-alpha',
    category: 'football',
    code: 'SP-01',
    title: { en: 'High Press Trigger' },
    subtitle: { en: 'Compact press structure' },
    difficulty: { en: 'Pro' },
    durationSec: 45,
    boardPos: { x: 25, y: 40 },
    connectedTo: [],
    summary: { en: 'Force play wide before closing passing lanes.' },
  },
  {
    id: 'skill-fps-map',
    gameId: 'fps-beta',
    category: 'tactical-fps',
    code: 'FP-01',
    title: { en: 'Site Execute Timing' },
    subtitle: { en: 'Utility synchronization' },
    difficulty: { en: 'Advanced' },
    durationSec: 60,
    boardPos: { x: 65, y: 55 },
    connectedTo: ['skill-fps-weapon'],
    summary: { en: 'Layer smoke and flash timings cleanly.' },
  },
  {
    id: 'skill-fps-weapon',
    gameId: 'fps-beta',
    category: 'tactical-fps',
    code: 'FP-02',
    title: { en: 'Recoil Control Setup' },
    subtitle: { en: 'Attachment tuning' },
    difficulty: { en: 'Core' },
    durationSec: 40,
    boardPos: { x: 75, y: 30 },
    connectedTo: [],
    summary: { en: 'Balance recoil control and ADS speed.' },
  },
];

const TEST_FOOTBALL_STAGE: SkillStagePayload = {
  gameId: 'sport-alpha',
  skillId: 'skill-sport-1',
  stageCommand: {
    mode: 'football',
    title: 'High Press',
    subtitle: 'Zone trap',
    payload: {
      formation: '4-3-3',
      tacticalStyle: 'Press',
      teamColor: '#34D399',
      awayColor: '#F43F5E',
      players: [],
      vectors: [],
      zones: [],
    },
  },
};

const TEST_MAP_STAGE: SkillStagePayload = {
  gameId: 'fps-beta',
  skillId: 'skill-fps-map',
  stageCommand: {
    mode: 'map',
    title: 'Site Execute',
    subtitle: 'Smoke wall',
    payload: {
      mapId: 'mirage',
      sectorName: 'Sector A',
      operationPhase: 'Execute',
      pois: [],
      zones: [],
      markers: [],
      routes: [],
    },
  },
};

const TEST_WEAPON_STAGE: SkillStagePayload = {
  gameId: 'fps-beta',
  skillId: 'skill-fps-weapon',
  stageCommand: {
    mode: 'weapon',
    title: 'Rifle Loadout',
    subtitle: 'Balanced build',
    payload: {
      chassis: 'm4a1',
      weaponName: 'Test Rifle',
      caliber: '5.56mm',
      blueprintAccent: '#38BDF8',
      stats: {
        damage: 70,
        accuracy: 72,
        fireRate: 74,
        mobility: 68,
        control: 71,
      },
      attachments: {
        optic: {
          id: 'holo-exps3',
          slot: 'optic',
          name: 'EXPS3 Holographic',
          variant: 'holo',
          statDelta: { accuracy: 7, mobility: -1 },
          calloutNote: '1.0x',
        },
        muzzle: {
          id: 'suppressor-mono',
          slot: 'muzzle',
          name: 'Monolithic Suppressor',
          variant: 'suppressor',
          statDelta: { damage: 4 },
          calloutNote: 'Stealth',
        },
        barrel: {
          id: 'barrel-fluted',
          slot: 'barrel',
          name: '14.5" Corvus Custom',
          variant: 'standard',
          statDelta: { accuracy: 5 },
          calloutNote: 'Range',
        },
        underbarrel: {
          id: 'grip-angled',
          slot: 'underbarrel',
          name: 'Commando Foregrip',
          variant: 'angled',
          statDelta: { control: 6 },
          calloutNote: 'Stable',
        },
        magazine: {
          id: 'mag-40rd',
          slot: 'magazine',
          name: '60-Rd Polymer Mag',
          variant: 'extended',
          statDelta: { fireRate: 2 },
          calloutNote: 'Extended',
        },
        stock: {
          id: 'stock-crane',
          slot: 'stock',
          name: 'Tactical Crane Stock',
          variant: 'crane',
          statDelta: { control: 6 },
          calloutNote: 'Ergonomic',
        },
      },
    },
  },
};

const TEST_CONTROLLER_PAYLOAD: SkillControllerPayload = {
  gameId: 'sport-alpha',
  skillId: 'skill-sport-1',
  sequences: {
    ps5: {
      title: 'Press Trigger',
      duration_ms: 1200,
      events: [],
    },
    xbox: {
      title: 'Press Trigger',
      duration_ms: 1200,
      events: [],
    },
    pc: {
      title: 'Press Trigger',
      duration_ms: 1200,
      events: [],
    },
    ipad: {
      title: 'Press Trigger',
      duration_ms: 1200,
      events: [],
    },
  },
};

const TEST_VIDEO_PAYLOAD: SkillVideoPayload = {
  gameId: 'sport-alpha',
  skillId: 'skill-sport-1',
  ttlSeconds: 28800,
  video: {
    durationSec: 45,
    source: {
      id: 'vid-sport-1',
      kind: 'native',
      title: 'High Press Breakdown',
      src: 'https://example.com/high-press.mp4',
    },
    chapters: [
      {
        timeSec: 0,
        label: { en: 'Trigger' },
        overlayNote: { en: 'Close angle on touch' },
      },
    ],
  },
};

test('zero hardcoded frontend data on boot: initial state is strictly empty until API resolves', () => {
  const initial = createInitialAppState();
  assert.equal(initial.gamesResource.status, 'idle');
  assert.equal(initial.skillsResource.status, 'idle');
  assert.equal(selectGames(initial).length, 0);
  assert.equal(selectVisibleNodes(initial).length, 0);
  assert.equal(selectActiveSkill(initial), null);
  assert.equal(selectActiveStageCommand(initial), null);
  assert.deepEqual(selectReadyStageTabs(initial, null), []);
  assert.equal(initial.stageTab, null);
});

test('independent per-resource hidden-until-ready arrival: fast controller .GLB reveals before slow video', () => {
  let state = createInitialAppState();
  state = appReducer(state, {
    type: 'GAMES_LOADED',
    games: TEST_GAMES,
    categories: TEST_CATEGORIES,
  });
  state = appReducer(state, { type: 'SKILLS_LOADED', skills: TEST_SKILLS });
  state = appReducer(state, {
    type: 'ENTER_COACHING_ROOM',
    skillId: 'skill-sport-1',
  });

  // Immediately after entering coaching room, zero stage tabs are ready
  assert.deepEqual(selectReadyStageTabs(state, 'skill-sport-1'), []);
  assert.equal(state.stageTab, null);

  // Fast Controller API arrives first -> controller tab becomes ready & auto-selected
  state = appReducer(state, {
    type: 'SKILL_CONTROLLER_LOADED',
    skillId: 'skill-sport-1',
    payload: TEST_CONTROLLER_PAYLOAD,
  });
  assert.deepEqual(selectReadyStageTabs(state, 'skill-sport-1'), ['controller']);
  assert.equal(state.stageTab, 'controller');

  // Tactical stage arrives next -> tactical tab emerges without jarring switch
  state = appReducer(state, {
    type: 'SKILL_STAGE_LOADED',
    skillId: 'skill-sport-1',
    payload: TEST_FOOTBALL_STAGE,
  });
  assert.deepEqual(selectReadyStageTabs(state, 'skill-sport-1'), ['tactical', 'controller']);
  assert.equal(state.stageTab, 'controller');

  // Slow Video arrives last -> video tab emerges independently
  state = appReducer(state, {
    type: 'SKILL_VIDEO_LOADED',
    skillId: 'skill-sport-1',
    payload: TEST_VIDEO_PAYLOAD,
  });
  assert.deepEqual(selectReadyStageTabs(state, 'skill-sport-1'), [
    'tactical',
    'video',
    'controller',
  ]);
});

test('missing media API returns null video and keeps video tab cleanly hidden', () => {
  let state = createInitialAppState();
  state = appReducer(state, {
    type: 'GAMES_LOADED',
    games: TEST_GAMES,
    categories: TEST_CATEGORIES,
  });
  state = appReducer(state, { type: 'SKILLS_LOADED', skills: TEST_SKILLS });
  state = appReducer(state, { type: 'ENTER_COACHING_ROOM', skillId: 'skill-fps-map' });
  state = appReducer(state, {
    type: 'SKILL_STAGE_LOADED',
    skillId: 'skill-fps-map',
    payload: TEST_MAP_STAGE,
  });
  state = appReducer(state, {
    type: 'SKILL_VIDEO_LOADED',
    skillId: 'skill-fps-map',
    payload: null,
  });

  assert.equal(state.videoBySkill['skill-fps-map']?.status, 'empty');
  assert.deepEqual(selectReadyStageTabs(state, 'skill-fps-map'), ['tactical']);
});

test('strict gameId isolation driven by API game.allowedStageModes', () => {
  let state = createInitialAppState();
  state = appReducer(state, {
    type: 'GAMES_LOADED',
    games: TEST_GAMES,
    categories: TEST_CATEGORIES,
  });
  state = appReducer(state, { type: 'SKILLS_LOADED', skills: TEST_SKILLS });
  state = appReducer(state, { type: 'ENTER_COACHING_ROOM', skillId: 'skill-fps-map' });

  // Injecting a mismatched football command under an FPS skill MUST be blocked
  state = appReducer(state, {
    type: 'SKILL_STAGE_LOADED',
    skillId: 'skill-fps-map',
    payload: {
      gameId: 'fps-beta',
      skillId: 'skill-fps-map',
      stageCommand: TEST_FOOTBALL_STAGE.stageCommand,
    },
  });
  assert.equal(selectActiveStageCommand(state), null);
  assert.deepEqual(selectReadyStageTabs(state, 'skill-fps-map'), []);

  // Valid FPS map stage resolves cleanly
  state = appReducer(state, {
    type: 'SKILL_STAGE_LOADED',
    skillId: 'skill-fps-map',
    payload: TEST_MAP_STAGE,
  });
  assert.equal(selectActiveStageCommand(state)?.mode, 'map');
});

test('interactive weapon attachment cycling works on API-loaded weapon stage', () => {
  let state = createInitialAppState();
  state = appReducer(state, {
    type: 'GAMES_LOADED',
    games: TEST_GAMES,
    categories: TEST_CATEGORIES,
  });
  state = appReducer(state, { type: 'SKILLS_LOADED', skills: TEST_SKILLS });
  state = appReducer(state, { type: 'ENTER_COACHING_ROOM', skillId: 'skill-fps-weapon' });
  state = appReducer(state, {
    type: 'SKILL_STAGE_LOADED',
    skillId: 'skill-fps-weapon',
    payload: TEST_WEAPON_STAGE,
  });

  const before = selectActiveStageCommand(state);
  assert.equal(before?.mode, 'weapon');
  state = appReducer(state, {
    type: 'CYCLE_WEAPON_ATTACHMENT',
    skillId: 'skill-fps-weapon',
    slot: 'optic',
  });
  const after = selectActiveStageCommand(state);
  assert.equal(after?.mode, 'weapon');
  if (before?.mode === 'weapon' && after?.mode === 'weapon') {
    assert.notEqual(before.payload.attachments.optic.id, after.payload.attachments.optic.id);
  }
});

test('EN mode UI copy purity: zero Persian/Arabic characters or raw repository slugs', () => {
  const collectStrings = (value: unknown, out: string[] = []): string[] => {
    if (typeof value === 'string') {
      out.push(value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => collectStrings(item, out));
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach((v) => collectStrings(v, out));
    }
    return out;
  };

  for (const text of collectStrings(UI_COPY.en)) {
    assert.equal(hasEnglishPurityViolation(text), null);
  }
});

test('world language switching updates language code cleanly for any ISO 639-1 code', () => {
  let state = createInitialAppState();
  assert.equal(state.language, 'en');
  state = appReducer(state, { type: 'SET_LANGUAGE', language: 'fa' });
  assert.equal(state.language, 'fa');
  state = appReducer(state, { type: 'SET_LANGUAGE', language: 'ja' });
  assert.equal(state.language, 'ja');
  state = appReducer(state, { type: 'SET_LANGUAGE', language: 'ar' });
  assert.equal(state.language, 'ar');
});

test('8-hour (28800s) TTL video cache preserves valid entries and expires at boundary', () => {
  const cache = new VideoTtlCache({ ttlSeconds: VIDEO_CACHE_TTL_SECONDS, persistToStorage: false });
  const t0 = 1_700_000_000_000;
  const entry = cache.set(
    'fps-beta',
    'skill-fps-map',
    {
      id: 'vid-1',
      kind: 'native',
      title: 'Site Execute VOD',
      src: 'https://example.com/site-execute.mp4',
    },
    t0,
  );

  assert.equal(entry.ttlSeconds, 28800);
  assert.equal(getRemainingTtlSeconds(entry, t0), 28800);
  assert.equal(formatTtlCountdown(28800), '8h 00m 00s');
  assert.ok(cache.get('fps-beta', 'skill-fps-map', t0 + 28799 * 1000) !== null);
  assert.equal(cache.get('fps-beta', 'skill-fps-map', t0 + 28800 * 1000), null);
});

test('TV puzzle analysis clears previous game immediately (zero stale leak) and transitions to detected game + PS5 + symbol sequence', () => {
  let state = createInitialAppState();
  state = appReducer(state, {
    type: 'GAMES_LOADED',
    games: TEST_GAMES,
    categories: TEST_CATEGORIES,
  });
  state = appReducer(state, { type: 'SKILLS_LOADED', skills: TEST_SKILLS });
  state = appReducer(state, { type: 'ENTER_COACHING_ROOM', skillId: 'skill-sport-1' });
  state = appReducer(state, {
    type: 'SKILL_STAGE_LOADED',
    skillId: 'skill-sport-1',
    payload: TEST_FOOTBALL_STAGE,
  });
  state = appReducer(state, { type: 'SET_HOLOGRAM_READY', ready: true });
  assert.equal(state.activeGameId, 'sport-alpha');
  assert.equal(state.hologramReady, true);

  // Starting TV screen analysis MUST hide all previous game surfaces immediately
  state = appReducer(state, { type: 'BEGIN_MEDIA_ANALYSIS' });
  assert.equal(state.mediaAnalyzing, true);
  assert.equal(state.activeGameId, null);
  assert.equal(state.activeSkillId, null);
  assert.equal(state.hologramReady, false);
  assert.deepEqual(selectReadyStageTabs(state, state.activeSkillId), []);

  // /api/v1/media/analyze confirms Uncharted 4 + PS5 + puzzle steps + symbol sequence
  state = appReducer(state, {
    type: 'MEDIA_ANALYSIS_RESOLVED',
    result: {
      ok: true,
      gameId: 'uncharted-4',
      game: {
        id: 'uncharted-4',
        name: { en: 'Uncharted 4' },
        shortName: 'UC4',
        category: 'story',
        accentHex: '#818CF8',
        ambientRgb: { r: 129, g: 140, b: 248 },
        allowedStageModes: [],
        tagline: { en: 'Action-Adventure' },
      },
      topicId: 'bucket-puzzle',
      skill: {
        id: 'bucket-puzzle',
        gameId: 'uncharted-4',
        category: 'story',
        boardPos: { x: 50, y: 50 },
        connectedTo: [],
        code: 'PUZ-01',
        title: { en: 'Bell Tower Symbol Puzzle' },
        subtitle: { en: 'Chapter 11' },
        difficulty: { en: 'Story' },
        durationSec: 60,
        summary: { en: 'Rotate the four zodiac dials to match the journal sketch.' },
      },
      detectedPlatform: 'ps5',
      coaching: {
        gameId: 'uncharted-4',
        skillId: 'bucket-puzzle',
        summary: { en: 'Match the symbols from top-left to bottom-right.' },
        symbolSequence: ['Gemini', 'Leo', 'Scorpio', 'Aquarius'],
        voiceExplanation: { en: 'First rotate the top-left dial to Gemini using Triangle.' },
        coachingSteps: [
          {
            id: 'step-1',
            cueTime: '00:00',
            title: { en: 'Inspect Journal' },
            detail: { en: 'Open Nathan Drake’s journal to check the symbol grid.' },
            inputHint: 'Touchpad',
          },
        ],
        quickPrompts: [{ en: 'Which wheel turns first?' }],
      },
    },
  });

  assert.equal(state.mediaAnalyzing, false);
  assert.equal(state.screen, 'coaching');
  assert.equal(state.activeGameId, 'uncharted-4');
  assert.equal(state.activeSkillId, 'bucket-puzzle');
  assert.equal(state.controllerDevice, 'ps5');
  assert.equal(state.coachingBySkill['bucket-puzzle']?.status, 'ready');
  assert.deepEqual(state.coachingBySkill['bucket-puzzle']?.data?.symbolSequence, [
    'Gemini',
    'Leo',
    'Scorpio',
    'Aquarius',
  ]);
  // Video & controller are NOT yet populated until their independent endpoints arrive
  assert.equal(state.videoBySkill['bucket-puzzle'], undefined);
  assert.equal(state.controllerBySkill['bucket-puzzle'], undefined);

  // Background SKILLS_EMPTY must NEVER wipe an active scanned puzzle skill
  state = appReducer(state, { type: 'SKILLS_EMPTY' });
  assert.equal(selectActiveSkill(state)?.id, 'bucket-puzzle');
});

