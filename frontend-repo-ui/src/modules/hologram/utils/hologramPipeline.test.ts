import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  buildCellularPointCloud,
  normalizeAvatarPointCloud,
} from './pointCloud.ts';
import {
  advanceAssemblyProgress,
  easeInOutSine,
  easeOutCubic,
} from './hologramConfig.ts';

test('avatar.glb loads via GLTFLoader and builds normalized 2.16-unit full-body cellular point cloud with 0..1 aPhase', async () => {
  const glbPath = path.resolve('public/models/avatar.glb');
  assert.ok(fs.existsSync(glbPath), 'public/models/avatar.glb must exist');

  const buf = fs.readFileSync(glbPath);
  const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  const loader = new GLTFLoader();
  const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
    loader.parse(arrayBuf, '', resolve, reject);
  });

  const raw: number[] = [];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const m = obj as THREE.Mesh;
      const pos = m.geometry.getAttribute('position');
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        raw.push(v.x, v.y, v.z);
      }
    }
  });

  const normalized = normalizeAvatarPointCloud(new Float32Array(raw));
  assert.equal(normalized.isFullBody, true, 'Model must be classified as full-body');
  assert.ok(
    Math.abs(normalized.bounds.height - 2.16) < 0.05,
    `Expected normalized full-body height ~2.16, got ${normalized.bounds.height}`,
  );
  const centerY = (normalized.bounds.minY + normalized.bounds.maxY) * 0.5;
  assert.ok(Math.abs(centerY) < 0.05, `Expected centerY ~0, got ${centerY}`);

  const cloud = buildCellularPointCloud(normalized.positions, {
    minSpacing: 0.0125,
    maxPoints: 22000,
    seed: 4042,
    isFullBody: normalized.isFullBody,
  });

  assert.ok(cloud.count > 2000 && cloud.count <= 22000, `Unexpected cloud count: ${cloud.count}`);
  assert.equal(cloud.phases.length, cloud.count, 'aPhase buffer must have 1 float per vertex');

  let minPhase = Infinity;
  let maxPhase = -Infinity;
  let maxMouth = 0;
  let maxJaw = 0;
  for (let i = 0; i < cloud.count; i++) {
    const p = cloud.phases[i];
    if (p < minPhase) minPhase = p;
    if (p > maxPhase) maxPhase = p;
    if (cloud.mouthWeights[i] > maxMouth) maxMouth = cloud.mouthWeights[i];
    if (cloud.jawWeights[i] > maxJaw) maxJaw = cloud.jawWeights[i];
  }
  assert.ok(minPhase >= 0 && maxPhase <= 1, `aPhase must be strictly in [0, 1], got [${minPhase}, ${maxPhase}]`);
  assert.ok(maxMouth > 0.1, 'Facial mouth lip-sync weights must be active');
  assert.ok(maxJaw > 0.1, 'Facial jaw lip-sync weights must be active');
});

test('bottom-to-top assembly ramps 0->1 over 2.6s (easeInOutSine) and collapses 1->0 over 0.78s (easeOutCubic)', () => {
  let progress = 0;
  // Simulate 26 steps of 0.1s = 2.6s open
  for (let i = 0; i < 26; i++) {
    progress = advanceAssemblyProgress(progress, true, 0.1, 2.6, 0.78);
  }
  assert.ok(Math.abs(progress - 1) < 1e-6, `Expected progress 1.0 after 2.6s, got ${progress}`);
  assert.equal(easeInOutSine(0), 0);
  assert.ok(Math.abs(easeInOutSine(0.5) - 0.5) < 1e-6);
  assert.equal(easeInOutSine(1), 1);

  // Simulate 8 steps of 0.1s = 0.8s >= 0.78s close
  for (let i = 0; i < 8; i++) {
    progress = advanceAssemblyProgress(progress, false, 0.1, 2.6, 0.78);
  }
  assert.equal(progress, 0, 'Expected full collapse to 0.0 after 0.78s');
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  assert.ok(easeOutCubic(0.5) > 0.8, 'easeOutCubic should decelerate smoothly');
});
