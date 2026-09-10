/** Three frequencies of the same noise, loudest first. */
export function octaves(low: number, middle: number, high: number): number {
  return low * 0.625 + middle * 0.25 + high * 0.125;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function byte(value: number): number {
  return Math.round(clamp01(value) * 255);
}
