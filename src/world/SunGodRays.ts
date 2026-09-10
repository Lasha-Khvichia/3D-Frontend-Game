import { VolumetricLightScatteringPostProcess } from "@babylonjs/core/PostProcesses/volumetricLightScatteringPostProcess";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { isNearView } from "./isNearView";

/** Half resolution. Rays are soft, so the shafts cost half as much for free. */
const RENDER_RATIO = 0.5;
/** Steps taken along each ray. More is smoother and slower. */
const SAMPLES = 60;
/** The look of the shafts. Exposure is scaled down by cloud across the sun. */
const LOOK = { exposure: 0.28, decay: 0.96, weight: 0.55, density: 0.92 };
/** Shafts stream in from a sun just past the screen's edge; past this, none reach it. */
const SHAFT_MARGIN = (25 * Math.PI) / 180;

/**
 * Shafts of sunlight streaming through the world. The sun disc is the emitter
 * and everything else renders black into the pass, so the world genuinely cuts
 * the rays. Detached whenever the sun is below the horizon or far from the
 * view — and detaching takes the occlusion target off the camera too: Babylon
 * keeps it in `camera.customRenderTargets`, where it went on redrawing the
 * world in black every frame, all night, for an effect no longer on screen.
 */
export class SunGodRays {
  private readonly effect: VolumetricLightScatteringPostProcess;
  /** The black-silhouette pass the shafts are traced through. */
  private readonly occlusion: RenderTargetTexture | null;
  private attached = false;
  private enabled = true;

  constructor(
    scene: Scene,
    private readonly camera: Camera,
    sunMesh: Mesh,
  ) {
    this.effect = new VolumetricLightScatteringPostProcess(
      "sun-god-rays",
      RENDER_RATIO,
      camera,
      sunMesh,
      SAMPLES,
      Texture.BILINEAR_SAMPLINGMODE,
      scene.getEngine(),
      false,
      scene,
    );
    Object.assign(this.effect, LOOK);
    this.occlusion =
      camera.customRenderTargets.find((target) => target.name === "volumetricLightScatteringMap") ??
      null;
    this.attached = true;
  }

  /** Leaves a mesh out of the occlusion pass: flat against something already in it, it cannot change the silhouette. */
  excludeFromOcclusion(mesh: AbstractMesh): void {
    this.effect.excludedMeshes.push(mesh);
  }

  /** Takes a mesh off the excluded list before it is thrown away: the pass searches it every frame. */
  forgetExcluded(mesh: AbstractMesh): void {
    const at = this.effect.excludedMeshes.indexOf(mesh);
    if (at !== -1) this.effect.excludedMeshes.splice(at, 1);
  }

  /** Weakens the shafts by the cloud across the sun: 1 clear, 0 behind thick cloud. */
  setCloudCover(through: number): void {
    this.effect.exposure = LOOK.exposure * through;
  }

  /** Turns the whole effect off, whatever the sun is doing. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Called every step with the direction towards the sun. */
  update(sun: Vector3): void {
    const wanted = this.enabled && sun.y > 0 && isNearView(this.camera, sun, SHAFT_MARGIN);
    if (wanted === this.attached) return;

    this.attached = wanted;
    const targets = this.camera.customRenderTargets;
    if (wanted) {
      this.camera.attachPostProcess(this.effect);
      if (this.occlusion && !targets.includes(this.occlusion)) targets.push(this.occlusion);
    } else {
      this.camera.detachPostProcess(this.effect);
      const at = this.occlusion ? targets.indexOf(this.occlusion) : -1;
      if (at !== -1) targets.splice(at, 1);
    }
  }

  dispose(): void {
    this.camera.detachPostProcess(this.effect);
    this.effect.dispose(this.camera);
  }
}
