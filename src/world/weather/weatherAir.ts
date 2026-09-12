import type { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import { MIST_DENSITY, mistField } from "./HeightMistPlugin";
import { luminance } from "./weatherSky";

type Colour = Color3 | Color4;

/** Mist is white-grey, a touch cool. */
const MIST = [1, 1.02, 1.05] as const;

/**
 * The air's colours: the haze the sky's horizon colour, or the world sits in
 * grey smoke at midnight, and the ground mist white with the sky's light.
 */
export function paintAir(scene: Scene, horizon: Colour, mist: number): void {
  scene.fogColor.set(horizon.r, horizon.g, horizon.b);
  mistField.density = MIST_DENSITY * mist;
  mistyHaze(horizon, 1, mistField.colour);
}

/** The haze's colour: the horizon, whitened as mist thickens. Writes into `out`. */
function mistyHaze(horizon: Colour, mist: number, out: Color3): void {
  const glow = Math.min(1, luminance(horizon) * 1.15);
  out.r = horizon.r + (glow * MIST[0] - horizon.r) * mist;
  out.g = horizon.g + (glow * MIST[1] - horizon.g) * mist;
  out.b = horizon.b + (glow * MIST[2] - horizon.b) * mist;
}
