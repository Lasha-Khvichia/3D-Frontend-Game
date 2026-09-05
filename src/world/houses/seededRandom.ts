/**
 * A repeatable stream of random numbers.
 *
 * Decoration is scattered at startup, so it has to come out the same every
 * time. `Math.random()` would rebuild the village differently on every reload,
 * and a house you remember by the stone around its door would stop being that
 * house.
 *
 * This is mulberry32: one multiply, a few shifts, and a period long enough that
 * nothing here will ever see it repeat.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turns a name into a seed, so each house is scattered differently. */
export function seedFromText(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** A number between `low` and `high`. */
export function between(random: () => number, low: number, high: number): number {
  return low + random() * (high - low);
}
