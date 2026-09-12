/**
 * Randomness the weather can repeat. Every draw is a hash of the world's seed
 * and where in time it is, so the weather at an hour is always the same —
 * which is what lets a forecast be read ahead, and a saved game come back to
 * the sky it left.
 */
const WORLD_SEED = 0x5eed1987;

/** A number from 0 up to 1, the same every time for the same inputs. */
export function hashed(a: number, b = 0, c = 0): number {
  let h = WORLD_SEED ^ Math.imul(a | 0, 0x27d4eb2d);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) ^ Math.imul(b | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) ^ Math.imul(c | 0, 0x9e3779b1);
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/**
 * A value that wanders smoothly between −1 and 1 as `position` moves, one
 * new random target per unit and eased between them: for things that drift
 * over days, like a warm spell or the way the wind blows.
 */
export function wandering(position: number, channel: number): number {
  const whole = Math.floor(position);
  const t = position - whole;
  const eased = t * t * (3 - 2 * t);
  const from = hashed(whole, channel, 7) * 2 - 1;
  const to = hashed(whole + 1, channel, 7) * 2 - 1;
  return from + (to - from) * eased;
}
