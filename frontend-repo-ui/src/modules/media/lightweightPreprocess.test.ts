import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_IMAGE_EDGE_PX,
  MAX_VIDEO_FRAME_EDGE_PX,
  applyTvContrastPass,
  computeTargetDimensions,
  estimateDataUrlBytes,
  getCropRectForPreset,
} from './lightweightPreprocess';

test('computeTargetDimensions preserves aspect ratio and clamps longest edge', () => {
  const landscape = computeTargetDimensions(3840, 2160, MAX_IMAGE_EDGE_PX);
  assert.equal(landscape.width, 960);
  assert.equal(landscape.height, 540);

  const portrait = computeTargetDimensions(1080, 1920, MAX_VIDEO_FRAME_EDGE_PX);
  assert.equal(portrait.height, 640);
  assert.equal(portrait.width, 360);

  const alreadySmall = computeTargetDimensions(480, 320, MAX_IMAGE_EDGE_PX);
  assert.deepEqual(alreadySmall, { width: 480, height: 320 });
});

test('applyTvContrastPass enhances contrast symmetrically while preserving alpha channel', () => {
  const pixels = new Uint8ClampedArray([100, 128, 180, 255]);
  applyTvContrastPass(pixels, 1.2);
  assert.ok(pixels[0] < 100);
  assert.equal(pixels[1], 128);
  assert.ok(pixels[2] > 180);
  assert.equal(pixels[3], 255);
});

test('getCropRectForPreset isolates 16:9 TV center cleanly inside portrait phone photos', () => {
  const full = getCropRectForPreset('full', 1080, 1920);
  assert.deepEqual(full, { x: 0, y: 0, w: 1, h: 1 });

  const tv = getCropRectForPreset('tv-16-9', 1080, 1920);
  assert.ok(tv.h < 0.5 && tv.y > 0.25 && tv.w > 0.85);

  const center = getCropRectForPreset('center-focus', 1920, 1080);
  assert.deepEqual(center, { x: 0.16, y: 0.16, w: 0.68, h: 0.68 });
});

test('estimateDataUrlBytes accurately approximates base64 payload size', () => {
  const sample = 'data:image/jpeg;base64,' + 'A'.repeat(400);
  assert.equal(estimateDataUrlBytes(sample), 300);
});
