import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import type { ShadowQuality } from "../../settings/gameSettings";
import { createFarShadows } from "./farSunShadows";
import { createNearShadows } from "./nearSunShadows";

/**
 * A sun's or moon's shadows at a quality other than off. `black` lets none of
 * the light into the shadow: right for the moon, whose shadows only the night
 * sky's glow fills.
 */
export function buildSkyShadows(
  light: DirectionalLight,
  quality: ShadowQuality,
  black: boolean,
): ShadowGenerator {
  const shadows =
    quality === "far" ? createFarShadows(light) : createNearShadows(light, quality === "low");
  if (black) shadows.setDarkness(0);
  return shadows;
}
