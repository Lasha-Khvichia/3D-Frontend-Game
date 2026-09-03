/** Straight-line blend from `from` to `to`. */
export function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Like clamp01 across a range, but eased in and out instead of snapping. */
export function smoothStep(edgeFrom: number, edgeTo: number, value: number): number {
  const t = clamp01((value - edgeFrom) / (edgeTo - edgeFrom));
  return t * t * (3 - 2 * t);
}
