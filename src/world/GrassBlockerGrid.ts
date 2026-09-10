import type { GrassBlocker } from "./grassBlockers";

/** Metres along each side of one cell of the grid. */
const CELL = 4;

/**
 * Every blocker on the island, sorted by where it stands, so a blade asks
 * only the one or two near it. Asking all five hundred for every blade cost a
 * hundred million checks each time the grass was laid out.
 */
export class GrassBlockerGrid {
  private readonly cells = new Map<number, GrassBlocker[]>();

  constructor(blockers: readonly GrassBlocker[]) {
    for (const blocker of blockers) {
      const { minX, maxX, minZ, maxZ } = blocker.bounds;
      for (let cellZ = Math.floor(minZ / CELL); cellZ <= Math.floor(maxZ / CELL); cellZ += 1) {
        for (let cellX = Math.floor(minX / CELL); cellX <= Math.floor(maxX / CELL); cellX += 1) {
          const key = this.key(cellX, cellZ);
          const list = this.cells.get(key);
          if (list) list.push(blocker);
          else this.cells.set(key, [blocker]);
        }
      }
    }
  }

  /** Share of full height grass may grow to here: 1 in open ground, 0 inside something. */
  grassLeftAt(x: number, z: number): number {
    const list = this.cells.get(this.key(Math.floor(x / CELL), Math.floor(z / CELL)));
    if (!list) return 1;
    let left = 1;
    for (const blocker of list) left = Math.min(left, blocker.grassLeftAt(x, z));
    return left;
  }

  /** Cells are keyed by packing both indices into one number; the island is far smaller than the range. */
  private key(cellX: number, cellZ: number): number {
    return (cellX + 32768) * 65536 + (cellZ + 32768);
  }
}
