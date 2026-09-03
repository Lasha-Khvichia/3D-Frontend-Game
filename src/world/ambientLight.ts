import type { Light } from "@babylonjs/core/Lights/light";
import { lerp } from "./blend";
import type { TimeOfDayLighting } from "./timeOfDayPalette";

/** Share of the palette intensity the flat fill carries during the day. */
const DAY_SHARE = 0.4;
/** Sky glow on a moonless night. This is what stops the platform going black. */
const STARLIGHT = 0.22;
/** Extra sky glow a high moon adds on top of starlight. */
const MOONLIT_SKY = 0.16;
/** Night sky light is cool and blue, not a dimmed version of daylight. */
const NIGHT_COLOUR: readonly [number, number, number] = [0.45, 0.55, 0.85];

/**
 * The flat fill light.
 *
 * By day it follows the sky palette. By night it switches to a cool blue floor
 * that the moon lifts further, so the ground stays readable after dark.
 */
export function applyAmbientLight(
  light: Light,
  lighting: TimeOfDayLighting,
  sunAboveHorizon: number,
  moonAboveHorizon: number,
): void {
  const dayIntensity = lighting.lightIntensity * DAY_SHARE;
  const nightIntensity = STARLIGHT + MOONLIT_SKY * moonAboveHorizon;

  light.intensity = lerp(nightIntensity, dayIntensity, sunAboveHorizon);
  light.diffuse.r = lerp(NIGHT_COLOUR[0], lighting.lightColor.r, sunAboveHorizon);
  light.diffuse.g = lerp(NIGHT_COLOUR[1], lighting.lightColor.g, sunAboveHorizon);
  light.diffuse.b = lerp(NIGHT_COLOUR[2], lighting.lightColor.b, sunAboveHorizon);
}
