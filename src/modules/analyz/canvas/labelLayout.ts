export interface LabelBoxInput {
  id: string;
  /** Ideal center X of the label box */
  x: number;
  /** Ideal center Y of the label box */
  y: number;
  /** Box width in CSS pixels */
  width: number;
  /** Box height in CSS pixels */
  height: number;
  /** Higher priority labels resist displacement more strongly */
  priority?: number;
}

export interface ResolvedLabelBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  displaced: boolean;
}

export interface LabelBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Deterministic 2D bounding-box repulsion solver.
 * Automatically offsets colliding labels vertically/horizontally while clamping inside stage bounds
 * so player names, weapon attachment tags, map POIs, and MOBA callouts never overlap on desktop or mobile.
 */
export function resolveLabelPositions(
  inputs: LabelBoxInput[],
  bounds: LabelBounds,
  padding = 4,
  iterations = 14,
): Map<string, ResolvedLabelBox> {
  const nodes = inputs.map((item) => {
    const halfW = item.width / 2;
    const halfH = item.height / 2;
    const clampedX = Math.max(bounds.minX + halfW, Math.min(bounds.maxX - halfW, item.x));
    const clampedY = Math.max(bounds.minY + halfH, Math.min(bounds.maxY - halfH, item.y));
    return {
      id: item.id,
      origX: item.x,
      origY: item.y,
      x: clampedX,
      y: clampedY,
      width: item.width,
      height: item.height,
      priority: item.priority ?? 1,
    };
  });

  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        const minDx = (a.width + b.width) / 2 + padding;
        const minDy = (a.height + b.height) / 2 + padding;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = minDx - Math.abs(dx);
        const overlapY = minDy - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          moved = true;
          const totalP = a.priority + b.priority;
          const weightA = b.priority / totalP;
          const weightB = a.priority / totalP;

          // Prefer vertical separation when boxes are wider than tall (typical text labels)
          if (overlapY <= overlapX * 1.15) {
            const dir = dy === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dy);
            const push = overlapY + 0.8;
            a.y -= dir * push * weightA;
            b.y += dir * push * weightB;
          } else {
            const dir = dx === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dx);
            const push = overlapX + 0.8;
            a.x -= dir * push * weightA;
            b.x += dir * push * weightB;
          }

          // Re-clamp inside stage bounds
          a.x = Math.max(bounds.minX + a.width / 2, Math.min(bounds.maxX - a.width / 2, a.x));
          a.y = Math.max(bounds.minY + a.height / 2, Math.min(bounds.maxY - a.height / 2, a.y));
          b.x = Math.max(bounds.minX + b.width / 2, Math.min(bounds.maxX - b.width / 2, b.x));
          b.y = Math.max(bounds.minY + b.height / 2, Math.min(bounds.maxY - b.height / 2, b.y));
        }
      }
    }
    if (!moved) break;
  }

  const out = new Map<string, ResolvedLabelBox>();
  for (const n of nodes) {
    out.set(n.id, {
      id: n.id,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
      displaced: Math.hypot(n.x - n.origX, n.y - n.origY) > 6,
    });
  }
  return out;
}
