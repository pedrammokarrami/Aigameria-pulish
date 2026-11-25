import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAvaResponse,
  normalizeCoachTopicResponse,
  normalizeGameDetailResponse,
  normalizeGamepadResponse,
  normalizeGamesResponse,
  normalizeMediaAnalyzeResponse,
  normalizeMediaStreamResponse,
  normalizeStageResponse,
  resolveApiUrl,
} from './aigameriaApi';
import {
  deriveAvaStyleVisualMood,
  resolveEffectiveHologramPhase,
} from '../modules/hologram/utils/avaStyleMapper';
import type { HologramVisualMood } from '../modules/hologram/types/voicePersona';

const BASE_MOOD: HologramVisualMood = {
  deepColor: [0.06, 0.72, 0.99],
  midColor: [0.46, 0.95, 1.0],
  coreColor: [0.96, 1.0, 1.0],
  dispersion: 1.0,
  scanSpeed: 1.0,
  accentHex: '#22d3ee',
  label: 'Tactical',
};

test('resolveApiUrl builds clean FastAPI :8090 URLs with ?lang= parameter', () => {
  assert.equal(
    resolveApiUrl('/api/v1/games', 'en', 'http://localhost:8090'),
    'http://localhost:8090/api/v1/games?lang=en',
  );
  assert.equal(
    resolveApiUrl('/api/v1/media/analyze', 'fa', 'http://localhost:8090/'),
    'http://localhost:8090/api/v1/media/analyze?lang=fa',
  );
});

test('normalizeGamesResponse handles FastAPI snake_case payloads and derives categories dynamically', () => {
  const empty = normalizeGamesResponse({ games: [] });
  assert.equal(empty.games.length, 0);
  assert.equal(empty.categories.length, 0);

  const res = normalizeGamesResponse({
    games: [
      {
        id: 'fc27',
        name: { en: 'FC 27', fa: 'اف‌سی ۲۷' },
        short_name: 'FC27',
        category: 'sports',
        accent_hex: '#34D399',
        allowed_stage_modes: ['football'],
        tagline: { en: 'Pitch tactics' },
      },
    ],
  });
  assert.equal(res.games.length, 1);
  assert.equal(res.games[0].id, 'fc27');
  assert.equal(res.games[0].shortName, 'FC27');
  assert.deepEqual(res.games[0].allowedStageModes, ['football']);
  assert.equal(res.categories.length, 1);
  assert.equal(res.categories[0].id, 'sports');
});

test('normalizeGameDetailResponse parses topics/skills cleanly without hardcoded defaults', () => {
  const detail = normalizeGameDetailResponse({
    game: { id: 'cs2', name: 'CS2', short_name: 'CS2', category: 'tactical-fps' },
    topics: [
      {
        topic_id: 'mirage-a',
        title: { en: 'Mirage A Execute' },
        subtitle: { en: 'Smoke wall' },
        duration_sec: 48,
      },
    ],
  });
  assert.equal(detail.game?.id, 'cs2');
  assert.equal(detail.skills.length, 1);
  assert.equal(detail.skills[0].id, 'mirage-a');
  assert.equal(detail.skills[0].gameId, 'cs2');
  assert.equal(detail.skills[0].durationSec, 48);
});

