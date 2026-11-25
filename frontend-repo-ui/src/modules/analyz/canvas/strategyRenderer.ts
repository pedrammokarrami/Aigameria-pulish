import { getStrategyHeroAsset, getStrategyMapAsset } from '../engine/assetResolver';
import type { StrategyPayload } from '../engine/types';
import { resolveLabelPositions, type LabelBoxInput } from './labelLayout';
import { drawCurvedVector, easeInOutCubic, lerp, roundRect } from './math';

export interface StrategyRenderMemory {
  positions: Map<string, { x: number; y: number }>;
}

export function createStrategyMemory(): StrategyRenderMemory {
  return { positions: new Map() };
}

export function renderStrategyStage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  payload: StrategyPayload,
  memory: StrategyRenderMemory,
  time: number,
  dt: number,
): void {
  const isCompact = width < 560;
  const padX = isCompact ? 12 : Math.max(22, width * 0.04);
  const topPad = isCompact ? 64 : Math.max(84, height * 0.125);
  const bottomPad = isCompact ? 18 : Math.max(22, height * 0.04);
  const availW = Math.max(260, width - padX * 2);
  const availH = Math.max(190, height - topPad - bottomPad);

  // Official MOBA minimaps (Dota 2 & Summoner's Rift) are square (1:1); RTS battlefields fit 16:10
  const targetAspect = payload.game === 'rts' ? (isCompact ? 1.24 : 1.52) : 1.06;
  let boardW = availW;
  let boardH = boardW / targetAspect;
  if (boardH > availH) {
    boardH = availH;
    boardW = boardH * targetAspect;
  }

  const bx = (width - boardW) / 2;
  const by = topPad + (availH - boardH) / 2;
  const toX = (nx: number) => bx + (nx / 100) * boardW;
  const toY = (ny: number) => by + (ny / 100) * boardH;
  const toR = (nr: number) => (nr / 100) * Math.min(boardW, boardH);

  ctx.save();
  roundRect(ctx, bx, by, boardW, boardH, 16);
  ctx.fillStyle = '#090F17';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.clip();

  // Real MOBA / Strategy minimap background via assetResolver (Riot DataDragon / Dota 2 Wiki / Studio Battlefield)
  const mapAsset = getStrategyMapAsset(payload.game);
  if (mapAsset.image && mapAsset.image.naturalWidth > 0) {
    const iw = mapAsset.image.naturalWidth;
    const ih = mapAsset.image.naturalHeight;
    const scale = Math.max(boardW / iw, boardH / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(mapAsset.image, bx + (boardW - dw) / 2, by + (boardH - dh) / 2, dw, dh);

    // Subtle atmospheric vignette so animated vectors and hero portraits read crisply
    ctx.fillStyle = 'rgba(6, 10, 18, 0.34)';
    ctx.fillRect(bx, by, boardW, boardH);
  }

  // Ward vision radius circles (Observer / Sentry / Control)
  for (const ward of payload.wards) {
    const wx = toX(ward.x);
    const wy = toY(ward.y);
    const wr = toR(ward.radius);
    const isAlly = ward.team === 'radiant';

    const fill =
      ward.type === 'sentry' || ward.type === 'control'
        ? isAlly
          ? 'rgba(167, 139, 250, 0.16)'
          : 'rgba(244, 63, 94, 0.15)'
        : isAlly
          ? 'rgba(250, 204, 21, 0.15)'
          : 'rgba(251, 113, 133, 0.14)';
    const stroke =
      ward.type === 'sentry' || ward.type === 'control'
        ? 'rgba(196, 181, 253, 0.72)'
        : isAlly
          ? 'rgba(250, 204, 21, 0.72)'
          : 'rgba(251, 113, 133, 0.65)';

    ctx.save();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(wx, wy, wr, 0, Math.PI * 2);
    ctx.fill();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.setLineDash([]);

    // Ward eye core icon
    ctx.fillStyle = stroke;
    ctx.beginPath();
    ctx.arc(wx, wy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Animated teamfight combo rings & tactical lane/gank/TP vectors
  for (const act of payload.actions) {
    const f: [number, number] = [toX(act.from[0]), toY(act.from[1])];
    const t: [number, number] = [toX(act.to[0]), toY(act.to[1])];
    const curvePx = ((act.curve ?? 0) / 100) * boardH;

    if (act.type === 'combo') {
      const baseR = toR(act.radius ?? 9);
      const wave = (time * 0.85) % 1;
      ctx.save();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
      ctx.beginPath();
      ctx.arc(t[0], t[1], baseR, 0, Math.PI * 2);
      ctx.fill();

      // Expanding AoE combo shockwave ring
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.9 - wave * 0.85})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(t[0], t[1], baseR * (0.45 + wave * 0.85), 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.82)';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(t[0], t[1], baseR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else if (act.type === 'gank') {
      drawCurvedVector(ctx, f, t, curvePx, {
        color: '#34D399',
        dashed: false,
        lineWidth: 2.5,
        time,
        speed: 32,
      });
    } else if (act.type === 'tp') {
      drawCurvedVector(ctx, f, t, curvePx, {
        color: '#C084FC',
        dashed: true,
        lineWidth: 2.3,
        time,
        speed: 44,
      });
    } else {
      // Lane push
      drawCurvedVector(ctx, f, t, curvePx, {
        color: '#38BDF8',
        dashed: false,
        lineWidth: 2.4,
        time,
        speed: 28,
      });
    }
  }

  // Collect all labels (actions, objectives, units) for smart non-overlapping auto-offsetting
  const pendingLabels: Array<{
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    bg: string;
    priority: number;
  }> = [];

  if (!isCompact) {
    for (const act of payload.actions) {
      if (!act.label) continue;
      const mx = (toX(act.from[0]) + toX(act.to[0])) / 2;
      const my = (toY(act.from[1]) + toY(act.to[1])) / 2;
      const col =
        act.type === 'combo'
          ? '#FDE68A'
          : act.type === 'gank'
            ? '#6EE7B7'
            : act.type === 'tp'
              ? '#E9D5FF'
              : '#BAE6FD';
      pendingLabels.push({
        id: `act-${act.id}`,
        x: mx,
        y: my - 10,
        text: act.label,
        color: col,
        bg: 'rgba(8, 12, 22, 0.86)',
        priority: 1,
      });
    }
  }

  // Objectives (Roshan, Baron Nashor, Towers, Bases) with crisp timer callouts
  for (const obj of payload.objectives) {
    const ox = toX(obj.x);
    const oy = toY(obj.y);

    ctx.save();
    if (obj.type === 'roshan' || obj.type === 'baron') {
      const pulse = 1 + Math.sin(time * 3.5) * 0.08;
      ctx.fillStyle = obj.type === 'baron' ? 'rgba(147, 51, 234, 0.88)' : 'rgba(217, 119, 6, 0.9)';
      ctx.strokeStyle = '#FEF3C7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 6;
        const rx = ox + Math.cos(a) * 11.5 * pulse;
        const ry = oy + Math.sin(a) * 11.5 * pulse;
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 8.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obj.type === 'baron' ? 'BN' : 'RS', ox, oy + 0.5);
    } else {
      const col = obj.team === 'radiant' ? '#34D399' : '#F43F5E';
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      roundRect(ctx, ox - 7, oy - 7, 14, 14, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.fillRect(ox - 3, oy - 3, 6, 6);
    }
    ctx.restore();

    const text = obj.timer ? `${obj.label} · ${obj.timer}` : obj.label;
    pendingLabels.push({
      id: `obj-${obj.id}`,
      x: ox,
      y: oy + 19,
      text,
      color: obj.type === 'baron' ? '#E9D5FF' : '#FDE68A',
      bg: 'rgba(12, 10, 22, 0.88)',
      priority: 3,
    });
  }

  // Smooth multi-phase hero/unit motion cycle
  const rawCycle = (time % 6.0) / 6.0;
  let phaseT = 0;
  if (rawCycle < 0.16) phaseT = 0;
  else if (rawCycle < 0.68) phaseT = easeInOutCubic((rawCycle - 0.16) / 0.52);
  else if (rawCycle < 0.88) phaseT = 1;
  else phaseT = 1 - easeInOutCubic((rawCycle - 0.88) / 0.12);

  const lerpFactor = Math.min(1, dt * 8);
  const unitR = isCompact
    ? Math.max(11, Math.min(14, boardW * 0.038))
    : Math.max(15, Math.min(20, boardW * 0.024));

  for (const unit of payload.units) {
    const goalX = lerp(unit.x, unit.targetX ?? unit.x, phaseT);
    const goalY = lerp(unit.y, unit.targetY ?? unit.y, phaseT);

    const prev = memory.positions.get(unit.id);
    const curX = prev ? lerp(prev.x, goalX, lerpFactor) : goalX;
    const curY = prev ? lerp(prev.y, goalY, lerpFactor) : goalY;
    memory.positions.set(unit.id, { x: curX, y: curY });

    const ux = toX(curX);
    const uy = toY(curY);
    const isAlly = unit.team === 'radiant';
    const ringColor = isAlly ? '#34D399' : '#FB7185';

    // Fetch real Dota 2 / League of Legends / RTS hero portrait icon
    const heroAsset = getStrategyHeroAsset(payload.game, unit.heroKey, unit.name);
    const heroImg = heroAsset?.status === 'ready' ? heroAsset.image : null;

    ctx.save();
    // Ultimate-ready glowing ring
    if (unit.ultimateReady) {
      const ultR = unitR + 3.5 + Math.sin(time * 4.5) * 1.6;
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.72)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ux, uy, ultR, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (heroImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(ux, uy, unitR, 0, Math.PI * 2);
      ctx.clip();

      const iw = heroImg.naturalWidth;
      const ih = heroImg.naturalHeight;
      const size = unitR * 2.05;
      const sc = Math.max(size / iw, size / ih);
      const dw = iw * sc;
      const dh = ih * sc;
      ctx.drawImage(heroImg, ux - dw / 2, uy - dh / 2, dw, dh);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(ux, uy, unitR, 0, Math.PI * 2);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = ringColor;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(ux, uy, unitR, 0, Math.PI * 2);
      ctx.fillStyle = isAlly ? '#064E3B' : '#4C0519';
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = ringColor;
      ctx.stroke();

      const initials = unit.name
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 ${Math.round(unitR * 0.78)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, ux, uy + 0.5);
    }

    // Hero level indicator dot
    if (unit.level !== undefined && !isCompact) {
      const lr = 6.5;
      const lx = ux + unitR * 0.72;
      const ly = uy - unitR * 0.7;
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#F8FAFC';
      ctx.font = '700 7.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(unit.level), lx, ly + 0.5);
    }
    ctx.restore();

    pendingLabels.push({
      id: `unit-${unit.id}`,
      x: ux,
      y: uy + unitR + 10,
      text: isCompact ? unit.name.split(' ')[0] : unit.name,
      color: isAlly ? '#ECFDF5' : '#FFE4E6',
      bg: 'rgba(7, 12, 22, 0.85)',
      priority: 2,
    });
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
    { minX: bx + 8, minY: by + 10, maxX: bx + boardW - 8, maxY: by + boardH - 10 },
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

  ctx.restore(); // End board clip

  // Game & match clock metadata line above board (right-aligned on desktop)
  ctx.save();
  ctx.font = `600 ${isCompact ? 9.5 : 10.5}px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(226, 232, 240, 0.78)';
  ctx.textAlign = isCompact ? 'left' : 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(
    `${payload.gameLabel.toUpperCase()}  ·  ${payload.matchClock}`,
    isCompact ? bx + 4 : bx + boardW - 4,
    by - 7,
    boardW - 8,
  );
  ctx.restore();
}
