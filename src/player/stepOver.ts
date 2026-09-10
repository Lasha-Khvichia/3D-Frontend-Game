import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

/**
 * The tallest thing the player walks over without thinking about it.
 *
 * Deliberately under the 0.5 m where a climb starts, so the two never argue
 * about the same ledge: below this you step, above it you press Space.
 */
export const STEP_HEIGHT = 0.4;
/** Getting less than this share of the movement asked for counts as blocked. */
const BLOCKED = 0.7;

/**
 * Walks the player over a low obstacle their feet caught on.
 *
 * **Babylon's collision solver has no step.** It slides movement along
 * whatever it hits, and the face of a kerb is vertical, so sliding along it
 * removes every bit of the forward motion. A six-centimetre lip stops a
 * sprint dead. Nothing in the game had one until the rock arrived, and every
 * rock has one where it meets the ground.
 *
 * So the move is tried a second time from a step higher, and the player is
 * dropped back down onto whatever they cleared. If the higher attempt gets no
 * further than the first, nothing happened and the first result stands.
 */
export function stepOver(
  bean: AbstractMesh,
  from: Vector3,
  wanted: Vector3,
  covered: number,
): boolean {
  const landed = new Vector3(bean.position.x, bean.position.y, bean.position.z);

  bean.position.set(from.x, from.y + STEP_HEIGHT, from.z);
  bean.computeWorldMatrix(true);
  bean.moveWithCollisions(new Vector3(wanted.x, 0, wanted.z));
  const reached = Math.hypot(bean.position.x - from.x, bean.position.z - from.z);
  if (reached <= covered + 1e-4) {
    bean.position.copyFrom(landed);
    return false;
  }

  // Back down onto the top of whatever was in the way. Nothing there means the
  // player simply arrives where they would have anyway, and falls next step.
  bean.computeWorldMatrix(true);
  bean.moveWithCollisions(new Vector3(0, -STEP_HEIGHT - 0.02, 0));
  return true;
}

/** Whether a move was stopped short by something rather than finished. */
export function wasBlocked(wanted: Vector3, covered: number): boolean {
  const asked = Math.hypot(wanted.x, wanted.z);
  return asked > 1e-4 && covered < asked * BLOCKED;
}
