import type { Color3 } from "@babylonjs/core/Maths/math.color";
import { clamp01, lerp } from "./blend";

/** Sun height at which the disc has finished turning from orange to white. */
const SUN_COLOUR_BLEND_HEIGHT = 0.4;
// Deliberately yellow, not white. The halo is added on top of a blue sky, so
// a white sun bleeds into blue. Holding the blue channel down keeps it warm.
const SUN_HORIZON_COLOUR: readonly [number, number, number] = [1.6, 0.55, 0.16];
const SUN_HIGH_COLOUR: readonly [number, number, number] = [1.62, 1.36, 0.62];

/** Orange near the horizon, white when high. Independent of the sky palette. */
export function paintSunDisc(colour: Color3, sunHeight: number): void {
  const blend = clamp01(sunHeight / SUN_COLOUR_BLEND_HEIGHT);
  colour.r = lerp(SUN_HORIZON_COLOUR[0], SUN_HIGH_COLOUR[0], blend);
  colour.g = lerp(SUN_HORIZON_COLOUR[1], SUN_HIGH_COLOUR[1], blend);
  colour.b = lerp(SUN_HORIZON_COLOUR[2], SUN_HIGH_COLOUR[2], blend);
}
