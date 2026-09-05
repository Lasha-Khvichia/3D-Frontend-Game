// Registers the scene component that actually renders the shadow maps.
// shadowGenerator does not pull this in, and without it shadows silently
// never appear: no error, no warning, just no shadow.
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { ShadowQuality } from "../settings/gameSettings";

/**
 * One caster in a tight frustum, so this is sharp without being expensive.
 * Raise it when the world has more in it.
 */
const HIGH_MAP_SIZE = 1024;
const LOW_MAP_SIZE = 512;

/**
 * How far up-sun the shadow camera is parked from whatever it is focused on.
 * A directional light's position is only ever used for shadows, and it starts
 * at the world origin, which is underground.
 */
const CAMERA_DISTANCE = 60;
/**
 * The shadow map's depth range. Bias is a fraction of this range, not a
 * distance, so leaving it loose makes the bias enormous in metres.
 */
const NEAR_Z = 1;
const FAR_Z = CAMERA_DISTANCE * 2.2;

/**
 * Side of the shadow box in metres, centred on the player.
 *
 * Fixed rather than auto-fitted around the casters. Auto-fitting resizes the
 * box whenever a caster moves in or out of it, and shadow sharpness visibly
 * pops as it does. A fixed box keeps one sharpness everywhere.
 */
const FRUSTUM_SIZE = 48;
/**
 * Pushes the depth test along the light direction, killing shadow acne.
 * Measured as a fraction of the depth range above, so about 2.6 cm.
 */
const DEPTH_BIAS = 0.0002;
/** Same, but along the surface normal. Handles the near-grazing sun at dawn. */
const NORMAL_BIAS = 0.02;
/** 0 is invisible, 1 is black. Real shadows are filled in by sky light. */
const DARKNESS = 0.42;

/**
 * Shadows cast by the sun.
 *
 * The shadow map is a whole extra render of every caster, so it is switched off
 * while the sun is below the horizon. Nothing is lit by it then anyway.
 */
export class SunShadows {
  private readonly generator: ShadowGenerator;
  private quality: ShadowQuality = "high";
  private focus: Vector3 | null = null;

  constructor(private readonly sunLight: DirectionalLight) {
    this.generator = new ShadowGenerator(HIGH_MAP_SIZE, sunLight);
    // Percentage closer filtering: softens the edge by sampling around it.
    // Cheaper than blurring the whole map and it keeps contact points crisp.
    this.generator.usePercentageCloserFiltering = true;
    this.generator.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
    this.generator.bias = DEPTH_BIAS;
    this.generator.normalBias = NORMAL_BIAS;
    this.generator.setDarkness(1 - DARKNESS);

    // A fixed box beats refitting: see FRUSTUM_SIZE above. The depth range is
    // ours, not Babylon's: left undefined it falls back to the active camera's
    // 0.1 to 2000, and the bias is a fraction of that range, so 0.0008 became
    // 1.6 metres of offset.
    sunLight.shadowFrustumSize = FRUSTUM_SIZE;
    sunLight.autoUpdateExtends = false;
    sunLight.autoCalcShadowZBounds = false;
    sunLight.shadowMinZ = NEAR_Z;
    sunLight.shadowMaxZ = FAR_Z;
  }

  /** "off" removes the whole shadow pass; the other two trade sharpness for cost. */
  setQuality(quality: ShadowQuality): void {
    this.quality = quality;
    if (quality === "off") return;
    this.generator.mapSize = quality === "low" ? LOW_MAP_SIZE : HIGH_MAP_SIZE;
    this.generator.filteringQuality =
      quality === "low" ? ShadowGenerator.QUALITY_LOW : ShadowGenerator.QUALITY_MEDIUM;
  }

  addCaster(mesh: AbstractMesh): void {
    this.generator.addShadowCaster(mesh);
  }

  removeCaster(mesh: AbstractMesh): void {
    this.generator.removeShadowCaster(mesh);
  }

  /**
   * The point the shadow camera follows. Holds the reference, so a moving
   * player keeps the shadow frustum around itself with nothing to plumb.
   */
  setFocus(point: Vector3): void {
    this.focus = point;
  }

  /** Called every step with how much of the sun is up, 0 to 1. */
  update(sunAboveHorizon: number): void {
    this.sunLight.shadowEnabled = this.quality !== "off" && sunAboveHorizon > 0;
    if (!this.sunLight.shadowEnabled || !this.focus) return;

    // Park the camera up-sun of the focus. Without this it sits at the origin
    // and the player drifts in and out of its depth range as they walk.
    this.sunLight.position
      .copyFrom(this.sunLight.direction)
      .scaleInPlace(-CAMERA_DISTANCE)
      .addInPlace(this.focus);
  }

  dispose(): void {
    this.generator.dispose();
  }
}
