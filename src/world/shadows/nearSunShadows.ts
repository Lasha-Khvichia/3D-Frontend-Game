// Registers the scene component that actually renders the shadow maps.
// shadowGenerator does not pull this in, and without it shadows silently
// never appear: no error, no warning, just no shadow.
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";

/** Shadow map sides for High and Low: the box is small, so this is sharp without being expensive. */
const HIGH_MAP_SIZE = 1024;
const LOW_MAP_SIZE = 512;
/**
 * How far up-sun the shadow camera is parked from whatever it is focused on.
 * A directional light's position is only ever used for shadows, and it starts
 * at the world origin, which is underground.
 */
export const CAMERA_DISTANCE = 60;
/**
 * The shadow map's depth range. Bias is a fraction of this range, not a
 * distance, so leaving it loose makes the bias enormous in metres.
 */
const NEAR_Z = 1;
const FAR_Z = CAMERA_DISTANCE * 2.2;
/**
 * Side of the shadow box in metres, centred on the player. Fixed rather than
 * auto-fitted around the casters: auto-fitting resizes the box whenever a
 * caster moves in or out of it, and shadow sharpness visibly pops as it does.
 */
const FRUSTUM_SIZE = 48;
/** Pushes the depth test along the light, killing shadow acne: a fraction of the depth range, about 2.6 cm. */
const DEPTH_BIAS = 0.0002;
/** Same, but along the surface normal. Handles the near-grazing sun at dawn. */
export const NORMAL_BIAS = 0.02;
/** 0 is invisible, 1 is black. Real shadows are filled in by sky light. */
export const DARKNESS = 0.42;

/** The sun's shadows on Low and High: one map, one fixed box round the player. */
export function createNearShadows(sunLight: DirectionalLight, low: boolean): ShadowGenerator {
  const shadows = new ShadowGenerator(low ? LOW_MAP_SIZE : HIGH_MAP_SIZE, sunLight);
  // Percentage closer filtering: softens the edge by sampling around it.
  // Cheaper than blurring the whole map and it keeps contact points crisp.
  shadows.usePercentageCloserFiltering = true;
  shadows.filteringQuality = low ? ShadowGenerator.QUALITY_LOW : ShadowGenerator.QUALITY_MEDIUM;
  shadows.bias = DEPTH_BIAS;
  shadows.normalBias = NORMAL_BIAS;
  shadows.setDarkness(1 - DARKNESS);
  // A fixed box beats refitting: see FRUSTUM_SIZE. The depth range is ours,
  // not Babylon's: left undefined it falls back to the active camera's 0.1 to
  // 2000, and the bias is a fraction of that range, so 0.0008 became 1.6 m.
  sunLight.shadowFrustumSize = FRUSTUM_SIZE;
  sunLight.autoUpdateExtends = false;
  sunLight.autoCalcShadowZBounds = false;
  sunLight.shadowMinZ = NEAR_Z;
  sunLight.shadowMaxZ = FAR_Z;
  return shadows;
}
