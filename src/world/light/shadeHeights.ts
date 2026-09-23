import { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";
import type { HeightGrid } from "../terrain/HeightGrid";
import { GRID_HALF_EXTENT, SEA_LEVEL } from "../terrain/terrainConstants";
import { SHADE_CELL, type ShadeHeights } from "./terrainShade";
import { SHADE_LOWEST, SHADE_RANGE, SHADE_SOFTNESS, terrainShadeField } from "./terrainShadeField";

/**
 * The island's heights every `SHADE_CELL` metres, for the shade to be worked
 * out on: the ground, or the sea's surface where that is higher, since the
 * water is what is drawn there.
 */
export function sampleShadeHeights(grid: HeightGrid): ShadeHeights {
  const size = Math.floor((GRID_HALF_EXTENT * 2) / SHADE_CELL) + 1;
  const heights = new Float32Array(size * size);
  const stride = SHADE_CELL / (grid.xOf(1) - grid.xOf(0));
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      heights[row * size + column] = Math.max(
        SEA_LEVEL,
        grid.sample(column * stride, row * stride),
      );
    }
  }
  return { heights, size };
}

/**
 * Shade heights into two bytes each, as `CatchMap` packs heights: every GPU
 * on both backends reads that, where float textures need extensions.
 */
export function packShade(shade: Float32Array, bytes: Uint8Array): void {
  for (let i = 0; i < shade.length; i += 1) {
    const share = Math.min(1, Math.max(0, (shade[i]! - SHADE_LOWEST) / SHADE_RANGE));
    const packed = Math.round(share * 65535);
    bytes[i * 4] = packed >> 8;
    bytes[i * 4 + 1] = packed & 255;
    bytes[i * 4 + 3] = 255;
  }
}

/**
 * How much light reaches a point at height `y`: 0 in a mountain's shadow to 1,
 * softened as the shader softens it.
 */
export function shadeLightAt(
  shade: Float32Array,
  size: number,
  x: number,
  z: number,
  y: number,
): number {
  const clamp = (value: number): number => Math.min(size - 1, Math.max(0, Math.round(value)));
  const column = clamp((x - terrainShadeField.originX) / SHADE_CELL);
  const height = shade[clamp((z - terrainShadeField.originZ) / SHADE_CELL) * size + column]!;
  return Math.min(1, Math.max(0, (y - height + SHADE_SOFTNESS) / SHADE_SOFTNESS));
}

/** The map's texture: read texel by texel and blended in the shader, since packed bytes cannot be. */
export function createShadeTexture(scene: Scene, bytes: Uint8Array, size: number): RawTexture {
  const nearest = Texture.NEAREST_SAMPLINGMODE;
  const texture = RawTexture.CreateRGBATexture(bytes, size, size, scene, false, false, nearest);
  texture.wrapU = Texture.CLAMP_ADDRESSMODE;
  texture.wrapV = Texture.CLAMP_ADDRESSMODE;
  return texture;
}
