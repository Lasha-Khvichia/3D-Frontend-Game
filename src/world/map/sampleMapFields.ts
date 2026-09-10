import type { Terrain } from "../terrain/Terrain";
import { GRID_SPACING, SEA_LEVEL } from "../terrain/terrainConstants";

/** Hills drawn steeper than they are, as mapmakers do, so gentle ground still reads. */
const RELIEF = 2.5;
/** Light from the north-west and above, the mapmaker's convention. */
const LIGHT = [-0.45, 0.75, 0.48] as const;

/**
 * What the map needs from each height sample, 4 m apart: whether a river
 * stands there, how lit the slope is, and how steep. Worked out once per
 * sample and blended between for each pixel, because each needs neighbours.
 */
export function sampleMapFields(terrain: Terrain): {
  river: Float32Array;
  shade: Float32Array;
  steepness: Float32Array;
} {
  const { grid } = terrain;
  const size = grid.size;
  const river = new Float32Array(size * size);
  const shade = new Float32Array(size * size);
  const steepness = new Float32Array(size * size);
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const at = row * size + column;
      const height = grid.sample(column, row);
      const water = terrain.rivers.water.atSample(column, row);
      river[at] = water > height + 0.05 && water > SEA_LEVEL + 0.3 ? 1 : 0;
      const riseX =
        (grid.sample(column + 1, row) - grid.sample(column - 1, row)) / (2 * GRID_SPACING);
      const riseZ =
        (grid.sample(column, row + 1) - grid.sample(column, row - 1)) / (2 * GRID_SPACING);
      steepness[at] = Math.hypot(riseX, riseZ);
      const length = Math.hypot(riseX * RELIEF, 1, riseZ * RELIEF);
      shade[at] =
        (-riseX * RELIEF * LIGHT[0] + LIGHT[1] - riseZ * RELIEF * LIGHT[2]) / length - LIGHT[1];
    }
  }
  return { river, shade, steepness };
}

/** A field read between its samples, straight-line in both directions. */
export function blendField(field: Float32Array, size: number, gx: number, gz: number): number {
  const c = Math.min(size - 2, Math.max(0, Math.floor(gx)));
  const r = Math.min(size - 2, Math.max(0, Math.floor(gz)));
  const fx = gx - c;
  const fz = gz - r;
  const low = field[r * size + c]! + (field[r * size + c + 1]! - field[r * size + c]!) * fx;
  const high =
    field[(r + 1) * size + c]! + (field[(r + 1) * size + c + 1]! - field[(r + 1) * size + c]!) * fx;
  return low + (high - low) * fz;
}
