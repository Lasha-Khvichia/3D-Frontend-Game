import { Constants } from "@babylonjs/core/Engines/constants";
import { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";
import { RawTexture3D } from "@babylonjs/core/Materials/Textures/rawTexture3D";
import type { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { CloudWeather } from "./CloudWeather";

/**
 * What every material's cloud shadows read, written once a step by the sky.
 *
 * One shared object rather than a reference per material: the plugin is
 * attached to materials all over the world by Babylon itself, and each reads
 * the same sky.
 */
export const cloudShadowField = {
  /** The weather map, once built. Until then there is no cloud to cast anything. */
  weather: null as BaseTexture | null,
  /** The lumps clouds are made of, so a shadow has the shape of its cloud. */
  shape: null as BaseTexture | null,
  cover: 0,
  driftX: 0,
  driftZ: 0,
  rise: 0,
  /** Toward whichever of the sun and moon is lighting the island. */
  toward: new Vector3(0, 1, 0),
  /** 0 with clouds switched off; 1 with them on. */
  strength: 0,
};

let blank: RawTexture | null = null;
let blankVolume: RawTexture3D | null = null;

/** A 1×1 map with no cloud anywhere, bound until the real one arrives. */
export function noCloudTexture(scene: Scene): RawTexture {
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

/** A 1×1×1 volume of nothing, bound until the real shape noise arrives. */
export function noCloudVolume(scene: Scene): RawTexture3D {
  blankVolume ??= new RawTexture3D(
    new Uint8Array([0, 0, 0, 0]),
    1,
    1,
    1,
    Constants.TEXTUREFORMAT_RGBA,
    scene,
    false,
    false,
    Constants.TEXTURE_NEAREST_SAMPLINGMODE,
  );
  return blankVolume;
}

/** Copies this step's weather and light into the field every material reads. */
export function shareWithShadows(weather: CloudWeather, toward: Vector3, on: boolean): void {
  const field = cloudShadowField;
  field.cover = weather.cover;
  field.driftX = weather.drift.x;
  field.driftZ = weather.drift.z;
  field.rise = weather.rise;
  field.toward.copyFrom(toward);
  field.strength = on ? 1 : 0;
}
