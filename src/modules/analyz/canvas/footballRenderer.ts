import { getFootballPlayerPortrait } from '../engine/assetResolver';
import type { FootballPayload } from '../engine/types';
import { resolveLabelPositions, type LabelBoxInput } from './labelLayout';
import { drawCurvedVector, lerp, roundRect, samplePolyline } from './math';

export interface FootballRenderMemory {
  positions: Map<string, { x: number; y: number }>;
}

export function createFootballMemory(): FootballRenderMemory {
  return { positions: new Map() };
}

export function renderFootballStage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  payload: FootballPayload,
  memory: FootballRenderMemory,
  time: number,
  dt: number,
): void {
  const isCompact = width < 560;
  const padX = isCompact ? 14 : Math.max(22, width * 0.04);
  const topPad = isCompact ? 64 : Math.max(84, height * 0.125);
  const bottomPad = isCompact ? 18 : Math.max(22, height * 0.04);
  const availW = Math.max(240, width - padX * 2);
  const availH = Math.max(180, height - topPad - bottomPad);

  const pitchAspect = isCompact ? 1.26 : 1.56;
  let pitchW = availW;
  let pitchH = pitchW / pitchAspect;
  if (pitchH > availH) {
    pitchH = availH;
    pitchW = pitchH * pitchAspect;
  }

  const px = (width - pitchW) / 2;
  const py = topPad + (availH - pitchH) / 2;

  const toX = (nx: number) => px + (nx / 100) * pitchW;
  const toY = (ny: number) => py + (ny / 100) * pitchH;

  // Ambient stadium backdrop glow behind pitch
  const ambient = ctx.createRadialGradient(
    width / 2,
    py + pitchH * 0.45,
    pitchW * 0.1,
    width / 2,
    py + pitchH * 0.5,
    Math.max(width, height) * 0.72,
  );
  ambient.addColorStop(0, 'rgba(20, 92, 58, 0.28)');
  ambient.addColorStop(0.65, 'rgba(9, 25, 22, 0.18)');
  ambient.addColorStop(1, 'rgba(6, 9, 15, 0)');
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, width, height);

  // Outer pitch apron / technical border
  const apron = Math.max(8, pitchW * 0.018);
  ctx.save();
  roundRect(ctx, px - apron, py - apron, pitchW + apron * 2, pitchH + apron * 2, 16);
  ctx.fillStyle = '#0B3522';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Clip inner turf for mowed stripes & floodlight shading
  roundRect(ctx, px, py, pitchW, pitchH, 8);
  ctx.clip();

  const stripeCount = 12;
  const stripeW = pitchW / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#145838' : '#186340';
    ctx.fillRect(px + i * stripeW, py, stripeW + 1, pitchH);
  }

  // Subtle horizontal cross-cut texture sheen
  const hStripes = 6;
  const hStripeH = pitchH / hStripes;
  for (let j = 0; j < hStripes; j++) {
    if (j % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.018)';
      ctx.fillRect(px, py + j * hStripeH, pitchW, hStripeH);
    }
  }

  // Stadium floodlight radial highlights
  const flood = ctx.createRadialGradient(
    px + pitchW * 0.5,
    py + pitchH * 0.35,
    pitchW * 0.05,
    px + pitchW * 0.5,
    py + pitchH * 0.5,
    pitchW * 0.72,
  );
  flood.addColorStop(0, 'rgba(180, 255, 210, 0.09)');
  flood.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
  flood.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = flood;
  ctx.fillRect(px, py, pitchW, pitchH);

  // Tactical zones
  if (payload.zones) {
    for (const z of payload.zones) {
      const zx = toX(z.x);
      const zy = toY(z.y);
      const zw = (z.w / 100) * pitchW;
      const zh = (z.h / 100) * pitchH;
      const pulse = 0.09 + Math.sin(time * 2.2) * 0.03;

      const fillTone =
        z.tone === 'attack'
          ? `rgba(56, 189, 248, ${pulse + 0.04})`
          : z.tone === 'press'
            ? `rgba(244, 63, 94, ${pulse + 0.05})`
            : `rgba(250, 204, 21, ${pulse + 0.02})`;
      const strokeTone =
        z.tone === 'attack'
          ? 'rgba(56, 189, 248, 0.45)'
          : z.tone === 'press'
            ? 'rgba(244, 63, 94, 0.5)'
            : 'rgba(250, 204, 21, 0.42)';

      roundRect(ctx, zx, zy, zw, zh, 8);
      ctx.fillStyle = fillTone;
      ctx.fill();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = strokeTone;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.setLineDash([]);

      if (z.label && !isCompact) {
        ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = 'rgba(241, 245, 249, 0.82)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(z.label, zx + 8, zy + 7);
      }
    }
  }

  // Crisp chalk pitch markings
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.82)';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(px + 1, py + 1, pitchW - 2, pitchH - 2);

  // Halfway line & center circle
  ctx.beginPath();
  ctx.moveTo(px + pitchW / 2, py);
  ctx.lineTo(px + pitchW / 2, py + pitchH);
  ctx.stroke();

  const centerR = pitchH * 0.145;
  ctx.beginPath();
  ctx.arc(px + pitchW / 2, py + pitchH / 2, centerR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
  ctx.beginPath();
  ctx.arc(px + pitchW / 2, py + pitchH / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Left & right penalty areas
  const penW = pitchW * 0.16;
  const penH = pitchH * 0.56;
  const sixW = pitchW * 0.058;
  const sixH = pitchH * 0.27;
  const penSpotOffset = pitchW * 0.11;

  ctx.strokeRect(px, py + (pitchH - penH) / 2, penW, penH);
  ctx.strokeRect(px, py + (pitchH - sixH) / 2, sixW, sixH);
  ctx.beginPath();
  ctx.arc(px + penSpotOffset, py + pitchH / 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px + penSpotOffset, py + pitchH / 2, centerR * 0.86, -0.66, 0.66);
  ctx.stroke();

  ctx.strokeRect(px + pitchW - penW, py + (pitchH - penH) / 2, penW, penH);
  ctx.strokeRect(px + pitchW - sixW, py + (pitchH - sixH) / 2, sixW, sixH);
  ctx.beginPath();
  ctx.arc(px + pitchW - penSpotOffset, py + pitchH / 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px + pitchW - penSpotOffset, py + pitchH / 2, centerR * 0.86, Math.PI - 0.66, Math.PI + 0.66);
  ctx.stroke();

  // Corner arcs
  const cornerR = 11;
  ctx.beginPath();
  ctx.arc(px, py, cornerR, 0, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px + pitchW, py, cornerR, Math.PI / 2, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px + pitchW, py + pitchH, cornerR, Math.PI, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px, py + pitchH, cornerR, Math.PI * 1.5, Math.PI * 2);
  ctx.stroke();

  ctx.restore();

  // Goal frames
  const goalH = pitchH * 0.15;
  const goalDepth = Math.max(6, apron * 0.68);
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.72)';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(px - goalDepth, py + (pitchH - goalH) / 2, goalDepth, goalH);
  ctx.strokeRect(px - goalDepth, py + (pitchH - goalH) / 2, goalDepth, goalH);
  ctx.fillRect(px + pitchW, py + (pitchH - goalH) / 2, goalDepth, goalH);
  ctx.strokeRect(px + pitchW, py + (pitchH - goalH) / 2, goalDepth, goalH);

  // Tactical motion vectors
  for (const vec of payload.vectors) {
    const f: [number, number] = [toX(vec.from[0]), toY(vec.from[1])];
    const t: [number, number] = [toX(vec.to[0]), toY(vec.to[1])];
    const curvePx = ((vec.curve ?? 0) / 100) * pitchH;
    const vecLabel = isCompact ? undefined : vec.label;

    if (vec.type === 'pass') {
      drawCurvedVector(ctx, f, t, curvePx, {
        color: '#E0F2FE',
        dashed: true,
        lineWidth: 2.2,
        time,
        speed: 34,
        label: vecLabel,
      });
    } else if (vec.type === 'run') {
      drawCurvedVector(ctx, f, t, curvePx, {
        color: '#FBBF24',
        dashed: false,
        lineWidth: 2.3,
        time,
        speed: 24,
        label: vecLabel,
      });
    } else {
      const ringR = 13 + Math.sin(time * 4.5) * 3.5;
      ctx.save();
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.65)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(t[0], t[1], ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      drawCurvedVector(ctx, f, t, curvePx, {
        color: '#FB7185',
        dashed: true,
        lineWidth: 2,
        time,
        speed: 40,
        label: vecLabel,
      });
    }
  }

  // Interpolate player positions & prepare auto-offset label boxes
  const lerpFactor = Math.min(1, dt * 6.5);
  const tokenR = isCompact
    ? Math.max(10, Math.min(13.5, pitchW * 0.036))
    : Math.max(13.5, Math.min(18.5, pitchW * 0.02));

  const renderedHomeLabels: Array<{
    id: string;
    anchorX: number;
    anchorY: number;
    text: string;
    hasPortrait: boolean;
  }> = [];

  const labelFontSize = isCompact ? 8.5 : 10;
  ctx.font = `600 ${labelFontSize}px "Plus Jakarta Sans", sans-serif`;

  for (const player of payload.players) {
    const existing = memory.positions.get(player.id);
    const curX = existing ? lerp(existing.x, player.x, lerpFactor) : player.x;
    const curY = existing ? lerp(existing.y, player.y, lerpFactor) : player.y;
    memory.positions.set(player.id, { x: curX, y: curY });

    const cx = toX(curX);
    const cy = toY(curY);
    const isHome = player.team === 'home';

    // Attempt live real player portrait resolution if player has a name
    const portrait = isHome && player.name ? getFootballPlayerPortrait(player.name) : null;
    const portraitImg = portrait?.status === 'ready' ? portrait.image : null;

    ctx.save();
    // Ground drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + tokenR * 0.74, tokenR * 0.82, tokenR * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();

    // Active ball carrier ring
    if (player.hasBall) {
      const haloR = tokenR + 4 + Math.sin(time * 4) * 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Token body (real cutout portrait clipped inside circular badge OR sleek numbered tactical badge)
    if (portraitImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, tokenR, 0, Math.PI * 2);
      ctx.clip();

      // Clean dark sky-slate studio gradient behind player cutout
      const bg = ctx.createLinearGradient(cx, cy - tokenR, cx, cy + tokenR);
      bg.addColorStop(0, '#1E3A5F');
      bg.addColorStop(1, '#0F172A');
      ctx.fillStyle = bg;
      ctx.fillRect(cx - tokenR, cy - tokenR, tokenR * 2, tokenR * 2);

      // Cover-crop portrait biased slightly upward to frame the face
      const iw = portraitImg.naturalWidth;
      const ih = portraitImg.naturalHeight;
      const size = tokenR * 2.08;
      const scale = Math.max(size / iw, size / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(portraitImg, cx - dw / 2, cy - dh * 0.44, dw, dh);
      ctx.restore();

      // Crisp outer jersey ring
      ctx.beginPath();
      ctx.arc(cx, cy, tokenR, 0, Math.PI * 2);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#E0F2FE';
      ctx.stroke();

      // Mini jersey number corner badge
      const badgeR = Math.max(6, tokenR * 0.42);
      const bx = cx + tokenR * 0.7;
      const by = cy - tokenR * 0.68;
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 ${Math.round(badgeR * 1.2)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(player.number), bx, by + 0.5);
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, tokenR, 0, Math.PI * 2);
      if (isHome) {
        const g = ctx.createLinearGradient(cx, cy - tokenR, cx, cy + tokenR);
        g.addColorStop(0, '#38BDF8');
        g.addColorStop(1, '#0284C7');
        ctx.fillStyle = g;
      } else {
        const g = ctx.createLinearGradient(cx, cy - tokenR, cx, cy + tokenR);
        g.addColorStop(0, 'rgba(244, 63, 94, 0.92)');
        g.addColorStop(1, 'rgba(159, 18, 57, 0.92)');
        ctx.fillStyle = g;
      }
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = isHome ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 228, 230, 0.62)';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 ${Math.round(tokenR * 0.82)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(player.number), cx, cy + 0.5);
    }

    if (isHome) {
      const labelText = player.displayName
        ? isCompact
          ? player.displayName.slice(0, 8)
          : player.displayName
        : player.role;
      renderedHomeLabels.push({
        id: player.id,
        anchorX: cx,
        anchorY: cy + tokenR + 9,
        text: labelText,
        hasPortrait: Boolean(portraitImg),
      });
    }
    ctx.restore();
  }

  // Smart auto-offset label pass for home players so names NEVER overlap on mobile or desktop
  ctx.save();
  ctx.font = `600 ${labelFontSize}px "Plus Jakarta Sans", sans-serif`;
  const boxInputs: LabelBoxInput[] = renderedHomeLabels.map((item) => ({
    id: item.id,
    x: item.anchorX,
    y: item.anchorY,
    width: ctx.measureText(item.text).width + 9,
    height: labelFontSize + 5,
    priority: item.hasPortrait ? 2 : 1,
  }));

  const resolved = resolveLabelPositions(
    boxInputs,
    {
      minX: px - apron + 4,
      minY: py - apron + 4,
      maxX: px + pitchW + apron - 4,
      maxY: py + pitchH + apron - 4,
    },
    3,
  );

  for (const item of renderedHomeLabels) {
    const box = resolved.get(item.id);
    if (!box) continue;
    ctx.fillStyle = 'rgba(6, 12, 18, 0.8)';
    roundRect(ctx, box.x - box.width / 2, box.y - box.height / 2, box.width, box.height, 4);
    ctx.fill();
    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.text, box.x, box.y + 0.5);
  }
  ctx.restore();

  // Animated football traveling along ballPath
  if (payload.ballPath && payload.ballPath.length >= 2) {
    const pixelPath = payload.ballPath.map(([bx, by]): [number, number] => [toX(bx), toY(by)]);
    const cycle = (time * 0.24) % 1;
    const [bx, by] = samplePolyline(pixelPath, cycle);

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(bx + 2, by + 5, 5.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(bx, by, 2.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Formation metadata line above apron (right-aligned on desktop to stay clear of top-left title/subtitle)
  ctx.save();
  ctx.font = `600 ${isCompact ? 9.5 : 10.5}px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
  ctx.textAlign = isCompact ? 'left' : 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(
    `FORMATION ${payload.formation}  ·  ${payload.tacticalStyle}`,
    isCompact ? px + 4 : px + pitchW - 4,
    py - apron - 7,
    pitchW - 8,
  );
  ctx.restore();
}
