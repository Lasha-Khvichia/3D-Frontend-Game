import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Ground } from "../../world/terrain/Ground";

/** Metres between samples along the ray, and how many times the hit is halved down. */
const STRIDE = 0.08;
const REFINE = 6;
/** Look higher than this above the horizon and you are aiming at the sky. */
const AT_THE_SKY = 0.42;

const walked = new Vector3();

/**
 * The ground the player is working on: where they are looking, or as far that
 * way as they can reach.
 *
 * Marched against the height grid rather than picked with a ray, because the
 * ground is not a collision mesh and Babylon's picking finds nothing on it.
 *
 * **Where the look lands beyond `reach`, the target is pulled back to `reach`
 * along the same bearing.** Standing with the eye 1.6 m up, a point 1.5 m away
 * on the ground is 47 degrees below the horizon, so a strict reading would
 * mean stooping sharply before anything could be worked at all. The look
 * chooses the bearing; the reach chooses how far.
 */
export function lookAtGround(
  eye: Vector3,
  facing: Vector3,
  ground: Ground,
  reach: number,
  out: Vector3,
): Vector3 | null {
  if (facing.y > AT_THE_SKY) return null;
  const flat = Math.hypot(facing.x, facing.z);
  if (flat < 1e-3) return atGround(eye.x, eye.z, ground, out);

  const furthest = (reach / flat) * 1.2 + 0.5;
  let above = 0;
  for (let along = STRIDE; along <= furthest; along += STRIDE) {
    walked.copyFrom(facing).scaleInPlace(along).addInPlace(eye);
    if (walked.y <= ground.heightAt(walked.x, walked.z)) {
      const hit = settle(eye, facing, ground, above, along);
      if (Math.hypot(hit.x - eye.x, hit.z - eye.z) <= reach) {
        return atGround(hit.x, hit.z, ground, out);
      }
      break;
    }
    above = along;
  }
  // Looking past arm's length, or out over a drop: work the ground in front.
  return atGround(
    eye.x + (facing.x / flat) * reach,
    eye.z + (facing.z / flat) * reach,
    ground,
    out,
  );
}

function atGround(x: number, z: number, ground: Ground, out: Vector3): Vector3 {
  return out.set(x, ground.heightAt(x, z), z);
}

/** Halves the last step down until the point sits on the surface. */
function settle(
  eye: Vector3,
  facing: Vector3,
  ground: Ground,
  above: number,
  below: number,
): Vector3 {
  let near = above;
  let far = below;
  for (let pass = 0; pass < REFINE; pass += 1) {
    const middle = (near + far) / 2;
    walked.copyFrom(facing).scaleInPlace(middle).addInPlace(eye);
    if (walked.y <= ground.heightAt(walked.x, walked.z)) far = middle;
    else near = middle;
  }
  return walked.copyFrom(facing).scaleInPlace(far).addInPlace(eye);
}
