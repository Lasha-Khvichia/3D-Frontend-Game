import { Constants } from "@babylonjs/core/Engines/constants";
import { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";
import { RawTexture3D } from "@babylonjs/core/Materials/Textures/rawTexture3D";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import type { Scene } from "@babylonjs/core/scene";
import { DETAIL_SIZE, SHAPE_SIZE, WEATHER_SIZE, type CloudNoise } from "./noise/buildCloudNoise";

export type CloudTextures = {
  readonly shape: RawTexture3D;
  readonly detail: RawTexture3D;
  readonly weather: RawTexture;
};

/**
 * Uploads the cloud noise to the GPU.
 *
 * Every texture repeats in every direction, which is what the noise was built
 * for, and is filtered linearly without mipmaps: the march samples each one a
 * hundred times a pixel at wildly different scales, and a mip chosen from
 * screen-space derivatives would be wrong for nearly all of them.
 */
export function createCloudTextures(scene: Scene, noise: CloudNoise): CloudTextures {
  const volume = (data: Uint8Array, size: number): RawTexture3D =>
    new RawTexture3D(
      data,
      size,
      size,
      size,
      Constants.TEXTUREFORMAT_RGBA,
      scene,
      false,
      false,
      Texture.BILINEAR_SAMPLINGMODE,
    );
  const shape = volume(noise.shape, SHAPE_SIZE);
  const detail = volume(noise.detail, DETAIL_SIZE);
  const weather = RawTexture.CreateRGBATexture(
    noise.weather,
    WEATHER_SIZE,
    WEATHER_SIZE,
    scene,
    false,
    false,
    Texture.BILINEAR_SAMPLINGMODE,
  );
  for (const texture of [shape, detail, weather] as BaseTexture[]) {
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    texture.wrapR = Texture.WRAP_ADDRESSMODE;
  }
  return { shape, detail, weather };
}
