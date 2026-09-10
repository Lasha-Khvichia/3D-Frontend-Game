import type { TimeOfDayKeyframe } from "./timeOfDayKeyframe";

type Rgb = readonly [number, number, number];

/**
 * The colour of the sky through a day, and the key light that goes with it.
 * This is the table to edit when you want day or night to look different.
 *
 * Rows are keyed by how high the sun stands, not by the clock, because the
 * clock no longer says where the sun is: a winter sunset comes at 17:17 and a
 * summer one at 20:41, and each must look like a sunset. A winter noon, with
 * the sun only 22 degrees up, gets the paler sky and weaker light of a summer
 * mid-morning, as it should.
 *
 * The same height reads a little differently either side of noon — dawn cool
 * and clear, the evening golden — so there are two tables, and the sky slides
 * from the morning one to the evening one across the day.
 *
 * Rules: each table sorted by height, lowest first. Below its first row the
 * sky is that row, and above its last row, that one. Both tables share their
 * first and last rows, so midnight and noon join up without a seam.
 */
function keyframe(
  sunDegrees: number,
  background: Rgb,
  zenith: Rgb,
  lightColor: Rgb,
  lightIntensity: number,
): TimeOfDayKeyframe {
  return { sunDegrees, background, zenith, lightColor, lightIntensity };
}

const NIGHT = keyframe(-21, [0.004, 0.006, 0.02], [0.002, 0.003, 0.012], [0.3, 0.4, 0.7], 0.06);
const HIGH_SUN = keyframe(65, [0.29, 0.56, 0.85], [0.1, 0.3, 0.72], [1, 0.98, 0.94], 0.95);

// Columns: sun height in degrees, the horizon and fog, the sky overhead,
// the sunlight's colour, the sunlight's strength.
export const MORNING_KEYFRAMES: readonly TimeOfDayKeyframe[] = [
  NIGHT,
  keyframe(-18.5, [0.004, 0.008, 0.026], [0.002, 0.004, 0.016], [0.3, 0.4, 0.7], 0.07),
  keyframe(-8.5, [0.035, 0.055, 0.15], [0.016, 0.026, 0.09], [0.45, 0.45, 0.68], 0.15),
  keyframe(0, [0.18, 0.22, 0.42], [0.08, 0.12, 0.3], [1, 0.72, 0.55], 0.35),
  keyframe(14.5, [0.3, 0.52, 0.8], [0.13, 0.3, 0.66], [1, 0.94, 0.86], 0.7),
  HIGH_SUN,
];

export const EVENING_KEYFRAMES: readonly TimeOfDayKeyframe[] = [
  NIGHT,
  keyframe(-15.5, [0.01, 0.018, 0.08], [0.005, 0.009, 0.05], [0.32, 0.42, 0.72], 0.08),
  keyframe(-8.5, [0.02, 0.04, 0.18], [0.01, 0.02, 0.11], [0.35, 0.45, 0.75], 0.12),
  keyframe(0, [0.12, 0.16, 0.36], [0.05, 0.07, 0.24], [0.95, 0.6, 0.5], 0.3),
  keyframe(9.5, [0.23, 0.33, 0.56], [0.09, 0.16, 0.4], [1, 0.72, 0.48], 0.5),
  keyframe(30.5, [0.28, 0.52, 0.82], [0.11, 0.28, 0.68], [1, 0.96, 0.9], 0.85),
  HIGH_SUN,
];
