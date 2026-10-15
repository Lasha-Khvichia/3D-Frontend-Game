import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { HandPlace } from "./handPlaces";

/** At rest: in the right hand, point up and a little forward, ready. */
export const SWORD_REST: HandPlace = {
  at: new Vector3(0.31, -0.36, 0.72),
  turn: new Vector3(0.62, -0.42, -0.4),
  scale: 0.58,
};

const at = new Vector3();
const turn = new Vector3();
const swinging = { at, turn, scale: SWORD_REST.scale };

/**
 * Where the blade is `progress` of the way through a swing: cocked back over
 * the right shoulder, cut forward and across, finished low on the left.
 *
 * Eased in and out, so the blade gathers speed and is fastest across the
 * middle, which is the moment it bites (`SwordSwing`).
 */
export function swordPose(progress: number): HandPlace {
  const eased = progress * progress * (3 - 2 * progress);
  // Forward lean peaks across the middle of the cut.
  const reach = Math.sin(progress * Math.PI);
  at.set(0.36 - 0.46 * eased, -0.2 - 0.18 * eased, 0.66 + 0.08 * reach);
  turn.set(0.2 + 1.05 * reach, -0.25 * reach, -0.95 + 2.55 * eased);
  return swinging;
}
