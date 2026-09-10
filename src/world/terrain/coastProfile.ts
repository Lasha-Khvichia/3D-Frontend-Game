import { smoothStep } from "../blend";
import {
  BEACH_WIDTH,
  DEEP_SEA_FLOOR,
  SEA_LEVEL,
  SHELF_DEPTH,
  SHELF_WIDTH,
} from "./terrainConstants";

/** Metres over which the seabed falls from the edge of the shelf to the deep. */
const DROP_OFF = 50;

/**
 * The height of the bare ground at a given distance inside the coast, before
 * any hill or mountain is added.
 *
 * Four bands, going out to sea:
 *
 * - **Land**, level at zero, which is where every settlement stands.
 * - **Beach**, easing down 2.5 m to the waterline over sixty metres.
 * - **Shelf**, a long shallow run out to sea, never deeper than a player can
 *   wade. This is what makes the edge of the world reachable on foot.
 * - **Drop-off**, then deep water nobody can reach.
 */
export function coastProfile(inside: number): number {
  if (inside >= BEACH_WIDTH) return 0;
  if (inside >= 0) return SEA_LEVEL * (1 - smoothStep(0, BEACH_WIDTH, inside));
  if (inside >= -SHELF_WIDTH) return SEA_LEVEL - SHELF_DEPTH * (-inside / SHELF_WIDTH);
  const shelfEdge = SEA_LEVEL - SHELF_DEPTH;
  const fall = smoothStep(0, DROP_OFF, -inside - SHELF_WIDTH);
  return shelfEdge + (DEEP_SEA_FLOOR - shelfEdge) * fall;
}
