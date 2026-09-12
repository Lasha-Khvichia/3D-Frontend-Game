import type { InternalTexture } from "@babylonjs/core/Materials/Textures/internalTexture";
import type { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";
import type { Scene } from "@babylonjs/core/scene";
import { FOOT_BYTES, FOOT_TEXELS } from "./footprintStamps";

/** Room for one print, with margin: a step sends up 2 KB rather than the whole 590. */
export const BLOCK = 24;
export const blockRoom = (): Uint8Array => new Uint8Array(BLOCK * BLOCK * FOOT_BYTES);

/**
 * Sending one block of a texture up to the GPU. Both engines can do it; only
 * the type they share leaves it out, so it is named here rather than cast away.
 */
type SendsBlocks = {
  updateTextureData(
    texture: InternalTexture,
    data: ArrayBufferView,
    left: number,
    top: number,
    width: number,
    height: number,
  ): void;
};

/**
 * Sends up only the block round one print. The whole map is 590 KB, and a
 * walking player leaves a print every stride — the grass already taught this
 * game what sending a whole buffer for a small change costs.
 */
export function sendPrintBlock(
  scene: Scene,
  texture: RawTexture,
  data: Uint8Array,
  room: Uint8Array,
  column: number,
  row: number,
): void {
  const inner = texture.getInternalTexture();
  const engine = scene.getEngine() as unknown as Partial<SendsBlocks>;
  if (!inner || !engine.updateTextureData) return;
  const left = Math.min(FOOT_TEXELS - BLOCK, Math.max(0, column - BLOCK / 2));
  const top = Math.min(FOOT_TEXELS - BLOCK, Math.max(0, row - BLOCK / 2));
  engine.updateTextureData(
    inner,
    copyBlock(data, room, left, top, BLOCK, BLOCK),
    left,
    top,
    BLOCK,
    BLOCK,
  );
}

/** Lifts one rectangle of the map out, for sending up only what changed. */
function copyBlock(
  data: Uint8Array,
  into: Uint8Array,
  left: number,
  top: number,
  width: number,
  height: number,
): Uint8Array {
  for (let row = 0; row < height; row += 1) {
    const from = ((top + row) * FOOT_TEXELS + left) * FOOT_BYTES;
    into.set(data.subarray(from, from + width * FOOT_BYTES), row * width * FOOT_BYTES);
  }
  return into.subarray(0, width * height * FOOT_BYTES);
}
