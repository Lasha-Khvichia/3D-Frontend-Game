import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { DARKNESS, NORMAL_BIAS } from "./nearSunShadows";

/** Metres from the eye the Far shadows reach. Trees within this cast too (`Woodland.setShadowRange`). */
export const FAR_SHADOW_REACH = 150;
const MAP_SIZE = 1024;
const CASCADES = 3;
/** Metres round the player, and the heights, that every shadow caster in reach fits inside. */
const CASTERS_ACROSS = FAR_SHADOW_REACH + 40;
const LOWEST = -20;
const HIGHEST = 320;
const DEPTH_BIAS = 0.0004;

const low = new Vector3();
const high = new Vector3();

/**
 * The sun's shadows on Far: three maps, sharp close to the eye and coarser
 * further out, reaching 150 m. Stabilised, so edges do not swim as the view
 * turns. The box the casters fit in is ours, round the player: left to
 * Babylon it would grow to hold every house on the island, and the depth
 * precision near the eye would go with it.
 */
export function createFarShadows(sunLight: DirectionalLight): CascadedShadowGenerator {
  // No camera: Babylon keys a shadow generator by camera, and one given the
  // player's camera casts nothing seen through any other — the orbit view,
  // the mini-map. Without one, the cascades follow whichever camera draws.
  const shadows = new CascadedShadowGenerator(MAP_SIZE, sunLight, false);
  shadows.numCascades = CASCADES;
  shadows.shadowMaxZ = FAR_SHADOW_REACH;
  shadows.lambda = 0.8;
  shadows.stabilizeCascades = true;
  shadows.cascadeBlendPercentage = 0.1;
  shadows.usePercentageCloserFiltering = true;
  shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
  shadows.bias = DEPTH_BIAS;
  shadows.normalBias = NORMAL_BIAS;
  shadows.setDarkness(1 - DARKNESS);
  shadows.freezeShadowCastersBoundingInfo = true;
  return shadows;
}

/** Every step on Far: the box the casters fit in follows the player. */
export function followWithFarShadows(shadows: CascadedShadowGenerator, focus: Vector3): void {
  low.set(focus.x - CASTERS_ACROSS, LOWEST, focus.z - CASTERS_ACROSS);
  high.set(focus.x + CASTERS_ACROSS, HIGHEST, focus.z + CASTERS_ACROSS);
  shadows.shadowCastersBoundingInfo.reConstruct(low, high);
}
