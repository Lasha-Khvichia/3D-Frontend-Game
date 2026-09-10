import type { HeightGrid } from "../HeightGrid";
import { COARSEST_LEVEL } from "./patchSizes";

/**
 * The furthest the mesh of a patch strays from the true ground anywhere
 * inside it, in metres.
 *
 * A patch with cells `step` samples wide only has vertices on every
 * `step`-th sample; between them it is flat, split on the same diagonal the
 * full grid uses. Every sample it skips is measured against that surface.
 */
export function measurePatchError(
  grid: HeightGrid,
  column: number,
  row: number,
  cells: number,
  step: number,
): number {
  if (step === 1) return 0;
  let worst = 0;
  for (let r = row; r <= row + cells; r += 1) {
    const cellRow = row + Math.min(Math.floor((r - row) / step), cells / step - 1) * step;
    const acrossZ = (r - cellRow) / step;
    for (let c = column; c <= column + cells; c += 1) {
      const cellColumn =
        column + Math.min(Math.floor((c - column) / step), cells / step - 1) * step;
      const acrossX = (c - cellColumn) / step;
      const corner = grid.sample(cellColumn, cellRow);
      const diagonal = grid.sample(cellColumn + step, cellRow + step);
      let flat: number;
      if (acrossX >= acrossZ) {
        const side = grid.sample(cellColumn + step, cellRow);
        flat = corner + (side - corner) * acrossX + (diagonal - side) * acrossZ;
      } else {
        const side = grid.sample(cellColumn, cellRow + step);
        flat = corner + (diagonal - side) * acrossX + (side - corner) * acrossZ;
      }
      worst = Math.max(worst, Math.abs(grid.sample(c, r) - flat));
    }
  }
  return worst;
}

/**
 * How deep the skirt under a patch's edges must hang, in metres.
 *
 * Two patches at different levels disagree along the edge they share: the
 * coarse one draws a straight line between its vertices where the fine one
 * follows every sample, and the slit between them shows the sky. Each edge
 * hangs a strip straight down to cover it. The gap can be no wider than the
 * two edges' own errors added together, so twice the worst edge error at any
 * level covers every neighbour this patch could ever have.
 */
export function measureSkirt(grid: HeightGrid, column: number, row: number, cells: number): number {
  const worst = Math.max(
    edgeError(grid, column, row, 1, 0, cells),
    edgeError(grid, column, row + cells, 1, 0, cells),
    edgeError(grid, column, row, 0, 1, cells),
    edgeError(grid, column + cells, row, 0, 1, cells),
  );
  return worst * 2 + 0.5;
}

/** The worst gap along one edge between the true ground and a straight line at any level. */
function edgeError(
  grid: HeightGrid,
  column: number,
  row: number,
  acrossColumns: number,
  acrossRows: number,
  cells: number,
): number {
  const at = (along: number): number =>
    grid.sample(column + acrossColumns * along, row + acrossRows * along);
  let worst = 0;
  for (let level = 1; level <= COARSEST_LEVEL; level += 1) {
    const step = 1 << level;
    for (let along = 0; along <= cells; along += 1) {
      const from = Math.floor(along / step) * step;
      const to = Math.min(from + step, cells);
      const straight =
        to === from ? at(from) : at(from) + ((at(to) - at(from)) * (along - from)) / (to - from);
      worst = Math.max(worst, Math.abs(at(along) - straight));
    }
  }
  return worst;
}
