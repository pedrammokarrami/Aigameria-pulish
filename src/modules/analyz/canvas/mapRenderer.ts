import { getTacticalMapAsset } from '../engine/assetResolver';
import type { MapPayload } from '../engine/types';
import { resolveLabelPositions, type LabelBoxInput } from './labelLayout';
import { drawArrowhead, lerp, roundRect, samplePolyline } from './math';

export interface MapRenderMemory {
  zones: Map<string, { x: number; y: number; radius: number }>;
  markers: Map<string, { x: number; y: number }>;
}

export function createMapMemory(): MapRenderMemory {
  return {
    zones: new Map(),
    markers: new Map(),
  };
}

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROWS = ['1', '2', '3', '4', '5', '6'];

export function renderMapStage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  payload: MapPayload,
  memory: MapRenderMemory,
  time: number,
  dt: number,
): void {
  const isCompact = width < 560;
  const padX = isCompact ? 12 : Math.max(22, width * 0.04);
  const topPad = isCompact ? 64 : Math.max(84, height * 0.125);
  const bottomPad = isCompact ? 18 : Math.max(22, height * 0.04);
  const availW = Math.max(260, width - padX * 2);
  const availH = Math.max(190, height - topPad - bottomPad);

  const aspect = isCompact ? 1.24 : 1.56;
  let mapW = availW;
  let mapH = mapW / aspect;
  if (mapH > availH) {
    mapH = availH;
    mapW = mapH * aspect;
  }

  const mx = (width - mapW) / 2;
  const my = topPad + (availH - mapH) / 2;
  const toX = (nx: number) => mx + (nx / 100) * mapW;
  const toY = (ny: number) => my + (ny / 100) * mapH;
  const toR = (nr: number) => (nr / 100) * Math.min(mapW, mapH);

  ctx.save();
  roundRect(ctx, mx, my, mapW, mapH, 14);
  ctx.fillStyle = '#0D161C';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.clip();

  // Resolve real overhead tactical map image via assetResolver
  const mapAsset = getTacticalMapAsset(
    payload.mapId ?? 'mirage',
    payload.wikiQuery,
    payload.wikiSite ?? 'counterstrike',
  );

  if (mapAsset.image && mapAsset.image.naturalWidth > 0) {
    // Cover-fit overhead tactical map
    const iw = mapAsset.image.naturalWidth;
    const ih = mapAsset.image.naturalHeight;
    const scale = Math.max(mapW / iw, mapH / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(mapAsset.image, mx + (mapW - dw) / 2, my + (mapH - dh) / 2, dw, dh);

    // Tactical dark night-ops contrast scrim so animated routes, smokes, and markers pop cleanly
    const scrimAlpha = payload.mapId === 'mirage' ? 0.5 : 0.68;
    ctx.fillStyle = `rgba(7, 13, 21, ${scrimAlpha})`;
    ctx.fillRect(mx, my, mapW, mapH);
  } else {
    const baseGrad = ctx.createRadialGradient(
      mx + mapW * 0.5,
      my + mapH * 0.45,
      mapW * 0.08,
      mx + mapW * 0.5,
      my + mapH * 0.5,
      mapW * 0.72,
    );
    baseGrad.addColorStop(0, '#142229');
    baseGrad.addColorStop(1, '#091116');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(mx, my, mapW, mapH);
  }

  // Subtle alphanumeric tactical grid overlay (A-H x 1-6)
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.09)';
  ctx.lineWidth = 1;
  const colW = mapW / COLS.length;
  const rowH = mapH / ROWS.length;
  ctx.beginPath();
  for (let c = 1; c < COLS.length; c++) {
    ctx.moveTo(mx + c * colW, my);
    ctx.lineTo(mx + c * colW, my + mapH);
  }
  for (let r = 1; r < ROWS.length; r++) {
    ctx.moveTo(mx, my + r * rowH);
    ctx.lineTo(mx + mapW, my + r * rowH);
  }
  ctx.stroke();

  ctx.font = '600 9px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let c = 0; c < COLS.length; c++) {
    ctx.fillText(COLS[c], mx + c * colW + colW / 2, my + 4);
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let r = 0; r < ROWS.length; r++) {
    ctx.fillText(ROWS[r], mx + 5, my + r * rowH + rowH / 2);
  }

  // Collect all labels for smart auto-offsetting
  const pendingLabels: Array<{
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    bg: string;
    priority: number;
  }> = [];

  // Smoothly interpolate zones (gas, safe, danger, smoke)
  const lerpFactor = Math.min(1, dt * 5.2);
  for (const zone of payload.zones) {
    const prev = memory.zones.get(zone.id);
    const zx = prev ? lerp(prev.x, zone.x, lerpFactor) : zone.x;
    const zy = prev ? lerp(prev.y, zone.y, lerpFactor) : zone.y;
    const zr = prev ? lerp(prev.radius, zone.radius, lerpFactor) : zone.radius;
    memory.zones.set(zone.id, { x: zx, y: zy, radius: zr });

    const px = toX(zx);
    const py = toY(zy);
    const pr = toR(zr);

    ctx.save();
    if (zone.type === 'gas') {
      ctx.beginPath();
      ctx.rect(mx, my, mapW, mapH);
      ctx.arc(px, py, pr, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(159, 18, 57, 0.22)';
      ctx.fill('evenodd');

      ctx.strokeStyle = 'rgba(251, 113, 133, 0.72)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.stroke();
    } else if (zone.type === 'safe') {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(224, 242, 254, 0.92)';
      ctx.lineWidth = 1.9;
      ctx.setLineDash([8, 5]);
      ctx.lineDashOffset = -(time * 14);
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (zone.label) {
        pendingLabels.push({
          id: `zone-${zone.id}`,
          x: px,
          y: py - pr - 10,
          text: zone.label,
          color: '#E0F2FE',
          bg: 'rgba(7, 12, 22, 0.85)',
          priority: 2,
        });
      }
    } else if (zone.type === 'smoke') {
      // Volumetric animated smoke grenade cloud (CS2 / Valorant executes)
      const drift = Math.sin(time * 2.1 + px * 0.02) * 2.2;
      const smokeGrad = ctx.createRadialGradient(px + drift, py, pr * 0.15, px, py, pr * 1.15);
      smokeGrad.addColorStop(0, 'rgba(226, 232, 240, 0.78)');
      smokeGrad.addColorStop(0.6, 'rgba(148, 163, 184, 0.56)');
      smokeGrad.addColorStop(1, 'rgba(148, 163, 184, 0.05)');
      ctx.fillStyle = smokeGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr * 1.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(241, 245, 249, 0.7)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (zone.label) {
        pendingLabels.push({
          id: `zone-${zone.id}`,
          x: px,
          y: py,
          text: zone.label,
          color: '#FFFFFF',
          bg: 'rgba(15, 23, 42, 0.88)',
          priority: 3,
        });
      }
    } else {
      // Danger / crossfire / artillery zone
      const pulse = 0.24 + Math.sin(time * 4.2) * 0.07;
      ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(248, 113, 113, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.stroke();

      if (zone.label) {
        pendingLabels.push({
          id: `zone-${zone.id}`,
          x: px,
          y: py - pr - 10,
          text: zone.label,
          color: '#FCA5A5',
          bg: 'rgba(15, 10, 14, 0.86)',
          priority: 2,
        });
      }
    }
    ctx.restore();
  }

  // Animated tactical flank / execute routes
  for (const route of payload.routes) {
    if (route.points.length < 2) continue;
    const pts = route.points.map(([rx, ry]): [number, number] => [toX(rx), toY(ry)]);
    const color =
      route.type === 'extract'
        ? '#34D399'
        : route.type === 'flank'
          ? '#38BDF8'
          : '#FBBF24';

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -(time * 32);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Moving pulse along route
    const progress = (time * 0.28) % 1;
    const [tx, ty] = samplePolyline(pts, progress);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(tx, ty, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(tx, ty, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Terminal arrowhead
    const last = pts[pts.length - 1];
    const prevPt = pts[pts.length - 2];
    const ang = Math.atan2(last[1] - prevPt[1], last[0] - prevPt[0]);
    drawArrowhead(ctx, last[0], last[1], ang, 9.5, color);

    if (route.label && !isCompact) {
      const [lx, ly] = samplePolyline(pts, 0.48);
      pendingLabels.push({
        id: `route-${route.id}`,
        x: lx,
        y: ly - 13,
        text: route.label,
        color,
        bg: 'rgba(7, 11, 18, 0.88)',
        priority: 2,
      });
    }
    ctx.restore();
  }

  // Tactical markers (squad, objective, extract, hostile)
  for (const marker of payload.markers) {
    const existing = memory.markers.get(marker.id);
    const curX = existing ? lerp(existing.x, marker.x, lerpFactor) : marker.x;
    const curY = existing ? lerp(existing.y, marker.y, lerpFactor) : marker.y;
    memory.markers.set(marker.id, { x: curX, y: curY });

    const px = toX(curX);
    const py = toY(curY);

    ctx.save();
    if (marker.type === 'squad') {
      const col = marker.color ?? '#38BDF8';
      const rad = ((marker.heading ?? 0) * Math.PI) / 180;

      ctx.fillStyle = `${col}2A`;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, isCompact ? 18 : 24, rad - 0.42, rad + 0.42);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rad);
      ctx.fillStyle = col;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-6, -6);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      pendingLabels.push({
        id: `mk-${marker.id}`,
        x: px,
        y: py + 15,
        text: marker.label,
        color: '#F8FAFC',
        bg: 'rgba(7, 12, 22, 0.82)',
        priority: 3,
      });
    } else if (marker.type === 'extract') {
      const pulse = (time * 0.7) % 1;
      ctx.strokeStyle = `rgba(52, 211, 153, ${1 - pulse})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(px, py, 9 + pulse * 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#065F46';
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ECFDF5';
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LZ', px, py + 0.5);

      pendingLabels.push({
        id: `mk-${marker.id}`,
        x: px,
        y: py + 18,
        text: marker.label,
        color: '#6EE7B7',
        bg: 'rgba(7, 18, 16, 0.88)',
        priority: 3,
      });
    } else if (marker.type === 'objective') {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#F59E0B';
      ctx.strokeStyle = '#FEF3C7';
      ctx.lineWidth = 1.6;
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeRect(-6, -6, 12, 12);
      ctx.restore();

      pendingLabels.push({
        id: `mk-${marker.id}`,
        x: px,
        y: py + 17,
        text: marker.label,
        color: '#FDE68A',
        bg: 'rgba(18, 14, 7, 0.88)',
        priority: 3,
      });
    } else {
      ctx.fillStyle = '#F43F5E';
      ctx.strokeStyle = '#FFE4E6';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(px, py - 8);
      ctx.lineTo(px + 7, py + 6);
      ctx.lineTo(px - 7, py + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      pendingLabels.push({
        id: `mk-${marker.id}`,
        x: px,
        y: py + 15,
        text: marker.label,
        color: '#FDA4AF',
        bg: 'rgba(20, 8, 12, 0.86)',
        priority: 2,
      });
    }
    ctx.restore();
  }

  // POI labels (added at lower priority so markers & smokes always win space)
  if (!isCompact || payload.mapId !== 'mirage') {
    for (const poi of payload.pois) {
      if (isCompact && poi.tier !== 'major') continue;
      pendingLabels.push({
        id: `poi-${poi.id}`,
        x: toX(poi.x),
        y: toY(poi.y),
        text: poi.name,
        color: 'rgba(226, 232, 240, 0.78)',
        bg: 'rgba(7, 11, 18, 0.62)',
        priority: 1,
      });
    }
  }

  // Smart auto-offset label resolution pass
  const fontSize = isCompact ? 8.5 : 9.5;
  ctx.save();
  ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
  const boxInputs: LabelBoxInput[] = pendingLabels.map((item) => ({
    id: item.id,
    x: item.x,
    y: item.y,
    width: ctx.measureText(item.text).width + 10,
    height: fontSize + 6,
    priority: item.priority,
  }));

  const resolved = resolveLabelPositions(
    boxInputs,
    { minX: mx + 14, minY: my + 16, maxX: mx + mapW - 10, maxY: my + mapH - 10 },
    3,
  );

  for (const item of pendingLabels) {
    const box = resolved.get(item.id);
    if (!box) continue;
    roundRect(ctx, box.x - box.width / 2, box.y - box.height / 2, box.width, box.height, 4);
    ctx.fillStyle = item.bg;
    ctx.fill();
    ctx.fillStyle = item.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.text, box.x, box.y + 0.5);
  }
  ctx.restore();

  ctx.restore(); // End map clip

  // Sector & game metadata header above map frame (right-aligned on desktop)
  ctx.save();
  ctx.font = `600 ${isCompact ? 9.5 : 10.5}px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(226, 232, 240, 0.76)';
  ctx.textAlign = isCompact ? 'left' : 'right';
  ctx.textBaseline = 'bottom';
  const gameTag = payload.gameTitle ? `${payload.gameTitle.toUpperCase()}  ·  ` : '';
  ctx.fillText(
    `${gameTag}${payload.sectorName.toUpperCase()}  ·  ${payload.operationPhase}`,
    isCompact ? mx + 4 : mx + mapW - 4,
    my - 7,
    mapW - 8,
  );
  ctx.restore();
}
