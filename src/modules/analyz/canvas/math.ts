export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function easeOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  return 1 - Math.pow(1 - c, 3);
}

export function easeInOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

export function quadBezierPoint(
  p0: [number, number],
  cp: [number, number],
  p1: [number, number],
  t: number,
): [number, number] {
  const mt = 1 - t;
  return [
    mt * mt * p0[0] + 2 * mt * t * cp[0] + t * t * p1[0],
    mt * mt * p0[1] + 2 * mt * t * cp[1] + t * t * p1[1],
  ];
}

export function computeCurveControlPoint(
  from: [number, number],
  to: [number, number],
  curveOffset: number,
): [number, number] {
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return [mx + nx * curveOffset, my + ny * curveOffset];
}

export function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.52);
  ctx.lineTo(-size * 0.72, 0);
  ctx.lineTo(-size, size * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawCurvedVector(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  curvePx: number,
  options: {
    color: string;
    dashed?: boolean;
    lineWidth?: number;
    time: number;
    speed?: number;
    label?: string;
    pulse?: boolean;
  },
): void {
  const cp = computeCurveControlPoint(from, to, curvePx);
  const { color, dashed = false, lineWidth = 2.2, time, speed = 28, label, pulse = true } = options;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  if (dashed) {
    ctx.setLineDash([7, 6]);
    ctx.lineDashOffset = -(time * speed);
  }
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.quadraticCurveTo(cp[0], cp[1], to[0], to[1]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Traveling highlight dot along curve
  if (pulse) {
    const pt = (time * 0.42) % 1;
    const [px, py] = quadBezierPoint(from, cp, to, pt);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(px, py, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tangent at t=1 for arrowhead
  const tx = to[0] - cp[0];
  const ty = to[1] - cp[1];
  const angle = Math.atan2(ty, tx);
  drawArrowhead(ctx, to[0], to[1], angle, 9.5, color);

  // Optional clean label at curve midpoint
  if (label) {
    const [lx, ly] = quadBezierPoint(from, cp, to, 0.5);
    ctx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
    const textW = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(7, 11, 19, 0.78)';
    roundRect(ctx, lx - textW / 2 - 6, ly - 17, textW + 12, 18, 5);
    ctx.fill();
    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, lx, ly - 8);
  }

  ctx.restore();
}

export function samplePolyline(
  points: [number, number][],
  progress: number,
): [number, number] {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];

  const segLengths: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
    segLengths.push(d);
    total += d;
  }
  if (total === 0) return points[0];

  const target = clamp(progress, 0, 1) * total;
  let accum = 0;
  for (let i = 0; i < segLengths.length; i++) {
    const len = segLengths[i];
    if (accum + len >= target || i === segLengths.length - 1) {
      const localT = len > 0 ? (target - accum) / len : 0;
      return [
        lerp(points[i][0], points[i + 1][0], localT),
        lerp(points[i][1], points[i + 1][1], localT),
      ];
    }
    accum += len;
  }
  return points[points.length - 1];
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
