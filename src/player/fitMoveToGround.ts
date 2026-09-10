import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Ground } from "../world/terrain/Ground";
import { MAX_WADE_DEPTH } from "../world/terrain/terrainConstants";
import { PLAYER_HEIGHT } from "./createPlayerBean";
import { MAX_WALKABLE_RISE } from "./terrainFooting";

/** Water this deep slows walking to its slowest. */
const SLOWEST_AT_DEPTH = 1.1;
/** How much of normal speed is left wading at that depth. */
const SLOWEST_SHARE = 0.4;
/** Feet within this of the ground count as standing on it rather than above it. */
const AT_GROUND = 0.3;

const slope = { x: 0, z: 0 };

/**
 * Bends a horizontal move to fit the ground it is about to cross.
 *
 * Three rules, and all of them only while the feet are down at ground level —
 * on a bridge the water under the deck is somebody else's problem:
 *
 * - **Water slows you**, down to 40% at chest height.
 * - **Water too deep to wade stops you.** Wading further in is refused, and
 *   wading back out is always allowed, so nobody gets stranded.
 * - **A slope too steep to climb takes away the uphill part of the move** and
 *   leaves the rest, so walking into a mountainside turns into walking along
 *   it rather than stopping dead.
 */
export function fitMoveToGround(
  ground: Ground,
  bean: AbstractMesh,
  move: { x: number; z: number },
): void {
  const { x, y, z } = bean.position;
  const feet = y - PLAYER_HEIGHT / 2;
  if (feet - ground.heightAt(x, z) > AT_GROUND) return;

  const depth = ground.waterDepthAt(x, z);
  const wading = 1 - (1 - SLOWEST_SHARE) * Math.min(1, depth / SLOWEST_AT_DEPTH);
  move.x *= wading;
  move.z *= wading;

  const aheadDepth = ground.waterDepthAt(x + move.x, z + move.z);
  if (aheadDepth > MAX_WADE_DEPTH && aheadDepth > depth) {
    move.x = 0;
    move.z = 0;
    return;
  }

  ground.slopeAt(x + move.x, z + move.z, slope);
  const rise = Math.hypot(slope.x, slope.z);
  if (rise <= MAX_WALKABLE_RISE) return;
  const upX = slope.x / rise;
  const upZ = slope.z / rise;
  const uphill = move.x * upX + move.z * upZ;
  if (uphill <= 0) return;
  move.x -= upX * uphill;
  move.z -= upZ * uphill;
}
