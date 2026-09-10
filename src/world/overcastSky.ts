import type { Color3, Color4 } from "@babylonjs/core/Maths/math.color";

/**
 * Greys a sky colour toward what it looks like under cloud.
 *
 * An overcast sky keeps the brightness of the clear one and loses its colour:
 * the same light, scattered through cloud until nothing of the blue is left.
 * Applied to the horizon, it greys the fog too, which is what an overcast day
 * does to the distance.
 */
export function greyForOvercast(colour: Color3 | Color4, overcast: number): void {
  const grey = colour.r * 0.3 + colour.g * 0.59 + colour.b * 0.11;
  const share = Math.pow(overcast, 1.5) * 0.9;
  colour.r += (grey * 1.0 - colour.r) * share;
  colour.g += (grey * 1.03 - colour.g) * share;
  colour.b += (grey * 1.08 - colour.b) * share;
}
