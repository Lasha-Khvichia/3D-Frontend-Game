import type { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * The fastest a standing jump can steer itself to. Well under the 4.5 m/s walk:
 * stepping off the ground and then pressing forward has to read as a drift, not
 * as walking through the air.
 */
export const AIR_SPEED = 2;
/**
 * How hard the air can be pushed against, in metres per second squared. At 9 a
 * standing jump reaches the drift speed in a quarter of a second, out of the
 * 0.64 s it spends off the ground.
 */
const AIR_ACCELERATION = 9;

/**
 * Steers the player while they are off the ground, without letting them speed
 * up in a straight line.
 *
 * Only the part of the speed already pointing where the player is asking to go
 * counts against the limit. That one detail is what makes it feel right:
 *
 * - Jump from a standstill, press forward, and you creep up to 2 m/s.
 * - Jump while sprinting at 8 m/s and forward adds nothing, so the run carries
 *   through the whole jump instead of being braked to a drift.
 * - Press sideways in either case and you get the full 2 m/s of steering,
 *   because sideways is a direction you had no speed in.
 *
 * Momentum is never taken away here. Air braking belongs to the ground, and the
 * ground takes it back the instant the feet land.
 */
export function steerInAir(velocity: Vector3, dirX: number, dirZ: number, seconds: number): void {
  if (dirX === 0 && dirZ === 0) return;

  const alreadyGoingThatWay = velocity.x * dirX + velocity.z * dirZ;
  const room = AIR_SPEED - alreadyGoingThatWay;
  if (room <= 0) return;

  const push = Math.min(AIR_ACCELERATION * seconds, room);
  velocity.x += dirX * push;
  velocity.z += dirZ * push;
}
