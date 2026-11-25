import { getWeaponRenderAsset } from '../engine/assetResolver';
import type { AttachmentSlot, WeaponChassisId, WeaponPayload } from '../engine/types';
import { resolveLabelPositions, type LabelBoxInput } from './labelLayout';
import { roundRect } from './math';

export interface WeaponPinHitbox {
  slot: AttachmentSlot;
  x: number;
  y: number;
  radius: number;
}

const CHASSIS_PIN_POSITIONS: Record<WeaponChassisId, Record<AttachmentSlot, [number, number]>> = {
  m4a1: {
    stock: [12, 48],
    optic: [43, 30],
    magazine: [44, 67],
    underbarrel: [61, 50],
    barrel: [68, 41],
    muzzle: [88, 42],
  },
  vx9: {
    stock: [14, 48],
    optic: [52, 27],
    magazine: [55, 76],
    underbarrel: [70, 58],
    barrel: [76, 44],
    muzzle: [88, 44],
  },
  m200: {
    stock: [13, 52],
    optic: [42, 34],
    magazine: [40, 61],
    underbarrel: [55, 56],
    barrel: [76, 47],
    muzzle: [92, 47],
  },
};

const SLOT_LABELS: Record<AttachmentSlot, string> = {
  optic: 'OPTIC',
  muzzle: 'MUZZLE',
  barrel: 'BARREL',
  underbarrel: 'UNDERBARREL',
  magazine: 'MAGAZINE',
  stock: 'STOCK',
};

const UPPER_SLOTS = new Set<AttachmentSlot>(['stock', 'optic', 'muzzle']);

