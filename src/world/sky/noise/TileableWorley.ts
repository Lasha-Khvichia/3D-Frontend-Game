import { createSeededRandom } from "../../houses/seededRandom";

/**
 * Worley noise — distance to the nearest of a scatter of points, one per
 * cell — made to tile, in three dimensions or two.
 *
 * Inverted, it is a field of soft round bubbles packed against each other,
 * which is the billowing, cauliflower edge of a cumulus cloud. Perlin noise
 * alone gives smoke; this is what makes it read as cloud.
 */
export class TileableWorley {
  private readonly points: Float32Array;

  constructor(
    readonly cells: number,
    seed: number,
    private readonly dimensions: 2 | 3 = 3,
  ) {
    const random = createSeededRandom(seed);
    const count = cells ** dimensions * dimensions;
    this.points = Float32Array.from({ length: count }, () => random());
  }

  /** 1 at a point, falling to 0 a cell away from it. For a point in [0, 1) of the tile. */
  at(x: number, y: number, z = 0): number {
    const { cells } = this;
    const px = x * cells;
    const py = y * cells;
    const pz = this.dimensions === 3 ? z * cells : 0;
    const cellX = Math.floor(px);
    const cellY = Math.floor(py);
    const cellZ = Math.floor(pz);
    const reachZ = this.dimensions === 3 ? 1 : 0;
    let nearest = 9;
    for (let dz = -reachZ; dz <= reachZ; dz += 1) {
      const wz = (cellZ + dz + cells) % cells;
      for (let dy = -1; dy <= 1; dy += 1) {
        const wy = (cellY + dy + cells) % cells;
        for (let dx = -1; dx <= 1; dx += 1) {
          const wx = (cellX + dx + cells) % cells;
          const at = ((wz * cells + wy) * cells + wx) * this.dimensions;
          const ox = cellX + dx + this.points[at]! - px;
          const oy = cellY + dy + this.points[at + 1]! - py;
          const oz = this.dimensions === 3 ? cellZ + dz + this.points[at + 2]! - pz : 0;
          nearest = Math.min(nearest, ox * ox + oy * oy + oz * oz);
        }
      }
    }
    return Math.max(0, 1 - Math.sqrt(nearest));
  }
}
