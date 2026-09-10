import { between, createSeededRandom, seedFromText } from "../houses/seededRandom";
import type { Ground } from "../terrain/Ground";
import { roomForRock } from "./roomForRock";
import { growRock, type RockShape } from "./rockShape";

/** How many loose stones the island holds. One number for the whole scatter. */
const BOULDER_COUNT = 420;
/** Rejection sampling gives up rather than looping for ever. */
const ATTEMPTS = 40000;
/** Stones are thrown at this square; the ground then decides which ones land. */
const SCATTER_HALF = 1250;

/**
 * Where the loose stones lie.
 *
 * From a seeded stream, so the same stones are in the same places on every
 * load. Thrown at the whole map and kept only where the ground has room for
 * them — dry, gentle, clear of houses and trees — so the scatter follows the
 * island's shape without having to know it.
 *
 * Each stone is grown up from the ground under its middle, which is why this
 * needs the terrain and cannot be worked out before the island exists.
 */
export function scatterBoulders(ground: Ground): RockShape[] {
  const random = createSeededRandom(seedFromText("boulders"));
  const placed: RockShape[] = [];

  for (let attempt = 0; attempt < ATTEMPTS && placed.length < BOULDER_COUNT; attempt += 1) {
    const x = between(random, -SCATTER_HALF, SCATTER_HALF);
    const z = between(random, -SCATTER_HALF, SCATTER_HALF);
    const stone = growRock(`stone-${placed.length}`, x, z, ground.heightAt(x, z));
    if (roomForRock(stone, placed, ground)) placed.push(stone);
  }
  return placed;
}
