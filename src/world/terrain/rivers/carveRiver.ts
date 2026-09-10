import { lerp, smoothStep } from "../../blend";
import type { HeightGrid } from "../HeightGrid";
import { SEA_LEVEL } from "../terrainConstants";
import { BANK_DROP, type RiverProfile } from "./riverProfile";
import type { RiverPoint } from "./traceRiver";
import type { WaterLevels } from "./WaterLevels";

/** How steeply the valley sides rise away from the water, as rise per metre. */
const VALLEY_RISE = 0.22;
/** River water is recorded this far past the channel edge, so the bank itself counts as shore. */
const SHORE = 2;

/**
 * Cuts a river into the height grid: a channel for the water, and a valley
 * either side of it for the channel to sit in.
 *
 * Only ever lowers the ground. A river that raised it would build a dyke
 * across every dip it crossed.
 *
 * Every grid sample near the river is measured against the nearest stretch of
 * it, and shaped by how far across the river it is: bed in the middle, bank
 * at the channel's edge, valley side beyond, and untouched ground past that.
 */
export function carveRiver(
  grid: HeightGrid,
  river: readonly RiverPoint[],
  profile: RiverProfile,
  water: WaterLevels,
): void {
  const nearest = findNearest(grid, river, profile);

  for (const [key, hit] of nearest) {
    const column = key % grid.size;
    const row = (key - column) / grid.size;
    const { distance, index } = hit;
    const width = profile.halfWidth[index] ?? 0;
    const surface = profile.surface[index] ?? 0;
    const bank = surface + BANK_DROP;
    const original = grid.sample(column, row);

    // The valley side, fading out to untouched ground at its outer edge so it
    // leaves no crease where the cutting stops. None right at the spring, where
    // the water comes out of the rock rather than out of a valley.
    const reach = profile.valley[index] ?? 0;
    let height = original;
    if (reach > 1) {
      const valley = bank + Math.max(0, distance - width) * VALLEY_RISE;
      const fade = 1 - smoothStep(width + reach * 0.6, width + reach, distance);
      height = lerp(original, Math.min(original, valley), fade);
    }

    if (distance < width) {
      // A rounded bed that meets the bank exactly at the channel's edge.
      const across = (distance / width) ** 2;
      const bed = surface - (profile.depth[index] ?? 0) * (1 - across) + BANK_DROP * across;
      height = Math.min(height, bed);
    }
    grid.setSample(column, row, height);

    if (distance < width + SHORE && surface > SEA_LEVEL) water.raise(column, row, surface);
  }
}

/** For every grid sample near the river, how far away it is and which point is closest. */
function findNearest(
  grid: HeightGrid,
  river: readonly RiverPoint[],
  profile: RiverProfile,
): Map<number, { distance: number; index: number }> {
  const nearest = new Map<number, { distance: number; index: number }>();
  const spacing = grid.xOf(1) - grid.xOf(0);
  river.forEach((point, index) => {
    const reach = (profile.halfWidth[index] ?? 0) + (profile.valley[index] ?? 0) + 1;
    const firstColumn = Math.floor((point.x - reach - grid.xOf(0)) / spacing);
    const firstRow = Math.floor((point.z - reach - grid.zOf(0)) / spacing);
    const span = Math.ceil((reach * 2) / spacing) + 1;
    for (let row = firstRow; row <= firstRow + span; row += 1) {
      for (let column = firstColumn; column <= firstColumn + span; column += 1) {
        if (column < 0 || row < 0 || column >= grid.size || row >= grid.size) continue;
        const distance = Math.hypot(grid.xOf(column) - point.x, grid.zOf(row) - point.z);
        if (distance > reach) continue;
        const key = row * grid.size + column;
        const best = nearest.get(key);
        if (!best || distance < best.distance) nearest.set(key, { distance, index });
      }
    }
  });
  return nearest;
}
