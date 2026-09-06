import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { Scene } from "@babylonjs/core/scene";

const SIZE = 64;

/**
 * A soft round dot, painted rather than downloaded.
 *
 * Every particle in the village uses this one texture. A hard-edged square
 * gives itself away instantly as a sprite; a dot that fades to nothing at its
 * rim reads as flame or smoke and lets particles pile up without showing seams.
 */
export function createSoftDotTexture(scene: Scene, name: string): DynamicTexture {
  const texture = new DynamicTexture(name, { width: SIZE, height: SIZE }, scene, false);
  const context = texture.getContext();
  const middle = SIZE / 2;

  const glow = context.createRadialGradient(middle, middle, 0, middle, middle, middle);
  glow.addColorStop(0, "rgba(255, 255, 255, 1)");
  glow.addColorStop(0.4, "rgba(255, 255, 255, 0.62)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, SIZE, SIZE);

  texture.update();
  texture.hasAlpha = true;
  return texture;
}
