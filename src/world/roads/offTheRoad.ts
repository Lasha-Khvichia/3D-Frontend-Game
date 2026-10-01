import { awayFrom, roadField, ROAD_HALF_WIDTH } from "./roadField";

/**
 * Metres from the nearest road's edge, or Infinity where no road has been
 * laid yet.
 *
 * Used by everything scattered over the island — trees, stones — to keep out
 * of the way. They are placed after the roads for exactly this reason: the
 * roads are worked out while the terrain is built, and a scatter that asked
 * before that would be told there were none.
 */
export function awayFromRoad(x: number, z: number): number {
  let nearest = Infinity;
  for (const segment of roadField.segments) {
    const half = segment.halfWidth ?? ROAD_HALF_WIDTH;
    const away = awayFrom(segment, x, z) - half;
    if (away < nearest) nearest = away;
  }
  return nearest;
}
