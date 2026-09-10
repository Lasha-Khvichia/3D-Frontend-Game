import { GRID_HALF_EXTENT, GRID_SPACING } from "../terrainConstants";

/**
 * The height of river water at every point of the height grid, or minus
 * infinity where there is no river.
 *
 * The sea needs no table — it is the same height everywhere — but a river
 * runs downhill, so its surface is different at every point along it, and
 * "how deep is the water here" has to know which part of which river you are
 * standing in.
 */
export class WaterLevels {
  private readonly levels: Float32Array;

  constructor(private readonly size: number) {
    this.levels = new Float32Array(size * size).fill(-Infinity);
  }

  /** Raises the water at one grid sample, never lowers it. */
  raise(column: number, row: number, level: number): void {
    if (column < 0 || row < 0 || column >= this.size || row >= this.size) return;
    const index = row * this.size + column;
    if (level > (this.levels[index] ?? -Infinity)) this.levels[index] = level;
  }

  /** The river surface at a grid sample. */
  atSample(column: number, row: number): number {
    if (column < 0 || row < 0 || column >= this.size || row >= this.size) return -Infinity;
    return this.levels[row * this.size + column] ?? -Infinity;
  }

  /**
   * The river surface at a point, blended between the grid samples around it
   * that have water.
   *
   * Not the nearest sample. A river falls towards the sea, and stepping from
   * one sample to the next raised the level by up to half a metre at once —
   * which near a shallow spring pushed "how deep is it here" over the wading
   * limit for a single step, and stopped the player dead in the middle of
   * the stream. Samples with no water are left out of the blend rather than
   * counted as minus infinity.
   */
  surfaceAt(x: number, z: number): number {
    const gridX = (x + GRID_HALF_EXTENT) / GRID_SPACING;
    const gridZ = (z + GRID_HALF_EXTENT) / GRID_SPACING;
    const column = Math.floor(gridX);
    const row = Math.floor(gridZ);
    const acrossX = gridX - column;
    const acrossZ = gridZ - row;
    let sum = 0;
    let weight = 0;
    for (const [dc, dr, share] of [
      [0, 0, (1 - acrossX) * (1 - acrossZ)],
      [1, 0, acrossX * (1 - acrossZ)],
      [0, 1, (1 - acrossX) * acrossZ],
      [1, 1, acrossX * acrossZ],
    ] as const) {
      const level = this.atSample(column + dc, row + dr);
      if (level === -Infinity) continue;
      sum += level * share;
      weight += share;
    }
    return weight > 0 ? sum / weight : -Infinity;
  }
}
