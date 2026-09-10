import { lerp, smoothStep } from "../../blend";
import type { HeightGrid } from "../HeightGrid";
import { SEA_LEVEL } from "../terrainConstants";
import type { RiverCourse } from "./riverCourses";
import { TRACE_STEP, type RiverPoint } from "./traceRiver";
import * as size from "./riverSizes";

/** How far the water sits below the top of its banks. */
export const BANK_DROP = 0.35;
/** Everything about a river that depends on where along it you are. */
export type RiverProfile = {
  readonly surface: number[];
  readonly halfWidth: number[];
  readonly depth: number[];
  /** How far the valley reaches past the channel edge. None at the spring itself. */
  readonly valley: number[];
  /** The last point whose water is still above the sea's. */
  readonly landEnd: number;
  /** The point at the cave mouth. Points before it run on into the hill, in the dark. */
  readonly mouth: number;
};

/**
 * How high the water stands along a river, and how the channel grows from a
 * spring into a river.
 *
 * The level is the running minimum of the ground on the way down — **water
 * cannot flow uphill** — taken across the whole width of the water, not just
 * its middle: measured down the centre line, a river crossing a slope stands
 * higher than its own downhill bank and floats over the grass. Measured from
 * the cave mouth; inside the hill it stays level with the mouth.
 */
export function riverProfile(
  grid: HeightGrid,
  course: RiverCourse,
  river: readonly RiverPoint[],
  mouth: number,
): RiverProfile {
  const surface: number[] = [];
  const halfWidth: number[] = [];
  const valley: number[] = [];
  let lowest = Infinity;

  river.forEach((point, index) => {
    const fromSpring = Math.max(0, index - mouth) * TRACE_STEP;
    const width = lerp(
      size.SPRING_HALF_WIDTH,
      size.FULL_HALF_WIDTH,
      smoothStep(0, size.WIDEN_OVER, fromSpring),
    );
    halfWidth.push(width);
    valley.push(size.VALLEY * smoothStep(0, size.VALLEY_OPENS_OVER, fromSpring));
    if (index >= mouth) {
      const low = lowestAcross(grid, point, width + size.BANK_SEARCH);
      lowest = Math.min(lowest - size.LEAST_FALL * TRACE_STEP, low);
    }
    surface.push(lowest - BANK_DROP);
  });
  let landEnd = surface.findIndex((level, index) => index >= mouth && level <= SEA_LEVEL + 0.05);
  if (landEnd < 0) landEnd = surface.length - 1;

  // Working back up from the sea, the water may climb only so fast. Where the
  // ground rises faster the river stays low and cuts in, rather than tilting.
  for (let index = landEnd - 1; index >= mouth; index -= 1) {
    const cap = (surface[index + 1] ?? 0) + size.MOST_FALL * TRACE_STEP;
    surface[index] = Math.min(surface[index] ?? 0, cap);
  }
  for (let index = 0; index < mouth; index += 1) surface[index] = surface[mouth] ?? 0;

  const landLength = Math.max(1, landEnd - mouth) * TRACE_STEP;
  const depth = river.map((_, index) => {
    const share = Math.max(0, Math.min(1, (index - mouth) / Math.max(1, landEnd - mouth)));
    const nearFord = course.crossings.some(
      (crossing) =>
        crossing.kind === "ford" && Math.abs(crossing.at - share) * landLength < size.FORD_REACH,
    );
    if (nearFord) return size.FORD_DEPTH;
    const fromSpring = Math.max(0, index - mouth) * TRACE_STEP;
    return lerp(size.SPRING_DEPTH, size.CHANNEL_DEPTH, smoothStep(0, size.DEEPEN_OVER, fromSpring));
  });
  return { surface, halfWidth, depth, valley, landEnd, mouth };
}

/** The lowest ground under a river's cross-section: the middle, and both banks. */
function lowestAcross(grid: HeightGrid, point: RiverPoint, reach: number): number {
  let low = grid.heightAt(point.x, point.z);
  for (const share of [-1, -0.5, 0.5, 1]) {
    const x = point.x + point.flowZ * reach * share;
    const z = point.z - point.flowX * reach * share;
    low = Math.min(low, grid.heightAt(x, z));
  }
  return low;
}
