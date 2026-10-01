import { SETTLEMENTS } from "../houses/settlements";
import { awayFromRoad } from "../roads/offTheRoad";
import { treePlacements } from "../trees/treeLayout";
import type { Ground } from "../terrain/Ground";
import type { RockShape } from "./rockShape";

/** The player starts here, and should not start inside a stone. */
const SPAWN_CLEARANCE = 4;
/** Room to walk between a stone and a tree, and between two stones. */
const TREE_GAP = 2.5;
const ROCK_GAP = 2;
/** Stones only where the ground is gentle, so burying the rim hides all of it. */
const MAX_RISE = 0.3;

/** Metres of clear ground left between a stone and the edge of a road. */
const OFF_THE_ROAD = 1;

const slope = { x: 0, z: 0 };

/**
 * Whether a stone can go here without landing on something.
 *
 * Rejection sampling needs one predicate that knows everything already in the
 * world: settlements through their clearance, trees through their trunks,
 * water and hillsides through the ground, and other stones through what has
 * already been placed.
 */
export function roomForRock(
  shape: RockShape,
  placed: readonly RockShape[],
  ground: Ground,
): boolean {
  const { x, z, reach } = shape;
  if (Math.hypot(x, z) < SPAWN_CLEARANCE + reach) return false;
  if (ground.waterDepthAt(x, z) > 0 || ground.inlandAt(x, z) < 40) return false;
  ground.slopeAt(x, z, slope);
  if (Math.hypot(slope.x, slope.z) > MAX_RISE) return false;
  // A boulder in the road is a boulder somebody would have moved.
  if (awayFromRoad(x, z) < reach + OFF_THE_ROAD) return false;

  for (const settlement of SETTLEMENTS) {
    if (Math.hypot(settlement.centreX - x, settlement.centreZ - z) < settlement.clearance + reach)
      return false;
  }
  for (const tree of treePlacements()) {
    if (Math.hypot(tree.x - x, tree.z - z) < reach + TREE_GAP) return false;
  }
  for (const other of placed) {
    if (Math.hypot(other.x - x, other.z - z) < reach + other.reach + ROCK_GAP) return false;
  }
  return true;
}