test('normalizeMediaAnalyzeResponse extracts detected game, PS5 platform, symbol sequence, and voice explanation', () => {
  // Rejects unconfirmed / empty responses cleanly
  assert.equal(normalizeMediaAnalyzeResponse({}), null);

  const analyzed = normalizeMediaAnalyzeResponse({
    game_id: 'uncharted-4',
    game_name: 'Uncharted 4',
    platform: 'PS5',
    topic_id: 'scotland-cross-puzzle',
    puzzle_title: { en: 'Scotland Crosses Wheel Puzzle', fa: 'معمای چرخ صلیب‌های اسکاتلند' },
    summary: { en: 'Align the St. Dismas white cross at the top center.' },
    symbol_sequence: ['White Cross', 'Black Cross', 'Bucket', 'Left Ring'],
    puzzle_steps: [
      {
        title: { en: 'Rotate Outer Wheel' },
        detail: { en: 'Turn clockwise until the white cross sits at 12 o’clock.' },
        input_hint: 'L-Stick + X',
      },
    ],
    voice_explanation: 'Rotate the outer ring clockwise until the white cross aligns at top.',
  });

  assert.ok(analyzed);
  assert.equal(analyzed!.gameId, 'uncharted-4');
  assert.equal(analyzed!.detectedPlatform, 'ps5');
  assert.equal(analyzed!.topicId, 'scotland-cross-puzzle');
  assert.deepEqual(analyzed!.coaching?.symbolSequence, [
    'White Cross',
    'Black Cross',
    'Bucket',
    'Left Ring',
  ]);
  assert.equal(analyzed!.coaching?.coachingSteps.length, 1);
  assert.equal(
    analyzed!.coaching?.voiceExplanation,
    'Rotate the outer ring clockwise until the white cross aligns at top.',
  );
});

test('normalizeMediaStreamResponse preserves free-stream URLs and 8h (28800s) TTL', () => {
  const payload = normalizeMediaStreamResponse(
    {
      stream_url: 'https://cdn.example.com/clip.mp4',
      title: 'Walkthrough Stream',
      ttl_seconds: 28800,
      duration_sec: 65,
      chapters: [{ time_sec: 12, label: { en: 'Wheel' }, overlay_note: { en: 'Match top' } }],
    },
    'scotland-cross-puzzle',
    'uncharted-4',
  );
  assert.ok(payload?.video);
  assert.equal(payload!.ttlSeconds, 28800);
  assert.equal(payload!.video!.source.src, 'https://cdn.example.com/clip.mp4');
  assert.equal(payload!.video!.chapters[0].timeSec, 12);

  assert.equal(normalizeMediaStreamResponse({ ttl_seconds: 28800 }, 'p1', 'g1'), null);
});

test('normalizeStageResponse, normalizeGamepadResponse, and normalizeCoachTopicResponse return null on empty payloads', () => {
  assert.equal(normalizeStageResponse({}, 't1', 'g1'), null);
  assert.equal(normalizeGamepadResponse({}, 't1', 'g1'), null);
  assert.equal(normalizeCoachTopicResponse({}, 't1', 'g1'), null);

  const gamepad = normalizeGamepadResponse(
    {
      sequences: {
        playstation: { title: 'Combo', duration_ms: 1000, events: [] },
        ios: { title: 'Touch', duration_ms: 1000, events: [] },
      },
    },
    't1',
    'g1',
  );
  assert.ok(gamepad?.sequences?.ps5);
  assert.ok(gamepad?.sequences?.ipad);
});

test('normalizeAvaResponse parses Xbot.glb / Soldier.glb / Michelle.glb style_key and animation_state', () => {
  assert.equal(normalizeAvaResponse({ style_key: 'story' }, 'uncharted-4'), null);

  const ava = normalizeAvaResponse(
    {
      game_id: 'uncharted-4',
      glb_url: '/models/Xbot.glb',
      style_key: 'story',
      animation_state: 'speaking',
      voice_name: 'Kore',
    },
    'uncharted-4',
  );
  assert.ok(ava);
  assert.equal(ava!.glbUrl, '/models/Xbot.glb');
  assert.equal(ava!.styleKey, 'story');
  assert.equal(ava!.animationState, 'speaking');

  const storyMood = deriveAvaStyleVisualMood(BASE_MOOD, ava!.styleKey, ava!.animationState);
  assert.equal(storyMood.label, 'Story');
  assert.equal(storyMood.accentHex, '#818cf8');
  assert.equal(resolveEffectiveHologramPhase('idle', ava!.animationState), 'speaking');
  assert.equal(resolveEffectiveHologramPhase('listening', 'speaking'), 'listening');
});
