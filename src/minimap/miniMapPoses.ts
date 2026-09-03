import { smoothStep } from "../world/blend";

export type MiniMapPose = {
  /** Metres behind the player, along the direction they face. */
  distanceBack: number;
  /** Metres above the player. */
  height: number;
  /** Half the ground the orthographic box covers. */
  halfExtent: number;
};

/** Default: over the shoulder, looking down at the player's back. */
const CHASE: MiniMapPose = { distanceBack: 14, height: 9, halfExtent: 18 };

/** Held: straight overhead, higher and wider so more of the world fits. */
const TOP: MiniMapPose = { distanceBack: 0, height: 90, halfExtent: 45 };

/** How long the slide between the two poses takes, in seconds. */
export const POSE_TRANSITION_SECONDS = 0.35;

/**
 * Pitch is derived, not configured: it is whatever angle points the camera at
 * the player from wherever the pose puts it. Change `height` or `distanceBack`
 * and the camera keeps looking at you.
 */
export function pitchFor(pose: MiniMapPose): number {
  if (pose.distanceBack <= 0.0001) return Math.PI / 2;
  return Math.atan2(pose.height, pose.distanceBack);
}

/**
 * Blends the two poses. `blend` is 0 at the chase pose and 1 overhead; it is
 * eased here so the slide starts and stops gently instead of snapping.
 */
export function blendPose(blend: number, out: MiniMapPose): number {
  const eased = smoothStep(0, 1, blend);
  out.distanceBack = mix(CHASE.distanceBack, TOP.distanceBack, eased);
  out.height = mix(CHASE.height, TOP.height, eased);
  out.halfExtent = mix(CHASE.halfExtent, TOP.halfExtent, eased);
  // Pitch is blended between the two end pitches rather than derived from the
  // blended pose, or it would swing too fast near the top.
  return mix(pitchFor(CHASE), pitchFor(TOP), eased);
}

export function createPose(): MiniMapPose {
  return { ...CHASE };
}

function mix(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}
