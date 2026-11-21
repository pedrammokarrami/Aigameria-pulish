import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIO_ROOM_ORDER,
  AUDIO_ROOM_THEMES,
  CINEMA_ROOM_ORDER,
  CINEMA_ROOM_THEMES,
  getMediaRosterCountDisplay,
} from './mediaRoomsThemes';

test('CINEMA_ROOM_THEMES covers all 5 cinema rooms with valid .mp4 loops and 4-slot rosters', () => {
  assert.equal(CINEMA_ROOM_ORDER.length, 5);
  for (const id of CINEMA_ROOM_ORDER) {
    const t = CINEMA_ROOM_THEMES[id];
    assert.ok(t, `Missing cinema room theme for ${id}`);
    assert.ok(t.videoSrc.startsWith('/assets/rooms/cinema/'), `Expected cinema video path for ${id}`);
    assert.ok(t.videoSrc.endsWith('.mp4'), `Expected .mp4 video loop for ${id}`);
    assert.equal(t.roster.slots.length, 4);
    assert.equal(t.metrics.length, 3);
    assert.ok(t.pins.length >= 2);

    const before = getMediaRosterCountDisplay(t, {});
    assert.equal(before.filled, 3);
    assert.equal(before.total, 4);

    const emptySlot = t.roster.slots.find((s) => !s.filled);
    assert.ok(emptySlot, `Expected one invite empty slot in ${id}`);
    const after = getMediaRosterCountDisplay(t, { [emptySlot.id]: true });
    assert.equal(after.filled, 4);
  }
});

test('AUDIO_ROOM_THEMES covers all 7 music/audiobook/podcast rooms with valid .mp4 loops and 4-slot rosters', () => {
  assert.equal(AUDIO_ROOM_ORDER.length, 7);
  for (const id of AUDIO_ROOM_ORDER) {
    const t = AUDIO_ROOM_THEMES[id];
    assert.ok(t, `Missing audio room theme for ${id}`);
    assert.ok(t.videoSrc.startsWith('/assets/rooms/audio/'), `Expected audio video path for ${id}`);
    assert.ok(t.videoSrc.endsWith('.mp4'), `Expected .mp4 video loop for ${id}`);
    assert.equal(t.roster.slots.length, 4);
    assert.equal(t.metrics.length, 3);
    assert.ok(t.pins.length >= 2);

    const before = getMediaRosterCountDisplay(t, {});
    assert.equal(before.filled, 3);
    assert.equal(before.total, 4);

    const emptySlot = t.roster.slots.find((s) => !s.filled);
    assert.ok(emptySlot, `Expected one invite empty slot in ${id}`);
    const after = getMediaRosterCountDisplay(t, { [emptySlot.id]: true });
    assert.equal(after.filled, 4);
  }
});
