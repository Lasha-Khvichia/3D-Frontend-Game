import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import type { Scene } from "@babylonjs/core/scene";

/** A halo is all blur, so it needs far less resolution than the screen. */
const TEXTURE_SIZE = 512;
const BLUR_KERNEL = 96;
const INTENSITY = 1.6;

/**
 * Scene-wide glow. Every mesh with an emissive colour will bloom once this
 * exists, so keep emissive at black on anything that should not.
 */
export function createGlowLayer(scene: Scene): GlowLayer {
  const glow = new GlowLayer("celestial-glow", scene, {
    mainTextureFixedSize: TEXTURE_SIZE,
    blurKernelSize: BLUR_KERNEL,
  });
  glow.intensity = INTENSITY;
  return glow;
}
