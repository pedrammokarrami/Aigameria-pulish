import type { BasketballPayload } from '../engine/types';
import {
  drawCurvedVector,
  easeInOutCubic,
  lerp,
  roundRect,
  samplePolyline,
} from './math';

export interface BasketballRenderMemory {
  positions: Map<string, { x: number; y: number }>;
}

export function createBasketballMemory(): BasketballRenderMemory {
  return { positions: new Map() };
}

export function renderBasketballStage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  payload: BasketballPayload,
  memory: BasketballRenderMemory,
  time: number,
  dt: number,
): void {
  const padX = Math.max(22, width * 0.04);
  const topPad = Math.max(84, height * 0.125);
  const bottomPad = Math.max(22, height * 0.04);
  const availW = Math.max(240, width - padX * 2);
  const availH = Math.max(180, height - topPad - bottomPad);

  // NBA full court proportion ~ 94ft x 50ft (1.88:1), slightly tightened to 1.72 for crisp screen balance
  const aspect = 1.72;
  let courtW = availW;
  let courtH = courtW / aspect;
  if (courtH > availH) {
    courtH = availH;
    courtW = courtH * aspect;
  }

  const cx0 = (width - courtW) / 2;
  const cy0 = topPad + (availH - courtH) / 2;
  const toX = (nx: number) => cx0 + (nx / 100) * courtW;
  const toY = (ny: number) => cy0 + (ny / 100) * courtH;

  // Warm arena glow behind hardwood
  const arenaGlow = ctx.createRadialGradient(
    width / 2,
    cy0 + courtH * 0.48,
    courtW * 0.08,
    width / 2,
    cy0 + courtH * 0.5,
    Math.max(width, height) * 0.7,
  );
  arenaGlow.addColorStop(0, 'rgba(217, 119, 6, 0.22)');
  arenaGlow.addColorStop(0.6, 'rgba(30, 41, 59, 0.16)');
  arenaGlow.addColorStop(1, 'rgba(6, 9, 15, 0)');
  ctx.fillStyle = arenaGlow;
  ctx.fillRect(0, 0, width, height);

  // Court apron (midnight navy NBA arena border)
  const apron = Math.max(11, courtW * 0.02);
  ctx.save();
  roundRect(ctx, cx0 - apron, cy0 - apron, courtW + apron * 2, courtH + apron * 2, 16);
  ctx.fillStyle = '#121927';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Clip inner maple hardwood floor
  roundRect(ctx, cx0, cy0, courtW, courtH, 6);
  ctx.clip();

  // Procedural maple planks
  const plankRows = 22;
  const plankH = courtH / plankRows;
  const tones = ['#C58F56', '#BC844B', '#CD9960', '#B57D46', '#C9935A'];
  for (let r = 0; r < plankRows; r++) {
    const py = cy0 + r * plankH;
    const segments = 5;
    const segW = courtW / segments;
    const offset = ((r * 37) % 100) / 100;
    for (let s = -1; s <= segments; s++) {
      const px = cx0 + (s + offset) * segW;
      ctx.fillStyle = tones[(r * 3 + s + 10) % tones.length];
      ctx.fillRect(px, py, segW + 1, plankH + 0.5);
      ctx.strokeStyle = 'rgba(84, 48, 16, 0.14)';
      ctx.lineWidth = 0.7;
      ctx.strokeRect(px, py, segW, plankH);
    }
  }

  // Glossy hardwood specular overhead sheen
  const sheen = ctx.createRadialGradient(
    cx0 + courtW * 0.68,
    cy0 + courtH * 0.35,
    courtW * 0.05,
    cx0 + courtW * 0.5,
    cy0 + courtH * 0.5,
    courtW * 0.78,
  );
  sheen.addColorStop(0, 'rgba(255, 248, 225, 0.22)');
  sheen.addColorStop(0.55, 'rgba(255, 255, 255, 0.02)');
  sheen.addColorStop(1, 'rgba(15, 23, 42, 0.34)');
  ctx.fillStyle = sheen;
  ctx.fillRect(cx0, cy0, courtW, courtH);

  // Subtle focus dimming on inactive left half so right half-court play pops
  const focusGrad = ctx.createLinearGradient(cx0, cy0, cx0 + courtW * 0.54, cy0);
  focusGrad.addColorStop(0, 'rgba(10, 15, 26, 0.42)');
  focusGrad.addColorStop(1, 'rgba(10, 15, 26, 0)');
  ctx.fillStyle = focusGrad;
  ctx.fillRect(cx0, cy0, courtW * 0.54, courtH);

  // Painted keys (left & right)
  const keyW = courtW * 0.19;
  const keyH = courtH * 0.32;
  const keyY = cy0 + (courtH - keyH) / 2;

  ctx.fillStyle = 'rgba(22, 33, 56, 0.86)';
  ctx.fillRect(cx0, keyY, keyW, keyH);
  ctx.fillRect(cx0 + courtW - keyW, keyY, keyW, keyH);

  // Center circle paint accent
  const centerR = courtH * 0.125;
  ctx.fillStyle = 'rgba(22, 33, 56, 0.72)';
  ctx.beginPath();
  ctx.arc(cx0 + courtW / 2, cy0 + courtH / 2, centerR, 0, Math.PI * 2);
  ctx.fill();

  // Court lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx0 + 1, cy0 + 1, courtW - 2, courtH - 2);

  // Half-court line & jump circle
  ctx.beginPath();
  ctx.moveTo(cx0 + courtW / 2, cy0);
  ctx.lineTo(cx0 + courtW / 2, cy0 + courtH);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx0 + courtW / 2, cy0 + courtH / 2, centerR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx0 + courtW / 2, cy0 + courtH / 2, centerR * 0.34, 0, Math.PI * 2);
  ctx.stroke();

  // Key outlines + free-throw circles
  ctx.strokeRect(cx0, keyY, keyW, keyH);
  ctx.strokeRect(cx0 + courtW - keyW, keyY, keyW, keyH);

  const ftR = keyH * 0.38;
  // Left FT circle
  ctx.beginPath();
  ctx.arc(cx0 + keyW, cy0 + courtH / 2, ftR, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx0 + keyW, cy0 + courtH / 2, ftR, Math.PI / 2, Math.PI * 1.5);
  ctx.stroke();
  ctx.setLineDash([]);

  // Right FT circle
  ctx.beginPath();
  ctx.arc(cx0 + courtW - keyW, cy0 + courtH / 2, ftR, Math.PI / 2, Math.PI * 1.5);
  ctx.stroke();
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx0 + courtW - keyW, cy0 + courtH / 2, ftR, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Three-point lines (both sides)
  const threeR = courtH * 0.43;
  const cornerLen = courtW * 0.135;
  const cornerInsetY = courtH * 0.07;

  // Left 3PT
  ctx.beginPath();
  ctx.moveTo(cx0, cy0 + cornerInsetY);
  ctx.lineTo(cx0 + cornerLen, cy0 + cornerInsetY);
  ctx.moveTo(cx0, cy0 + courtH - cornerInsetY);
  ctx.lineTo(cx0 + cornerLen, cy0 + courtH - cornerInsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx0 + courtW * 0.055, cy0 + courtH / 2, threeR, -1.19, 1.19);
  ctx.stroke();

  // Right 3PT
  ctx.beginPath();
  ctx.moveTo(cx0 + courtW, cy0 + cornerInsetY);
  ctx.lineTo(cx0 + courtW - cornerLen, cy0 + cornerInsetY);
  ctx.moveTo(cx0 + courtW, cy0 + courtH - cornerInsetY);
  ctx.lineTo(cx0 + courtW - cornerLen, cy0 + courtH - cornerInsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx0 + courtW * 0.945, cy0 + courtH / 2, threeR, Math.PI - 1.19, Math.PI + 1.19);
  ctx.stroke();

  // Backboards & hoops
  const hoopOffset = courtW * 0.052;
  const boardHalf = courtH * 0.055;
  // Left hoop
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(cx0 + hoopOffset * 0.68, cy0 + courtH / 2 - boardHalf);
  ctx.lineTo(cx0 + hoopOffset * 0.68, cy0 + courtH / 2 + boardHalf);
  ctx.stroke();
  ctx.strokeStyle = '#F97316';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx0 + hoopOffset, cy0 + courtH / 2, 7, 0, Math.PI * 2);
  ctx.stroke();

  // Right hoop (active offense hoop)
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(cx0 + courtW - hoopOffset * 0.68, cy0 + courtH / 2 - boardHalf);
  ctx.lineTo(cx0 + courtW - hoopOffset * 0.68, cy0 + courtH / 2 + boardHalf);
  ctx.stroke();
  ctx.strokeStyle = '#F97316';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(cx0 + courtW - hoopOffset, cy0 + courtH / 2, 7.5, 0, Math.PI * 2);
  ctx.stroke();

  // Spacing / Target zones
  if (payload.zones) {
    for (const z of payload.zones) {
      const zx = toX(z.x);
      const zy = toY(z.y);
      const zr = (z.radius / 100) * courtW;
      const breath = 1 + Math.sin(time * 2.5) * 0.06;

      const color =
        z.tone === 'paint'
          ? 'rgba(249, 115, 22, 0.22)'
          : z.tone === 'shooter'
            ? 'rgba(56, 189, 248, 0.24)'
            : 'rgba(52, 211, 153, 0.2)';
      const stroke =
        z.tone === 'paint'
          ? 'rgba(251, 146, 60, 0.78)'
          : z.tone === 'shooter'
            ? 'rgba(56, 189, 248, 0.85)'
            : 'rgba(52, 211, 153, 0.78)';

      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(zx, zy, zr * breath, 0, Math.PI * 2);
      ctx.fill();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
      const tw = ctx.measureText(z.label).width;
      ctx.fillStyle = 'rgba(10, 15, 26, 0.78)';
      roundRect(ctx, zx - tw / 2 - 5, zy + zr + 3, tw + 10, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#F8FAFC';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.label, zx, zy + zr + 11);
      ctx.restore();
    }
  }

  ctx.restore(); // End court clip

  // Playbook action arrows (screens, cuts, passes, dribbles)
  for (const act of payload.actions) {
    const f: [number, number] = [toX(act.from[0]), toY(act.from[1])];
    const t: [number, number] = [toX(act.to[0]), toY(act.to[1])];
    const curvePx = ((act.curve ?? 0) / 100) * courtH;

    if (act.type === 'screen') {
      // Draw line + perpendicular T-bar screen symbol
      ctx.save();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(f[0], f[1]);
      ctx.lineTo(t[0], t[1]);
      ctx.stroke();

      const ang = Math.atan2(t[1] - f[1], t[0] - f[0]) + Math.PI / 2;
      const barLen = 11;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(t[0] - Math.cos(ang) * barLen, t[1] - Math.sin(ang) * barLen);
      ctx.lineTo(t[0] + Math.cos(ang) * barLen, t[1] + Math.sin(ang) * barLen);
      ctx.stroke();

      if (act.label) {
        const mx = (f[0] + t[0]) / 2 - 22;
        const my = (f[1] + t[1]) / 2 + 12;
        ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
        const tw = ctx.measureText(act.label).width;
        ctx.fillStyle = 'rgba(10, 15, 26, 0.86)';
        roundRect(ctx, mx - tw / 2 - 5, my - 8, tw + 10, 16, 4);
        ctx.fill();
        ctx.fillStyle = '#FDE68A';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(act.label, mx, my);
      }
      ctx.restore();
    } else if (act.type === 'pass') {
      drawCurvedVector(ctx, f, t, curvePx, {
        color: '#F8FAFC',
        dashed: true,
        lineWidth: 2.3,
        time,
        speed: 36,
        label: act.label,
      });
    } else if (act.type === 'dribble') {
      drawCurvedVector(ctx, f, t, curvePx, {
        color: '#FB923C',
        dashed: false,
        lineWidth: 2.6,
        time,
        speed: 26,
        label: act.label,
      });
    } else {
      // Cut
      drawCurvedVector(ctx, f, t, curvePx, {
        color: '#38BDF8',
        dashed: false,
        lineWidth: 2.4,
        time,
        speed: 28,
        label: act.label,
      });
    }
  }

  // Play phase progression: smooth hold -> move -> hold -> reset loop (5.6s cycle)
  const rawCycle = (time % 5.6) / 5.6;
  let phaseT = 0;
  if (rawCycle < 0.16) {
    phaseT = 0;
  } else if (rawCycle < 0.68) {
    phaseT = easeInOutCubic((rawCycle - 0.16) / 0.52);
  } else if (rawCycle < 0.88) {
    phaseT = 1;
  } else {
    phaseT = 1 - easeInOutCubic((rawCycle - 0.88) / 0.12);
  }

  const lerpFactor = Math.min(1, dt * 8);
  const tokenR = Math.max(13, Math.min(17.5, courtW * 0.0185));

  for (const player of payload.players) {
    const goalX = lerp(player.x, player.targetX ?? player.x, phaseT);
    const goalY = lerp(player.y, player.targetY ?? player.y, phaseT);

    const existing = memory.positions.get(player.id);
    const curX = existing ? lerp(existing.x, goalX, lerpFactor) : goalX;
    const curY = existing ? lerp(existing.y, goalY, lerpFactor) : goalY;
    memory.positions.set(player.id, { x: curX, y: curY });

    const px = toX(curX);
    const py = toY(curY);
    const isOffense = player.team === 'offense';

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(px, py + tokenR * 0.72, tokenR * 0.84, tokenR * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isOffense) {
      ctx.beginPath();
      ctx.arc(px, py, tokenR, 0, Math.PI * 2);
      const grad = ctx.createLinearGradient(px, py - tokenR, px, py + tokenR);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(1, '#1E293B');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = '#38BDF8';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 ${Math.round(tokenR * 0.82)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(player.number), px, py + 0.5);

      ctx.font = '600 9.5px "Plus Jakarta Sans", sans-serif';
      const pw = ctx.measureText(player.position).width;
      ctx.fillStyle = 'rgba(10, 15, 26, 0.72)';
      roundRect(ctx, px - pw / 2 - 4, py + tokenR + 3, pw + 8, 13, 3);
      ctx.fill();
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(player.position, px, py + tokenR + 9.5);
    } else {
      // Defense X / muted diamond-ring marker
      ctx.beginPath();
      ctx.arc(px, py, tokenR * 0.86, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(225, 29, 72, 0.88)';
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(255, 228, 230, 0.72)';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `600 ${Math.round(tokenR * 0.72)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`X${player.number}`, px, py + 0.5);
    }
    ctx.restore();
  }

  // Animated basketball following ballSequence
  if (payload.ballSequence && payload.ballSequence.length >= 2) {
    const pixelPts = payload.ballSequence.map(([bx, by]): [number, number] => [toX(bx), toY(by)]);
    const [bx, by] = samplePolyline(pixelPts, phaseT);

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(bx + 2, by + 6, 6.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const ballGrad = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 7.5);
    ballGrad.addColorStop(0, '#FDBA74');
    ballGrad.addColorStop(0.65, '#EA580C');
    ballGrad.addColorStop(1, '#9A3412');
    ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
    ctx.beginPath();
    ctx.arc(bx, by, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    ctx.fill();

    // Basketball seam cross
    ctx.strokeStyle = 'rgba(28, 25, 23, 0.72)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx - 6.5, by);
    ctx.lineTo(bx + 6.5, by);
    ctx.moveTo(bx, by - 6.5);
    ctx.lineTo(bx, by + 6.5);
    ctx.stroke();
    ctx.restore();
  }

  // Subtle playbook metadata label above apron (right-aligned on desktop)
  ctx.save();
  ctx.font = '600 10.5px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
  ctx.textAlign = width < 560 ? 'left' : 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(
    `PLAYBOOK ${payload.playName.toUpperCase()}  ·  ${payload.setType}`,
    width < 560 ? cx0 + 4 : cx0 + courtW - 4,
    cy0 - apron - 7,
    courtW - 8,
  );
  ctx.restore();
}
