import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { ShadowQuality } from "../settings/gameSettings";
import { buildSkyShadows } from "./shadows/buildSkyShadows";
import { followWithFarShadows } from "./shadows/farSunShadows";
import { CAMERA_DISTANCE } from "./shadows/nearSunShadows";

/**
 * Shadows cast by the sun, and by the moon once the sun is down: one fixed
 * box round the player on Low and High (`nearSunShadows.ts`), cascades out to
 * 150 m on Far (`farSunShadows.ts`). Each body has its own map, and only one
 * is ever drawn. Changing the level builds the other kind for both and hands
 * them every caster.
 *
 * A moon shadow is black: nothing but the night sky's glow lights what the
 * moon cannot reach, so a room under a roof stays dark. The sun's are filled
 * in by the day sky.
 */
export class SunShadows {
  private sun: ShadowGenerator;
  private moon: ShadowGenerator;
  private quality: ShadowQuality = "high";
  private focus: Vector3 | null = null;

  constructor(
    private readonly sunLight: DirectionalLight,
    private readonly moonLight: DirectionalLight,
  ) {
    this.sun = buildSkyShadows(sunLight, "high", false);
    this.moon = buildSkyShadows(moonLight, "high", true);
  }

  /** "off" removes the whole shadow pass; the others trade sharpness and reach for cost. */
  setQuality(quality: ShadowQuality): void {
    const was = this.quality;
    this.quality = quality;
    if (quality === "off" || quality === was) return;
    const casters = [...(this.sun.getShadowMap()?.renderList ?? [])];
    this.sun.dispose();
    this.moon.dispose();
    this.sun = buildSkyShadows(this.sunLight, quality, false);
    this.moon = buildSkyShadows(this.moonLight, quality, true);
    for (const mesh of casters) {
      this.sun.addShadowCaster(mesh, false);
      this.moon.addShadowCaster(mesh, false);
    }
  }

  addCaster(mesh: AbstractMesh): void {
    this.sun.addShadowCaster(mesh);
    this.moon.addShadowCaster(mesh);
  }

  removeCaster(mesh: AbstractMesh): void {
    this.sun.removeShadowCaster(mesh);
    this.moon.removeShadowCaster(mesh);
  }

  /**
   * The point the shadows follow. Holds the reference, so a moving player keeps
   * the shadows round itself with nothing to plumb.
   */
  setFocus(point: Vector3): void {
    this.focus = point;
  }

  /**
   * Called every step with how much of the sun is up, 0 to 1, and how strong
   * the moonlight is. A map is a whole extra render of every caster, so none
   * is drawn when neither body lights anything.
   */
  update(sunAboveHorizon: number, moonlight: number): void {
    const on = this.quality !== "off";
    this.sunLight.shadowEnabled = on && sunAboveHorizon > 0;
    this.moonLight.shadowEnabled = on && sunAboveHorizon <= 0 && moonlight > 0;
    const byDay = this.sunLight.shadowEnabled;
    const [light, shadows] = byDay ? [this.sunLight, this.sun] : [this.moonLight, this.moon];
    if (!light.shadowEnabled || !this.focus) return;
    if (shadows instanceof CascadedShadowGenerator)
      return followWithFarShadows(shadows, this.focus);
    // Park the camera toward the body from the focus. Without this it sits at
    // the origin and the player drifts in and out of its depth range as they walk.
    light.position.copyFrom(light.direction).scaleInPlace(-CAMERA_DISTANCE).addInPlace(this.focus);
  }

  dispose(): void {
    this.sun.dispose();
    this.moon.dispose();
  }
}
