import { lerp, smoothStep } from "../blend";
import type { HeightGrid } from "./HeightGrid";

/** Ground below this is left exactly as grown. */
const FROM_HEIGHT = 40;
/** Over the next thirty metres up, the smoothing fades in to full strength. */
const FADE = 30;

/**
 * Takes the teeth off the mountain ridges.
 *
 * Ridged noise folds into sharp crests, and a sharp crest sampled every four
 * metres comes out as a row of spikes along the skyline. One pass of a
 * three-by-three average rounds them off.
 *
 * Only on high ground. The beach profile, the level ground under every
 * settlement and the gentle hills are left exactly as they were grown, so
 * nothing a house or a river depends on moves.
 */
export function smoothHighGround(grid: HeightGrid): void {
  const before = new Float32Array(grid.size * grid.size);
  for (let row = 0; row < grid.size; row += 1) {
    for (let column = 0; column < grid.size; column += 1) {
      before[row * grid.size + column] = grid.sample(column, row);
    }
  }
  const at = (column: number, row: number): number => {
    const c = Math.min(grid.size - 1, Math.max(0, column));
    const r = Math.min(grid.size - 1, Math.max(0, row));
    return before[r * grid.size + c] ?? 0;
  };

  for (let row = 0; row < grid.size; row += 1) {
    for (let column = 0; column < grid.size; column += 1) {
      const height = at(column, row);
      if (height < FROM_HEIGHT) continue;
      let sum = 0;
      for (let dr = -1; dr <= 1; dr += 1)
        for (let dc = -1; dc <= 1; dc += 1) sum += at(column + dc, row + dr);
      const share = smoothStep(FROM_HEIGHT, FROM_HEIGHT + FADE, height);
      grid.setSample(column, row, lerp(height, sum / 9, share));
    }
  }
}
