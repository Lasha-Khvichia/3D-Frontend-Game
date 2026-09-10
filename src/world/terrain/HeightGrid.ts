import { GRID_HALF_EXTENT, GRID_SPACING } from "./terrainConstants";

/**
 * The height of the whole world, sampled once on a square grid.
 *
 * Everything that needs the ground reads this: the terrain mesh, the player's
 * feet, the grass, the trees. That is the point of it. Reading the height
 * function directly would give the player a different surface from the one
 * drawn — the mesh is flat between its corners and the function is not — and
 * the difference shows up as feet sinking into hillsides or hovering off them.
 *
 * Heights between samples come from the same two triangles per cell that the
 * mesh draws, split along the same diagonal, so they match it exactly.
 */
export class HeightGrid {
  /** Samples along each side. */
  readonly size = (GRID_HALF_EXTENT * 2) / GRID_SPACING + 1;
  private readonly heights: Float32Array;

  constructor(sample: (x: number, z: number) => number) {
    this.heights = new Float32Array(this.size * this.size);
    for (let row = 0; row < this.size; row += 1) {
      for (let column = 0; column < this.size; column += 1) {
        this.heights[row * this.size + column] = sample(this.xOf(column), this.zOf(row));
      }
    }
  }

  xOf(column: number): number {
    return column * GRID_SPACING - GRID_HALF_EXTENT;
  }

  zOf(row: number): number {
    return row * GRID_SPACING - GRID_HALF_EXTENT;
  }

  /** The stored sample, clamped to the edge of the grid. */
  sample(column: number, row: number): number {
    const c = Math.min(this.size - 1, Math.max(0, column));
    const r = Math.min(this.size - 1, Math.max(0, row));
    return this.heights[r * this.size + c] ?? 0;
  }

  /** Overwrites one sample. Used by anything that carves the ground after it is grown. */
  setSample(column: number, row: number, height: number): void {
    if (column < 0 || row < 0 || column >= this.size || row >= this.size) return;
    this.heights[row * this.size + column] = height;
  }

  /** Height of the drawn surface at any point. */
  heightAt(x: number, z: number): number {
    const { column, row, acrossX, acrossZ } = this.locate(x, z);
    const corner = this.sample(column, row);
    const diagonal = this.sample(column + 1, row + 1);
    // The cell is split corner to diagonal. Which half the point is in decides
    // which third corner it is measured against.
    if (acrossX >= acrossZ) {
      const side = this.sample(column + 1, row);
      return corner + (side - corner) * acrossX + (diagonal - side) * acrossZ;
    }
    const side = this.sample(column, row + 1);
    return corner + (diagonal - side) * acrossX + (side - corner) * acrossZ;
  }

  /**
   * The slope of the drawn surface at a point: how many metres it rises for
   * each metre along x and along z. Constant across each triangle.
   */
  slopeAt(x: number, z: number, out: { x: number; z: number }): void {
    const { column, row, acrossX, acrossZ } = this.locate(x, z);
    const corner = this.sample(column, row);
    const diagonal = this.sample(column + 1, row + 1);
    if (acrossX >= acrossZ) {
      const side = this.sample(column + 1, row);
      out.x = (side - corner) / GRID_SPACING;
      out.z = (diagonal - side) / GRID_SPACING;
      return;
    }
    const side = this.sample(column, row + 1);
    out.x = (diagonal - side) / GRID_SPACING;
    out.z = (side - corner) / GRID_SPACING;
  }

  private locate(
    x: number,
    z: number,
  ): { column: number; row: number; acrossX: number; acrossZ: number } {
    const gridX = (x + GRID_HALF_EXTENT) / GRID_SPACING;
    const gridZ = (z + GRID_HALF_EXTENT) / GRID_SPACING;
    const column = Math.floor(gridX);
    const row = Math.floor(gridZ);
    return { column, row, acrossX: gridX - column, acrossZ: gridZ - row };
  }
}
