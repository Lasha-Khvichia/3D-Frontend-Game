import { createSeededRandom } from "../../houses/seededRandom";

/**
 * Perlin's improved gradient noise, made to tile.
 *
 * The lattice coordinates wrap at `period`, so a texture sampled from 0 to 1
 * joins its own far edge without a seam — which is what lets a 64-texel
 * volume repeat across a sky kilometres wide.
 */
export class TileablePerlin {
  private readonly perm = new Uint8Array(512);

  constructor(seed: number) {
    const random = createSeededRandom(seed);
    const order = Array.from({ length: 256 }, (_, index) => index);
    for (let index = 255; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [order[index], order[swap]] = [order[swap]!, order[index]!];
    }
    for (let index = 0; index < 512; index += 1) this.perm[index] = order[index & 255]!;
  }

  /** Noise from -1 to 1 at a point in lattice units, repeating every `period`. */
  at(x: number, y: number, z: number, period: number): number {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    const cellZ = Math.floor(z);
    const fx = x - cellX;
    const fy = y - cellY;
    const fz = z - cellZ;
    const u = fade(fx);
    const v = fade(fy);
    const w = fade(fz);
    const corner = (dx: number, dy: number, dz: number): number => {
      const hash = this.hash(cellX + dx, cellY + dy, cellZ + dz, period);
      return gradient(hash, fx - dx, fy - dy, fz - dz);
    };
    const bottom = lerp(
      lerp(corner(0, 0, 0), corner(1, 0, 0), u),
      lerp(corner(0, 1, 0), corner(1, 1, 0), u),
      v,
    );
    const top = lerp(
      lerp(corner(0, 0, 1), corner(1, 0, 1), u),
      lerp(corner(0, 1, 1), corner(1, 1, 1), u),
      v,
    );
    return lerp(bottom, top, w);
  }

  private hash(x: number, y: number, z: number, period: number): number {
    const wrap = (value: number): number => ((value % period) + period) % period;
    return this.perm[this.perm[this.perm[wrap(x)]! + wrap(y)]! + wrap(z)]!;
  }
}

/** One of the twelve edge directions of a cube, picked by the hash. */
function gradient(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
