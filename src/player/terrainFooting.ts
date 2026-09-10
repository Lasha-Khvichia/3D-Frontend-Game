import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Ground } from "../world/terrain/Ground";
import { PLAYER_HEIGHT } from "./createPlayerBean";

/** Steepest ground that can be walked up: 48 degrees, as rise per metre. */
export const MAX_WALKABLE_RISE = Math.tan((48 * Math.PI) / 180);
/** How hard a slope too steep to stand on sheds the player, in metres per second squared. */
const SLIDE = 14;

/**
 * A settling move that ends further than this from the ground was stopped by
 * something. Tiny on purpose: an unobstructed move lands exactly, and anything
 * that caught the player — even a stone's edge a centimetre proud of the
 * ground — must be treated as what they are standing on.
 */
const STOPPED = 0.002;

const slope = { x: 0, z: 0 };
const settle = new Vector3();

/**
 * What the player turned out to be standing on after a move: nothing, a mesh
 * that caught them on the way down to the ground, or the ground itself.
 */
export type Footing = "above" | "onMesh" | "walkable" | "steep";

/**
 * Puts the feet back on the ground after a move, and says what kind of ground.
 *
 * The ground is never a collision mesh. It is read here, straight from the
 * height grid, and the player is lifted onto it. That is what removed the
 * creases, lips and invisible walls: Babylon's solver never has to resolve
 * the player against the ground and a rock at the same time.
 *
 * `glued` keeps the feet down walking downhill. Without it the player walks
 * off the brow of every hill into a tiny fall, because gravity cannot pull
 * them down as fast as the ground drops away. It is limited to a walkable
 * slope's worth of drop, so running off a real edge still falls.
 */
export function settleOnGround(
  ground: Ground,
  bean: AbstractMesh,
  glued: boolean,
  travelled: number,
): Footing {
  const { x, z } = bean.position;
  const floor = ground.heightAt(x, z);
  const feet = bean.position.y - PLAYER_HEIGHT / 2;
  const below = feet - floor;

  const lift = below < 0;
  const snap = glued && below <= travelled * MAX_WALKABLE_RISE + 0.05;
  if (!lift && !snap) return "above";

  // Through the solver, never set straight. Setting the height directly drops
  // the player through whatever lies between them and the ground: stepping
  // off the top of a stone pulled them down into its middle, and Babylon
  // collides with both sides of every face on a mesh with a material, so from
  // there every direction was a wall. Half the walks into a stone ended inside
  // it, measured. Moved with collisions, the stone catches them instead.
  bean.computeWorldMatrix(true);
  settle.set(0, floor - feet, 0);
  bean.moveWithCollisions(settle);
  // Stopped short: something is underfoot, and the feet stay where the solver
  // left them. Pushing them the last centimetre onto the ground would put them
  // inside that something — which is exactly how the player got into stones:
  // near its edge a stone rises only a centimetre out of the ground, and
  // setting the feet flat on the ground there put them a centimetre inside it.
  const missed = bean.position.y - PLAYER_HEIGHT / 2 - floor;
  if (missed > STOPPED) return "onMesh";
  ground.slopeAt(x, z, slope);
  return Math.hypot(slope.x, slope.z) > MAX_WALKABLE_RISE ? "steep" : "walkable";
}

/** Pushes the player down a slope they cannot stand on. */
export function slideDownhill(
  ground: Ground,
  bean: AbstractMesh,
  velocity: { x: number; z: number },
  seconds: number,
): void {
  ground.slopeAt(bean.position.x, bean.position.z, slope);
  const rise = Math.hypot(slope.x, slope.z) || 1;
  velocity.x -= (slope.x / rise) * SLIDE * seconds;
  velocity.z -= (slope.z / rise) * SLIDE * seconds;
}
