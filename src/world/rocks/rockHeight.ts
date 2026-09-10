import { smoothStep } from "../blend";
import type { RockShape } from "./rockShape";

/**
 * How hard the lobes are blended where they overlap.
 *
 * Taking the highest lobe at each point would be the obvious way and leaves a
 * crease along every line where two of them cross, which is the hard edge this
 * shape exists to avoid. Raising them to a power, adding, and taking the root
 * rounds the join off instead.
 */
const BLEND = 6;

/**
 * How much of a lobe is flat top before it starts falling away.
 *
 * Without this a lobe is a bell curve, and a bell curve is a hill, not a rock:
 * the first version of this looked like a circus tent. Holding the top level
 * out to a third of the radius and dropping the rest over the remainder makes
 * the sides two to three times steeper for the same height.
 */
const CROWN = 0.34;

/** How far the surface wanders off the ideal shape. Smooth, so it adds no edges. */
const ROUGHNESS = 0.14;

/**
 * The height of the rock at a point, measured from the middle of the formation.
 *
 * A single height for every point, which is not a simplification: it is what
 * guarantees the rock has no overhangs, and an overhang is a shape the player
 * could get under and then not fall out of.
 */
export function rockHeightAt(shape: RockShape, offsetX: number, offsetZ: number): number {
  let total = 0;
  for (const lobe of shape.lobes) {
    const away = Math.hypot(offsetX - lobe.x, offsetZ - lobe.z) / lobe.radius;
    if (away >= 1) continue;
    // Level on top, and level again where it lands. Both ends matter: one
    // keeps the summit from being a spike, the other keeps the foot from
    // being a step you could trip over.
    const swell = 1 - smoothStep(CROWN, 1, away);
    total += (lobe.height * swell) ** BLEND;
  }
  if (total === 0) return 0;

  // Multiplied, not added, so the rim stays exactly on the ground and no
  // amount of roughness can lift the rock off it.
  const height = total ** (1 / BLEND);
  return height * (1 + ROUGHNESS * wobble(shape, offsetX, offsetZ));
}

/**
 * Smooth pseudo-random variation, between -1 and 1.
 *
 * Three sine waves at rising frequencies rather than real value noise: it is
 * a handful of operations, it is smooth in every derivative so it can never
 * introduce a crease, and it repeats at a scale far larger than any one rock.
 */
function wobble(shape: RockShape, offsetX: number, offsetZ: number): number {
  const seed = shape.seed;
  const x = offsetX / shape.reach;
  const z = offsetZ / shape.reach;
  // Amplitude falls off faster than frequency rises, because it is the two
  // multiplied together that decides how steep the surface gets locally.
  return (
    0.6 * Math.sin(4.1 * x + 3.3 * z + seed) +
    0.28 * Math.sin(9.5 * z - 7.1 * x + seed * 1.7) +
    0.12 * Math.sin(15.1 * x + 13.3 * z + seed * 2.9)
  );
}
