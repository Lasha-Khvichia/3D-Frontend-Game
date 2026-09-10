import "@babylonjs/core/Shaders/postprocess.vertex";
import "@babylonjs/core/ShadersWGSL/postprocess.vertex";
import { Constants } from "@babylonjs/core/Engines/constants";
import { EffectWrapper } from "@babylonjs/core/Materials/effectRenderer";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture";
import type { Scene } from "@babylonjs/core/scene";
import { CLOUD_SAMPLERS, CLOUD_UNIFORMS } from "./bindCloudUniforms";
import { CLOUD_MARCH_GLSL } from "./shaders/cloudMarchGlsl";
import { CLOUD_MARCH_WGSL } from "./shaders/cloudMarchWgsl";

/**
 * The cloud march as a full-screen effect, in the language of whichever
 * backend is running. Both are written out rather than translated at run
 * time: Babylon can translate GLSL for WebGPU, but only by downloading two
 * compilers from its servers the first time, which would make the sky depend
 * on someone else's network.
 */
export function createCloudMarch(scene: Scene, steps: number, lightSteps: number): EffectWrapper {
  const engine = scene.getEngine();
  return new EffectWrapper({
    engine,
    name: "clouds",
    fragmentShader: engine.isWebGPU ? CLOUD_MARCH_WGSL : CLOUD_MARCH_GLSL,
    shaderLanguage: engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
    uniformNames: [...CLOUD_UNIFORMS],
    samplerNames: [...CLOUD_SAMPLERS],
    defines: [`#define STEPS ${steps}`, `#define LIGHT_STEPS ${lightSteps}`],
  });
}

/**
 * The two targets the march takes turns drawing into. Half-float where the
 * GPU can draw into it, because seven frames blended into eight-bit colour
 * band visibly in dark cloud.
 */
export function createCloudTargets(
  scene: Scene,
  width: number,
  height: number,
): RenderTargetTexture[] {
  const type = scene.getEngine().getCaps().textureHalfFloatRender
    ? Constants.TEXTURETYPE_HALF_FLOAT
    : Constants.TEXTURETYPE_UNSIGNED_BYTE;
  return [0, 1].map(
    (index) =>
      new RenderTargetTexture(`clouds-${index}`, { width, height }, scene, {
        type,
        samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
        generateDepthBuffer: false,
      }),
  );
}
