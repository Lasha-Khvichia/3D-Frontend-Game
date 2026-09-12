import { Constants } from "@babylonjs/core/Engines/constants";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { CatchMap } from "./CatchMap";

/** One shader pair in both languages; the engine's backend picks which. */
export type FallingShaders = {
  readonly vertexGlsl: string;
  readonly fragmentGlsl: string;
  readonly vertexWgsl: string;
  readonly fragmentWgsl: string;
};

/**
 * The material drops and splashes are drawn with: added over the scene in
 * premultiplied colour, seen from both sides, never hiding what is behind it,
 * and reading where rain lands (`CatchMap.bindTo` each frame).
 */
export function createFallingMaterial(
  scene: Scene,
  name: string,
  shaders: FallingShaders,
  uniforms: readonly string[],
  defines: readonly string[],
  catchMap: CatchMap,
): ShaderMaterial {
  const webgpu = scene.getEngine().isWebGPU;
  const material = new ShaderMaterial(
    name,
    scene,
    {
      vertexSource: webgpu ? shaders.vertexWgsl : shaders.vertexGlsl,
      fragmentSource: webgpu ? shaders.fragmentWgsl : shaders.fragmentGlsl,
    },
    {
      attributes: ["position", "uv"],
      uniforms: ["viewProjection", "cameraPosition", "catchArea", "roofs", ...uniforms],
      samplers: ["catchMap"],
      defines: [...defines],
      needAlphaBlending: true,
      shaderLanguage: webgpu ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
    },
  );
  material.alphaMode = Constants.ALPHA_PREMULTIPLIED;
  material.disableDepthWrite = true;
  material.backFaceCulling = false;
  material.setTexture("catchMap", catchMap.texture);
  return material;
}
