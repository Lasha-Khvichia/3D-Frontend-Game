import { createSeededRandom } from "../houses/seededRandom";

/** A smooth pseudo-random field, roughly between -1 and 1. */
export type Noise2D = (x: number, z: number) => number;

/** Eight directions round the compass; the corner gradients are drawn from these. */
const GRADIENT_X = [1, -1, 0, 0, 0.7071, -0.7071, 0.7071, -0.7071];
const GRADIENT_Z = [0, 0, 1, -1, 0.7071, 0.7071, -0.7071, -0.7071];
/** Stretches Perlin's natural range of about ±0.7 out to about ±1. */
const RANGE = 1.42;

/**
 * Perlin gradient noise in two dimensions, from a seed.
 *
 * Written here rather than pulled in as a library because it is thirty lines,
 * it runs half a million times while the island is built, and the seed has to
 * come from the same repeatable stream as everything else in the world — the
 * island must be the same island on every load.
 */
export function createNoise2D(seed: number): Noise2D {
  const random = createSeededRandom(seed);
  const order = Array.from({ length: 256 }, (_, index) => index);
  for (let index = 255; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [order[index], order[swap]] = [order[swap] ?? 0, order[index] ?? 0];
  }
  const table = new Uint8Array(512);
  for (let index = 0; index < 512; index += 1) table[index] = order[index & 255] ?? 0;

  const corner = (cellX: number, cellZ: number, offsetX: number, offsetZ: number): number => {
    const pick = (table[(table[cellX & 255] ?? 0) + (cellZ & 255)] ?? 0) & 7;
    return (GRADIENT_X[pick] ?? 0) * offsetX + (GRADIENT_Z[pick] ?? 0) * offsetZ;
  };

  return (x, z) => {
    const cellX = Math.floor(x);
    const cellZ = Math.floor(z);
    const insideX = x - cellX;
    const insideZ = z - cellZ;
    const easeX = fade(insideX);
    const easeZ = fade(insideZ);
    const low = mix(
      corner(cellX, cellZ, insideX, insideZ),
      corner(cellX + 1, cellZ, insideX - 1, insideZ),
      easeX,
    );
    const high = mix(
      corner(cellX, cellZ + 1, insideX, insideZ - 1),
      corner(cellX + 1, cellZ + 1, insideX - 1, insideZ - 1),
      easeX,
    );
    return mix(low, high, easeZ) * RANGE;
  };
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function mix(from: number, to: number, share: number): number {
  return from + (to - from) * share;
}
