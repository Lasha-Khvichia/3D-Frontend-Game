/** Metres a cell of the shade map spans: every second sample of the 4 m height grid. */
export const SHADE_CELL = 8;
/** Shade this little above the ground is left out: the map is coarser than the ground it shades. */
const SHADE_MARGIN = 1.5;
/** Stored where nothing shades a cell: below any ground, so nothing there is ever darkened. */
export const NO_SHADE = -10;

/** The island's heights at `SHADE_CELL` spacing, `size` a side, row by row from the corner. */
export type ShadeHeights = { readonly heights: Float32Array; readonly size: number };

/**
 * Fills `out` with each cell's shade height for a light in direction
 * `toward` (unit, y up): the height below which the terrain between that cell
 * and the light blocks it. Where no hill rises in the way it holds `NO_SHADE`.
 *
 * One pass from the side facing the light. A cell's shade is the higher of
 * its own ground and the shade of the cell one step nearer the light, lowered
 * by how far the light's ray drops over that step — read smoothly between the
 * two neighbouring cells, since the ray rarely runs along the grid.
 */
export function sweepShade(grid: ShadeHeights, toward: readonly number[], out: Float32Array): void {
  const { heights, size } = grid;
  const [tx = 0, ty = 1, tz = 0] = toward;
  const alongX = Math.abs(tx) >= Math.abs(tz);
  const major = alongX ? tx : tz;
  const minor = (alongX ? tz : tx) / Math.max(Math.abs(major), 1e-6);
  const toLight = major >= 0 ? 1 : -1;
  const drop = SHADE_CELL * Math.hypot(1, minor) * (ty / Math.max(Math.hypot(tx, tz), 1e-6));
  const at = (u: number, v: number): number => (alongX ? v * size + u : u * size + v);
  for (let step = 0; step < size; step += 1) {
    const u = toLight > 0 ? size - 1 - step : step;
    const upwind = u + toLight;
    for (let v = 0; v < size; v += 1) {
      const ground = heights[at(u, v)]!;
      let shade = ground;
      const across = v + minor;
      const low = Math.floor(across);
      if (upwind >= 0 && upwind < size && low >= 0 && low + 1 < size) {
        const t = across - low;
        const before = out[at(upwind, low)]! * (1 - t) + out[at(upwind, low + 1)]! * t;
        shade = Math.max(ground, before - drop);
      }
      out[at(u, v)] = shade;
    }
  }
  for (let i = 0; i < out.length; i += 1) {
    if (out[i]! - heights[i]! <= SHADE_MARGIN) out[i] = Math.min(out[i]!, NO_SHADE);
  }
}
