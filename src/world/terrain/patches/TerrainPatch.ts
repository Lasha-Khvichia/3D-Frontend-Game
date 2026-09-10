import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { HeightGrid } from "../HeightGrid";
import { DEEP_SEA_FLOOR } from "../terrainConstants";
import { measurePatchError, measureSkirt } from "./patchError";
import { PATCH_CELLS } from "./patchSizes";

/**
 * One square of the terrain at one level of detail, and its four quarters one
 * level finer.
 *
 * Every patch knows up front how wrong it would look — its error — so the
 * choice of what to draw is a comparison, never a build. A parent's error
 * includes its children's, which is what makes the choice consistent: a
 * patch never looks good enough while a part of it does not.
 *
 * Only the mesh and whether it is split change after construction; they are
 * owned by `TerrainDetail`.
 */
export class TerrainPatch {
  /** Grid samples between neighbouring vertices of this patch's mesh. */
  readonly step: number;
  /** Grid cells the patch spans along each side. */
  readonly cells: number;
  readonly children: readonly TerrainPatch[] | null;
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
  readonly minY: number;
  readonly maxY: number;
  /** Lying wholly on the deep sea floor, where nothing needs drawing. */
  readonly empty: boolean;
  /** Metres, the worst gap between this patch's mesh and the true ground. */
  readonly error: number;
  /** Metres, how deep the strip hung from each edge must be. */
  readonly skirt: number;
  mesh: Mesh | null = null;
  /** Shown through its four children instead of its own mesh. */
  split = false;

  constructor(
    grid: HeightGrid,
    readonly level: number,
    readonly column: number,
    readonly row: number,
  ) {
    this.step = 1 << level;
    this.cells = PATCH_CELLS * this.step;
    const half = this.cells / 2;
    this.children =
      level === 0
        ? null
        : [0, 1, 2, 3].map(
            (quarter) =>
              new TerrainPatch(
                grid,
                level - 1,
                column + (quarter % 2) * half,
                row + Math.floor(quarter / 2) * half,
              ),
          );

    this.minX = grid.xOf(column);
    this.maxX = grid.xOf(column + this.cells);
    this.minZ = grid.zOf(row);
    this.maxZ = grid.zOf(row + this.cells);
    let lowest = Infinity;
    let highest = -Infinity;
    if (this.children) {
      for (const child of this.children) {
        lowest = Math.min(lowest, child.minY);
        highest = Math.max(highest, child.maxY);
      }
    } else {
      for (let r = row; r <= row + this.cells; r += 1) {
        for (let c = column; c <= column + this.cells; c += 1) {
          lowest = Math.min(lowest, grid.sample(c, r));
          highest = Math.max(highest, grid.sample(c, r));
        }
      }
    }
    this.minY = lowest;
    this.maxY = highest;
    this.empty = highest <= DEEP_SEA_FLOOR + 1;

    const own = measurePatchError(grid, column, row, this.cells, this.step);
    this.error = Math.max(own, ...(this.children ?? []).map((child) => child.error));
    this.skirt = measureSkirt(grid, column, row, this.cells);
  }

  /** Straight-line distance from a point to the nearest part of the patch. */
  distanceTo(x: number, y: number, z: number): number {
    const dx = Math.max(this.minX - x, 0, x - this.maxX);
    const dy = Math.max(this.minY - y, 0, y - this.maxY);
    const dz = Math.max(this.minZ - z, 0, z - this.maxZ);
    return Math.hypot(dx, dy, dz);
  }
}
