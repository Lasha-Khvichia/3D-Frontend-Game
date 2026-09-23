import { Constants } from "@babylonjs/core/Engines/constants";
import { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";
import type { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import type { Scene } from "@babylonjs/core/scene";
import { GRID_HALF_EXTENT } from "../terrain/terrainConstants";

/** Shade heights go into 16 bits over this range: 6 mm steps, from under the sea to over the peaks. */
export const SHADE_LOWEST = -10;
export const SHADE_RANGE = 400;
/** Metres of height over which a point goes from shaded to lit, so a mountain's shadow has a soft edge. */
export const SHADE_SOFTNESS = 4;

/**
 * What every material's mountain shade reads, written by `TerrainShadeMap`
 * when a new map arrives. One shared object, as the cloud shadows use: the
 * plugin is on materials all over the world, and all read the same map.
 */
export const terrainShadeField = {
  map: null as BaseTexture | null,
  /** The map's corner — the height grid's — and cells along a side. */
  originX: -GRID_HALF_EXTENT,
  originZ: -GRID_HALF_EXTENT,
  size: 1,
  /** 0 with no map for the light that is up; 1 once there is. */
  strength: 0,
};

let blank: RawTexture | null = null;

/** A 1×1 map with no shade in it, bound until the first real one arrives. */
export function noShadeTexture(scene: Scene): RawTexture {
  blank ??= RawTexture.CreateRGBATexture(
    new Uint8Array([0, 0, 0, 255]),
    1,
    1,
    scene,
    false,
    false,
    Constants.TEXTURE_NEAREST_SAMPLINGMODE,
  );
  return blank;
}
