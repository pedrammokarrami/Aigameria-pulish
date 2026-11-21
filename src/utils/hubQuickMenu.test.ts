import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAudioSpotifyMenuItems,
  getCinemaNetflixMenuItems,
  getGamePs5MenuItems,
  isHubMenuSoundMuted,
  playNetflixMenuSound,
  playPs5UiSound,
  playSpotifyTapSound,
  setHubMenuSoundMuted,
  stepMenuFocusIndex,
} from './hubQuickMenu';

test('stepMenuFocusIndex wraps forward and backward across menu tiles cleanly', () => {
  assert.equal(stepMenuFocusIndex(0, 4, 1), 1);
  assert.equal(stepMenuFocusIndex(3, 4, 1), 0);
  assert.equal(stepMenuFocusIndex(0, 4, -1), 3);
  assert.equal(stepMenuFocusIndex(2, 4, -1), 1);
  assert.equal(stepMenuFocusIndex(0, 0, 1), 0);
});

test('getGamePs5MenuItems returns 4 core PS5 cards and optional backdrop mode toggle', () => {
  const withoutVideo = getGamePs5MenuItems({ hasVideoBackdrop: false, useVideoBackdrop: false });
  assert.equal(withoutVideo.length, 4);
  assert.deepEqual(
    withoutVideo.map((item) => item.id),
    ['demo', 'tournament', 'social', 'identity']
  );

  const withVideo = getGamePs5MenuItems({ hasVideoBackdrop: true, useVideoBackdrop: true });
  assert.equal(withVideo.length, 5);
  assert.equal(withVideo[4].id, 'backdrop');
  assert.equal(withVideo[4].titleFa, 'حالت صحنه UE 5.8');
});

test('getAudioSpotifyMenuItems and getCinemaNetflixMenuItems expose complete working entries', () => {
  const spotify = getAudioSpotifyMenuItems();
  assert.equal(spotify.length, 4);
  assert.ok(spotify.some((i) => i.id === 'rooms-hub' && i.accentHex === '#1DB954'));
  assert.ok(spotify.some((i) => i.id === 'social'));

  const netflixDimOff = getCinemaNetflixMenuItems(false);
  assert.equal(netflixDimOff.length, 5);
  assert.equal(netflixDimOff[0].accentHex, '#E50914');
  assert.ok(netflixDimOff.some((i) => i.id === 'dim' && i.titleFa.includes('Cinema Mode')));

  const netflixDimOn = getCinemaNetflixMenuItems(true);
  assert.ok(netflixDimOn.some((i) => i.id === 'dim' && i.titleFa.includes('نور عادی')));
});

test('Web Audio sound helpers and mute toggle fail-safe safely without browser window', () => {
  assert.equal(isHubMenuSoundMuted(), false);
  setHubMenuSoundMuted(true);
  assert.equal(isHubMenuSoundMuted(), true);
  setHubMenuSoundMuted(false);

  assert.doesNotThrow(() => {
    playPs5UiSound('open');
    playPs5UiSound('tick');
    playPs5UiSound('confirm');
    playPs5UiSound('close');
    playSpotifyTapSound('open');
    playSpotifyTapSound('tap');
    playNetflixMenuSound('open');
    playNetflixMenuSound('hover');
    playNetflixMenuSound('select');
  });
});
