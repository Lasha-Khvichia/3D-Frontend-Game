import type { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * Whether two points are within `radius` of each other, ignoring height.
 *
 * A doorway is a place on the ground: whether you can reach it should not
 * change because you jumped.
 */
export function isWithin(a: Vector3, b: Vector3, radius: number): boolean {
  return Math.hypot(a.x - b.x, a.z - b.z) < radius;
}
