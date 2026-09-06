import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * Leans a direction over by `angle`, in the compass direction `azimuth`.
 *
 * Growing a branch needs a direction that is a known angle off its parent but
 * free to point anywhere around it. That cannot be done with world axes,
 * because a parent branch already points anywhere; it needs two axes at right
 * angles to the parent itself, built fresh each time.
 */
export function tiltDirection(direction: Vector3, angle: number, azimuth: number): Vector3 {
  const forward = direction.normalizeToNew();
  // Any axis not parallel to the branch will do to start the cross products.
  const seed = Math.abs(forward.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
  const right = Vector3.Cross(forward, seed).normalize();
  const up = Vector3.Cross(right, forward).normalize();

  const sideways = right.scale(Math.cos(azimuth)).addInPlace(up.scale(Math.sin(azimuth)));
  return forward
    .scale(Math.cos(angle))
    .addInPlace(sideways.scaleInPlace(Math.sin(angle)))
    .normalize();
}
