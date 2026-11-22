import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LiveGrid, GridCoord } from '../../utils/liveGridEngine';
import { projectToViewport } from '../../utils/liveGridEngine';

/**
 * GTA V 3D LIVE RADAR — real OSM buildings/roads extruded into a Three.js
 * scene with the user-specified radar aesthetics: exponential fog, angled
 * pause-menu camera, damped orbit controls, pulse ring at the player,
 * traffic vehicles flowing along real roads.
 *
 * All coordinates are meters relative to the map center (user's real GPS fix).
 */

export interface RadarBlipSpec {
  id: string;
  title: string;
  color: string;
  /** meters east/north of the center */
  offsetX: number;
  offsetZ: number;
}

interface LiveGrid3DProps {
  grid: LiveGrid | null;
  /** marker colors per blip */
  blips: RadarBlipSpec[];
  selectedBlipId: string | null;
  onPickBlip: (id: string) => void;
}

const FOG_COLOR = 0x080b10;
const METERS_PER_UNIT = 1; // 1 world unit = 1 meter

/** Convert lat/lng inside the grid to local meters relative to the center. */
function toLocalMeters(center: GridCoord, radiusM: number, lat: number, lng: number): { x: number; z: number } {
  const { xPct, yPct } = projectToViewport(center, radiusM, { lat, lng });
  const span = radiusM * 2.15;
  return { x: ((xPct - 50) / 100) * span, z: ((yPct - 50) / 100) * span };
}

