import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { SKY_LAYER } from "./skyLayer";
import { DOME_VERTEX_GLSL } from "./shaders/skyShadersGlsl";
import { DOME_VERTEX_WGSL } from "./shaders/skyShadersWgsl";

export type DomeSpec = {
  readonly name: string;
  readonly radius: number;
  readonly fragment: { readonly glsl: string; readonly wgsl: string };
  readonly uniforms: readonly string[];
  readonly samplers: readonly string[];
  readonly blended: boolean;
};

/**
 * A sphere that stays centred on the eye, with a shader of its own — the sky,
 * or the veil the clouds are laid in.
 *
 * The vertex shader moves it to the camera, so Babylon's idea of where it is
 * would be wrong: it is always drawn rather than culled, and never picked,
 * lit, fogged, shadowed or collided with. Enough segments that its flat faces
 * stay within a few metres of the true radius, which is what keeps it in
 * front of or behind the sun as intended.
 */
export function createDome(scene: Scene, spec: DomeSpec): { mesh: Mesh; material: ShaderMaterial } {
  const mesh = CreateSphere(spec.name, { diameter: 2, segments: 48 }, scene);
  mesh.isPickable = false;
  mesh.alwaysSelectAsActiveMesh = true;
  mesh.layerMask = SKY_LAYER;
  mesh.applyFog = false;
  const webgpu = scene.getEngine().isWebGPU;
  const material = new ShaderMaterial(
    `${spec.name}-material`,
    scene,
    {
      vertexSource: webgpu ? DOME_VERTEX_WGSL : DOME_VERTEX_GLSL,
      fragmentSource: webgpu ? spec.fragment.wgsl : spec.fragment.glsl,
    },
    {
      attributes: ["position"],
      uniforms: ["viewProjection", "cameraPosition", "radius", ...spec.uniforms],
      samplers: [...spec.samplers],
      needAlphaBlending: spec.blended,
      shaderLanguage: webgpu ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
    },
  );
  material.backFaceCulling = false;
  material.setFloat("radius", spec.radius);
  mesh.material = material;
  return { mesh, material };
}