export function renderWeaponStage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  payload: WeaponPayload,
  time: number,
  pointerNorm: { x: number; y: number } = { x: 0, y: 0 },
): WeaponPinHitbox[] {
  const isCompact = width < 560;
  const accent = payload.blueprintAccent || '#38BDF8';
  const hitboxes: WeaponPinHitbox[] = [];

  const padX = isCompact ? 12 : Math.max(20, width * 0.035);
  const topPad = isCompact ? 62 : Math.max(76, height * 0.115);
  const bottomPad = isCompact ? 124 : Math.max(88, height * 0.135);
  const stageW = Math.max(260, width - padX * 2);
  const stageH = Math.max(200, height - topPad - bottomPad);
  const sx = padX;
  const sy = topPad;

  // Dark Gunsmith Studio container
  ctx.save();
  roundRect(ctx, sx, sy, stageW, stageH, 16);
  const bg = ctx.createRadialGradient(
    sx + stageW * 0.5,
    sy + stageH * 0.5,
    stageW * 0.06,
    sx + stageW * 0.5,
    sy + stageH * 0.5,
    stageW * 0.68,
  );
  bg.addColorStop(0, '#0E1624');
  bg.addColorStop(0.55, '#080D16');
  bg.addColorStop(1, '#05080F');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.clip();

  // Subtle architectural drafting grid
  const minor = isCompact ? 20 : 28;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.045)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = sx; x < sx + stageW; x += minor) {
    ctx.moveTo(x, sy);
    ctx.lineTo(x, sy + stageH);
  }
  for (let y = sy; y < sy + stageH; y += minor) {
    ctx.moveTo(sx, y);
    ctx.lineTo(sx + stageW, y);
  }
  ctx.stroke();

  // Subtle ambient studio rim light behind the real weapon render
  const parallaxX = pointerNorm.x * 10;
  const parallaxY = pointerNorm.y * 6 + Math.sin(time * 1.5) * 2.5;
  const centerX = sx + stageW * 0.5;
  const centerY = sy + stageH * 0.52;

  const rim = ctx.createRadialGradient(
    centerX + parallaxX * 0.6,
    centerY + parallaxY * 0.6,
    18,
    centerX,
    centerY,
    stageW * 0.44,
  );
  rim.addColorStop(0, `${accent}30`);
  rim.addColorStop(0.52, `${accent}0C`);
  rim.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rim;
  ctx.fillRect(sx, sy, stageW, stageH);

  // Resolve real photorealistic weapon render via assetResolver
  const asset = getWeaponRenderAsset(payload.chassis, payload.wikiQuery, payload.wikiSite);

  // Fit 16:9 weapon render cleanly inside stage leaving room for top/bottom callout rails
  const renderMaxW = stageW * (isCompact ? 0.94 : 0.84);
  const renderMaxH = stageH * (isCompact ? 0.56 : 0.68);
  const imgAspect =
    asset.image && asset.image.naturalHeight > 0
      ? asset.image.naturalWidth / asset.image.naturalHeight
      : 16 / 9;

  let drawW = renderMaxW;
  let drawH = drawW / imgAspect;
  if (drawH > renderMaxH) {
    drawH = renderMaxH;
    drawW = drawH * imgAspect;
  }

  const drawX = centerX - drawW / 2 + parallaxX;
  const drawY = centerY - drawH / 2 + parallaxY;

  if (asset.image && asset.image.naturalWidth > 0) {
    ctx.save();
    // Lighten blend melts dark studio backdrop completely into the obsidian Gunsmith stage with zero rectangular edge
    ctx.globalCompositeOperation = 'lighten';
    if (asset.flipX) {
      ctx.translate(drawX + drawW, drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(asset.image, 0, 0, drawW, drawH);
    } else {
      ctx.drawImage(asset.image, drawX, drawY, drawW, drawH);
    }
    ctx.restore();
  }

  // Soft horizon floor reflection line under weapon
  const floorY = drawY + drawH * 0.88;
  const floorGrad = ctx.createLinearGradient(sx + stageW * 0.12, floorY, sx + stageW * 0.88, floorY);
  floorGrad.addColorStop(0, 'rgba(255,255,255,0)');
  floorGrad.addColorStop(0.5, `${accent}33`);
  floorGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = floorGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx + stageW * 0.12, floorY);
  ctx.lineTo(sx + stageW * 0.88, floorY);
  ctx.stroke();

  // Compute interactive attachment pins & smart auto-offsetting callout tags
  const pinCoords = CHASSIS_PIN_POSITIONS[payload.chassis] ?? CHASSIS_PIN_POSITIONS.m4a1;
  const slots: AttachmentSlot[] = ['stock', 'optic', 'muzzle', 'magazine', 'underbarrel', 'barrel'];

  const labelFontSize = isCompact ? 9 : 10.5;
  const slotFontSize = isCompact ? 7.5 : 8.5;

  const pinScreenMap = new Map<AttachmentSlot, { px: number; py: number; name: string }>();
  const labelInputs: LabelBoxInput[] = [];

  for (const slot of slots) {
    const att = payload.attachments[slot];
    if (!att) continue;
    const [nx, ny] = pinCoords[slot];
    const px = drawX + (nx / 100) * drawW;
    const py = drawY + (ny / 100) * drawH;
    const shortName = isCompact
      ? att.name.split(' ').slice(0, 2).join(' ')
      : att.name;

    pinScreenMap.set(slot, { px, py, name: shortName });
    hitboxes.push({ slot, x: px, y: py, radius: isCompact ? 16 : 18 });

    ctx.font = `600 ${labelFontSize}px "Plus Jakarta Sans", sans-serif`;
    const nameW = ctx.measureText(shortName).width;
    ctx.font = `600 ${slotFontSize}px "JetBrains Mono", monospace`;
    const slotW = ctx.measureText(SLOT_LABELS[slot]).width;
    const boxW = Math.max(nameW, slotW) + 16;
    const boxH = isCompact ? 26 : 30;

    const isUpper = UPPER_SLOTS.has(slot);
    const targetY = isUpper
      ? Math.max(sy + 42, drawY - (isCompact ? 12 : 16))
      : Math.min(sy + stageH - 28, drawY + drawH + (isCompact ? 12 : 16));

    labelInputs.push({
      id: slot,
      x: px,
      y: targetY,
      width: boxW,
      height: boxH,
      priority: payload.highlightedSlot === slot ? 3 : 1,
    });
  }

  const resolvedLabels = resolveLabelPositions(
    labelInputs,
    {
      minX: sx + 8,
      minY: sy + 30,
      maxX: sx + stageW - 8,
      maxY: sy + stageH - 12,
    },
    isCompact ? 4 : 8,
  );

  // Render animated callout leaders, interactive pins, and non-overlapping attachment tags
  for (const slot of slots) {
    const pin = pinScreenMap.get(slot);
    const box = resolvedLabels.get(slot);
    if (!pin || !box) continue;

    const isHighlighted = payload.highlightedSlot === slot;
    const isUpper = UPPER_SLOTS.has(slot);
    const connectY = isUpper ? box.y + box.height / 2 : box.y - box.height / 2;

    ctx.save();
    // Leader line from pin to callout tag
    ctx.strokeStyle = isHighlighted ? accent : 'rgba(148, 163, 184, 0.48)';
    ctx.lineWidth = isHighlighted ? 1.6 : 1;
    ctx.beginPath();
    ctx.moveTo(pin.px, pin.py);
    ctx.lineTo(box.x, connectY);
    ctx.stroke();

    // Interactive circular attachment pin on weapon
    if (isHighlighted) {
      const pulseR = 11 + Math.sin(time * 4.8) * 3.5;
      ctx.strokeStyle = `${accent}88`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(pin.px, pin.py, pulseR, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = isHighlighted ? accent : 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = isHighlighted ? '#FFFFFF' : 'rgba(226, 232, 240, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(pin.px, pin.py, isHighlighted ? 5.2 : 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Clean frosted callout plate
    const bx = box.x - box.width / 2;
    const by = box.y - box.height / 2;
    roundRect(ctx, bx, by, box.width, box.height, 7);
    ctx.fillStyle = isHighlighted ? 'rgba(14, 24, 38, 0.94)' : 'rgba(10, 15, 25, 0.82)';
    ctx.fill();
    ctx.strokeStyle = isHighlighted ? accent : 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = isHighlighted ? 1.4 : 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = `600 ${slotFontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = isHighlighted ? accent : 'rgba(148, 163, 184, 0.85)';
    ctx.textBaseline = 'top';
    ctx.fillText(SLOT_LABELS[slot], box.x, by + 4);

    ctx.font = `600 ${labelFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = isHighlighted ? '#FFFFFF' : '#E2E8F0';
    ctx.textBaseline = 'bottom';
    ctx.fillText(pin.name, box.x, by + box.height - 4);
    ctx.restore();
  }

  // Top-left gunsmith technical header inside studio frame
  ctx.font = `600 ${isCompact ? 9 : 10.5}px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(203, 213, 225, 0.74)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const gamePrefix = payload.gameTitle ? `${payload.gameTitle.toUpperCase()}  ·  ` : '';
  ctx.fillText(`${gamePrefix}${payload.caliber}  ·  CLICK PIN TO CYCLE`, sx + 14, sy + 12);

  ctx.restore();
  return hitboxes;
}
