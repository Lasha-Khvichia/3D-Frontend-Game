import { VolumetricLightScatteringPostProcess } from "@babylonjs/core/PostProcesses/volumetricLightScatteringPostProcess";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

/** Half resolution. Rays are soft, so the shafts cost half as much for free. */
const RENDER_RATIO = 0.5;
/** Steps taken along each ray. More is smoother and slower. */
const SAMPLES = 60;

const EXPOSURE = 0.28;
const DECAY = 0.96;
const WEIGHT = 0.55;
const DENSITY = 0.92;

/**
 * Shafts of sunlight streaming through the world.
 *
 * The sun disc is the emitter; everything else renders black into the pass, so
 * the platform edge and the player genuinely cut the rays. That occlusion is
 * the difference between this and a decal.
 *
 * Attached to one camera. It is detached whenever the sun is below the horizon,
 * which removes the pass entirely rather than running it for nothing.
 */
export class SunGodRays {
  private readonly effect: VolumetricLightScatteringPostProcess;
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
    this.effect.exposure = EXPOSURE;
    this.effect.decay = DECAY;
    this.effect.weight = WEIGHT;
    this.effect.density = DENSITY;
    this.attached = true;
  }

  /** Turns the whole effect off, whatever the sun is doing. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Called every step with the sun's height, -1 below the platform to 1 overhead. */
  update(sunHeight: number): void {
    const wanted = this.enabled && sunHeight > 0;
    if (wanted === this.attached) return;

    this.attached = wanted;
    if (wanted) this.camera.attachPostProcess(this.effect);
    else this.camera.detachPostProcess(this.effect);
  }

  dispose(): void {
    this.camera.detachPostProcess(this.effect);
    this.effect.dispose(this.camera);
  }
}
