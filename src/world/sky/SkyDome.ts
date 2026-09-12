import { Constants } from "@babylonjs/core/Engines/constants";
import type { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import type { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import type { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { CameraBasis } from "./CameraBasis";
import type { StarSky } from "./StarSky";
import { bindSkyPaint, SKY_UNIFORMS } from "./bindSkyPaint";
import { createDome } from "./createDomeMaterial";
import {
  SKY_FRAGMENT_GLSL,
  SKY_RADIUS,
  VEIL_FRAGMENT_GLSL,
  VEIL_RADIUS,
} from "./shaders/skyShadersGlsl";
import { SKY_FRAGMENT_WGSL, VEIL_FRAGMENT_WGSL } from "./shaders/skyShadersWgsl";

/** The colours the sky is painted with. Held by reference and updated in place. */
export type SkyPaint = {
  readonly horizon: Color3;
  readonly zenith: Color3;
  readonly sunDirection: Vector3;
  readonly sunGlow: Color3;
  /** The warm band along the horizon under a low sun. */
  readonly duskGlow: Color3;
  readonly stars: StarSky;
  /** How much of the clouds shows: 1, or less in fog thick enough to hide them. */
  cloudsShown: number;
};

/**
 * The sky and the clouds in it, as two spheres round the eye.
 *
 * The sky sits at 1,398 m, just inside the far plane and behind the sun and
 * moon at 1,390 m. The clouds are laid into a veil at 1,300 m — in front of
 * both, so a cloud passes over the sun, and behind everything on the island,
 * which the fog has fully hidden by 1,200 m.
 */
export class SkyDome {
  readonly sky: Mesh;
  readonly veil: Mesh;
  private readonly skyMaterial: ShaderMaterial;
  private readonly veilMaterial: ShaderMaterial;

  constructor(
    scene: Scene,
    private readonly paint: SkyPaint,
  ) {
    ({ mesh: this.sky, material: this.skyMaterial } = createDome(scene, {
      name: "sky",
      radius: SKY_RADIUS,
      fragment: { glsl: SKY_FRAGMENT_GLSL, wgsl: SKY_FRAGMENT_WGSL },
      uniforms: SKY_UNIFORMS,
      samplers: [],
      blended: false,
    }));
    bindSkyPaint(this.skyMaterial, paint);

    ({ mesh: this.veil, material: this.veilMaterial } = createDome(scene, {
      name: "cloud-veil",
      radius: VEIL_RADIUS,
      fragment: { glsl: VEIL_FRAGMENT_GLSL, wgsl: VEIL_FRAGMENT_WGSL },
      uniforms: ["camRight", "camUp", "camForward", "tanHalf", "cloudFade"],
      samplers: ["cloudSampler"],
      blended: true,
    }));
    // The clouds are traced with their light already multiplied by how solid they are.
    this.veilMaterial.alphaMode = Constants.ALPHA_PREMULTIPLIED;
    this.veilMaterial.disableDepthWrite = true;
    // First of everything see-through, so the sea and the smoke blend over the sky and not under it.
    this.veil.alphaIndex = 0;
    this.veil.setEnabled(false);
  }

  /** Lays this frame's clouds into the veil, or hides it when there are none. */
  showClouds(clouds: BaseTexture | null, view: CameraBasis): void {
    this.veil.setEnabled(clouds !== null);
    if (!clouds) return;
    this.veilMaterial.setTexture("cloudSampler", clouds);
    this.veilMaterial.setVector3("camRight", view.right);
    this.veilMaterial.setVector3("camUp", view.up);
    this.veilMaterial.setVector3("camForward", view.forward);
    this.veilMaterial.setVector2("tanHalf", view.tanHalf);
    this.veilMaterial.setFloat("cloudFade", this.paint.cloudsShown);
  }

  dispose(): void {
    this.sky.dispose();
    this.veil.dispose();
  }
}