const LiveGrid3D: React.FC<LiveGrid3DProps> = ({ grid, blips, selectedBlipId, onPickBlip }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pickRef = useRef(onPickBlip);
  pickRef.current = onPickBlip;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(FOG_COLOR);
    scene.fog = new THREE.FogExp2(FOG_COLOR, 0.00145);

    const camera = new THREE.PerspectiveCamera(48, container.clientWidth / Math.max(1, container.clientHeight), 1, 2500);
    camera.position.set(0, 290, 270);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      return; // no WebGL — the 2D SVG grid remains as fallback
    }
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2.25;
    controls.minDistance = 70;
    controls.maxDistance = 680;
    controls.target.set(0, 0, 0);

    // Tactical lighting
    scene.add(new THREE.AmbientLight(0x94a3b8, 0.75));
    const keyLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    keyLight.position.set(180, 350, 140);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xa855f7, 0.45);
    rimLight.position.set(-200, 200, -180);
    scene.add(rimLight);

    // Ground plane + subtle tactical cyber grid (GTA radar floor)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(2400, 2400),
      new THREE.MeshStandardMaterial({ color: 0x0b0f17, roughness: 0.92, metalness: 0.1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    scene.add(ground);
    const gridHelper = new THREE.GridHelper(1600, 64, 0x1e293b, 0x111827);
    gridHelper.position.y = -0.3;
    scene.add(gridHelper);

    const buildingsGroup = new THREE.Group();
    const roadsGroup = new THREE.Group();
    const trafficGroup = new THREE.Group();
    const blipGroup = new THREE.Group();
    scene.add(buildingsGroup, roadsGroup, trafficGroup, blipGroup);
    const traffic: Array<{ mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; t: number; speed: number }> = [];

    const gridRef = grid;
    if (gridRef) {
      // ── Real buildings: extruded footprints, GTA slate blocks ──
      const wallMat = new THREE.MeshLambertMaterial({ color: 0x1a2330 });
      const roofMat = new THREE.MeshLambertMaterial({ color: 0x223044 });
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.35 });
      gridRef.buildings.slice(0, 140).forEach((b) => {
        const pts = b.points;
        if (pts.length < 8) return;
        const shape = new THREE.Shape();
        let first = true;
        for (let i = 0; i < pts.length; i += 2) {
          const { x, z } = toLocalMeters(gridRef.center, gridRef.radiusM, pts[i], pts[i + 1]);
          if (first) {
            shape.moveTo(x, -z);
            first = false;
          } else {
            shape.lineTo(x, -z);
          }
        }
        shape.closePath();
        const height = 8 + ((Math.abs(Math.round(pts[0] * 100)) % 22));
        const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
        geo.rotateX(-Math.PI / 2);
        const mesh = new THREE.Mesh(geo, [wallMat, roofMat]);
        buildingsGroup.add(mesh);
        if (buildingsGroup.children.length < 60) {
          const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), edgeMat);
          buildingsGroup.add(edges);
        }
      });

      // ── Real roads: flat dark ribbons along OSM polylines ──
      const roadMat = new THREE.MeshLambertMaterial({ color: 0x2a3340 });
      const primaryMat = new THREE.MeshLambertMaterial({ color: 0x3a4452 });
      gridRef.roads.slice(0, 110).forEach((r) => {
        if (r.points.length < 4) return;
        const curvePts: THREE.Vector3[] = [];
        for (let i = 0; i < r.points.length; i += 2) {
          const { x, z } = toLocalMeters(gridRef.center, gridRef.radiusM, r.points[i], r.points[i + 1]);
          curvePts.push(new THREE.Vector3(x, 0.5, z));
        }
        const curve = new THREE.CatmullRomCurve3(curvePts);
        const width = r.roadClass === 'primary' || r.roadClass === 'secondary' ? 9 : 5.5;
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, width / 2, 4, false), r.roadClass === 'primary' ? primaryMat : roadMat);
        tube.scale.y = 0.16; // flatten to a ribbon
        roadsGroup.add(tube);
      });

      // ── Traffic: small cars gliding along road curves ──
      const carGeo = new THREE.BoxGeometry(4.4, 1.6, 2.2);
      const carColors = [0x22d3ee, 0xfacc15, 0xf43f5e, 0x4ade80, 0xe2e8f0];
      const roadCurves = gridRef.roads
        .filter((r) => r.points.length >= 6)
        .slice(0, 12)
        .map((r) => {
          const curvePts: THREE.Vector3[] = [];
          for (let i = 0; i < r.points.length; i += 2) {
            const { x, z } = toLocalMeters(gridRef.center, gridRef.radiusM, r.points[i], r.points[i + 1]);
            curvePts.push(new THREE.Vector3(x, 1.6, z));
          }
          return new THREE.CatmullRomCurve3(curvePts);
        });
      for (let i = 0; i < Math.min(10, roadCurves.length); i++) {
        const curve = roadCurves[i % roadCurves.length];
        const mesh = new THREE.Mesh(carGeo, new THREE.MeshBasicMaterial({ color: carColors[i % carColors.length] }));
        trafficGroup.add(mesh);
        traffic.push({ mesh, curve, t: Math.random(), speed: 0.012 + Math.random() * 0.02 });
      }
    }

    // ── Classic GTA V delta player cursor at the center (real GPS point) ──
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 11);
    arrowShape.lineTo(8, -8);
    arrowShape.lineTo(0, -4);
    arrowShape.lineTo(-8, -8);
    arrowShape.closePath();
    const arrowGeo = new THREE.ExtrudeGeometry(arrowShape, { depth: 2.5, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5 });
    arrowGeo.rotateX(-Math.PI / 2);
    const playerMesh = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    playerMesh.position.y = 2.5;
    const outlineRing = new THREE.Mesh(
      new THREE.RingGeometry(11, 13.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    outlineRing.rotation.x = -Math.PI / 2;
    outlineRing.position.y = 1.2;
    const pulseRing = new THREE.Mesh(
      new THREE.RingGeometry(12, 14, 48),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    pulseRing.rotation.x = -Math.PI / 2;
    pulseRing.position.y = 1.0;
    playerGroup.add(playerMesh, outlineRing, pulseRing);

    // ── Interactive blips: vertical beacon + floating marker ──
    const blipMeshes = new Map<string, { group: THREE.Group; beacon: THREE.Mesh }>();
    blips.forEach((b) => {
      const group = new THREE.Group();
      const color = new THREE.Color(b.color);
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, 60, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.42 })
      );
      cyl.position.y = 30;
      const head = new THREE.Mesh(new THREE.SphereGeometry(4.4, 16, 12), new THREE.MeshBasicMaterial({ color }));
      head.position.y = 62;
      group.add(cyl, head);
      group.position.set(b.offsetX, 0, b.offsetZ);
      blipGroup.add(group);
      blipMeshes.set(b.id, { group, beacon: head });
    });

    // Raycast picking for blip heads
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pickTargets: THREE.Object3D[] = [];
    blipMeshes.forEach(({ beacon }, id) => {
      beacon.userData.blipId = id;
      pickTargets.push(beacon);
    });
    const onPointerDown = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickTargets, false)[0];
      if (hit) pickRef.current(String(hit.object.userData.blipId));
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    let stopped = false;
    let raf = 0;
    const clock = new THREE.Clock();
    let lastRender = 0;
    const tick = () => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      if (document.hidden) return; // background tab: skip GPU work entirely
      const now = performance.now();
      if (now - lastRender < 33) return; // ~30fps cap
      lastRender = now;
      const dt = Math.min(0.08, clock.getDelta());
      const t = clock.getElapsedTime();
      // pulse ring breathing
      const s = 1 + (Math.sin(t * 2.2) * 0.5 + 0.5) * 0.85;
      pulseRing.scale.set(s, s, 1);
      (pulseRing.material as THREE.MeshBasicMaterial).opacity = 0.7 - ((Math.sin(t * 2.2) * 0.5 + 0.5) * 0.45);
      // traffic
      if (!reducedMotion) {
        for (const car of traffic) {
          car.t = (car.t + car.speed * dt) % 1;
          const p = car.curve.getPointAt(car.t);
          car.mesh.position.copy(p);
        }
      }
      // selected blip beacon bounces
      blipMeshes.forEach(({ beacon }, id) => {
        const sel = id === selectedBlipId;
        beacon.scale.setScalar(sel ? 1.5 + Math.sin(t * 4) * 0.25 : 1);
      });
      controls.update();
      renderer.render(scene, camera);
    };
    if (!reducedMotion) tick();
    else {
      controls.update();
      renderer.render(scene, camera);
    }

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      controls.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
    // rebuild scene when the real grid or selection changes
  }, [grid, selectedBlipId, blips]);

  return <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 2 }} data-testid="live-grid-3d" />;
};

export default LiveGrid3D;
