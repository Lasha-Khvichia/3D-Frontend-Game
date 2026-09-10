// Registers Scene.pickWithRay, which is otherwise a stub that throws.
import "@babylonjs/core/Culling/ray";
import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import { PLAYER_HEIGHT } from "./createPlayerBean";

/**
 * How level the ground has to be to stand on it: about 48 degrees.
 *
 * Measured as how much of the surface's normal points straight up, so 1 is
 * flat and 0 is a wall. House roofs are 37 degrees and stay walkable, which is
 * the one existing surface this must not break.
 */
const MIN_UPWARDNESS = 0.67;
/** How far past the feet to look for the ground the collider just stopped us on. */
const PROBE = 0.45;

const down = new Vector3(0, -1, 0);

/**
 * Whether the surface under the player can be stood on, or is too steep and
 * should be slid off.
 *
 * Babylon's solver has no idea about slopes. Left alone it will happily let a
 * player walk straight up a sixty-degree rock face, because all it does is
 * push the movement along whatever it hits. This is the check that says no.
 *
 * The sign of the normal is not trusted — a face's winding decides which way
 * it points, and this is asked about meshes built in several different places.
 * How far the surface leans is the same question either way round.
 */
export function isStandable(scene: Scene, bean: AbstractMesh): boolean {
  const solid = (mesh: AbstractMesh): boolean => mesh.checkCollisions && mesh !== bean;
  const from = new Vector3(bean.position.x, bean.position.y, bean.position.z);
  const hit = scene.pickWithRay(new Ray(from, down, PLAYER_HEIGHT / 2 + PROBE), solid);
  if (!hit?.hit) return true;

  const normal = hit.getNormal(true, false);
  // No normal means a mesh without the data to give one. Assume it is footing
  // rather than dropping the player through a floor that was working before.
  return !normal || Math.abs(normal.y) >= MIN_UPWARDNESS;
}
