import { smoothStep } from "../../blend";
import type { HeightGrid } from "../HeightGrid";
import { TRACE_STEP, type RiverPoint } from "./traceRiver";

/** How far into the hill the channel runs past the cave mouth, in the dark. */
export const INTO_HILL = 8;
/** The hill behind a spring: how far back its middle is, how wide, how tall. */
const HILL_BACK = 18;
const HILL_RADIUS = 20;
const HILL_HEIGHT = 11;
/**
 * Over how many metres of height difference the hill blends into the slope it
 * stands on. Taking the plain higher of the two leaves a crease along the line
 * where they cross — a hard edge down the side of the hill.
 */
const BLEND = 3;

/**
 * Carries a river a few metres back into the hill it rises from.
 *
 * The drawn course starts at the cave mouth. The water has to go on into the
 * dark behind it, or the channel would end at the arch in a hard edge — which
 * is exactly the river that "just stops suddenly".
 */
export function reachIntoHill(river: readonly RiverPoint[]): {
  points: RiverPoint[];
  mouth: number;
} {
  const first = river[0]!;
  const steps = Math.round(INTO_HILL / TRACE_STEP);
  const inside: RiverPoint[] = [];
  for (let step = steps; step >= 1; step -= 1) {
    const back = step * TRACE_STEP;
    inside.push({
      ...first,
      x: first.x - first.flowX * back,
      z: first.z - first.flowZ * back,
      along: 0,
    });
  }
  return { points: [...inside, ...river], mouth: steps };
}

/**
 * Raises a rocky hill behind a spring, so the water has somewhere to come out of.
 *
 * Only ever raises, and only where the ground is lower than the hill would be:
 * a spring already set into a steep mountainside gets almost nothing, one on a
 * gentle slope gets a proper face to emerge from. Steep enough that the terrain
 * paints it as rock rather than turf.
 */
export function raiseSpringHill(grid: HeightGrid, mouth: RiverPoint): void {
  const base = grid.heightAt(mouth.x, mouth.z);
  const centreX = mouth.x - mouth.flowX * HILL_BACK;
  const centreZ = mouth.z - mouth.flowZ * HILL_BACK;
  const spacing = grid.xOf(1) - grid.xOf(0);
  const firstColumn = Math.floor((centreX - HILL_RADIUS - grid.xOf(0)) / spacing);
  const firstRow = Math.floor((centreZ - HILL_RADIUS - grid.zOf(0)) / spacing);
  const span = Math.ceil((HILL_RADIUS * 2) / spacing) + 1;

  for (let row = firstRow; row <= firstRow + span; row += 1) {
    for (let column = firstColumn; column <= firstColumn + span; column += 1) {
      const away = Math.hypot(grid.xOf(column) - centreX, grid.zOf(row) - centreZ) / HILL_RADIUS;
      if (away >= 1) continue;
      const hill = base + HILL_HEIGHT * (1 - smoothStep(0.3, 1, away));
      grid.setSample(column, row, softMax(grid.sample(column, row), hill, BLEND));
    }
  }
}

/**
 * The higher of two heights, with the join rounded off over `blend` metres.
 * Never lower than the plain maximum, so it still only ever raises the ground.
 */
function softMax(a: number, b: number, blend: number): number {
  const overlap = Math.max(blend - Math.abs(a - b), 0) / blend;
  return Math.max(a, b) + (overlap * overlap * overlap * blend) / 6;
}
