import test from 'node:test';
import assert from 'node:assert/strict';
import {
  delayWithAbort,
  getPresetTimingProfile,
  parseTimingSimulationFromSearch,
} from './timingSimulator';

test('default timing profile is live (0ms across all endpoints)', () => {
  const { profile, panelInitiallyOpen } = parseTimingSimulationFromSearch('');
  assert.equal(profile.presetId, 'live');
  assert.equal(panelInitiallyOpen, false);
  for (const ms of Object.values(profile.delaysMs)) {
    assert.equal(ms, 0);
  }
});

test('fast-glb-slow-video preset resolves .GLB & gamepad much faster than media stream', () => {
  const { profile, panelInitiallyOpen } = parseTimingSimulationFromSearch(
    '?preset=fast-glb-slow-video&timing=open',
  );
  assert.equal(profile.presetId, 'fast-glb-slow-video');
  assert.equal(panelInitiallyOpen, true);
  assert.ok(profile.delaysMs.gamepad < 500);
  assert.ok(profile.delaysMs.glbLoad < 500);
  assert.ok(profile.delaysMs.media >= 2500);
});

test('custom query overrides produce custom profile with clamped values', () => {
  const { profile } = parseTimingSimulationFromSearch('?delayVideo=3200&delayGlb=140&delayStage=900');
  assert.equal(profile.presetId, 'custom');
  assert.equal(profile.delaysMs.media, 3200);
  assert.equal(profile.delaysMs.glbLoad, 140);
  assert.equal(profile.delaysMs.stage, 900);
});

test('delayWithAbort rejects immediately when AbortSignal fires', async () => {
  const controller = new AbortController();
  const promise = delayWithAbort(500, controller.signal);
  controller.abort();
  await assert.rejects(promise, (err: unknown) => {
    return err instanceof DOMException && err.name === 'AbortError';
  });
});

test('presets are cleanly immutable copies', () => {
  const a = getPresetTimingProfile('staggered-waterfall');
  const b = getPresetTimingProfile('staggered-waterfall');
  a.delaysMs.media = 9999;
  assert.notEqual(b.delaysMs.media, 9999);
});
