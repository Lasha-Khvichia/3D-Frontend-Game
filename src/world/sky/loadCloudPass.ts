import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Scene } from "@babylonjs/core/scene";
import type { CloudLighting } from "./bindCloudUniforms";
import { CloudPass } from "./CloudPass";
import { cloudShadowField } from "./cloudShadowField";
import type { CloudWeather } from "./CloudWeather";
import { createCloudTextures } from "./createCloudTextures";
import { loadCloudNoise } from "./noise/loadCloudNoise";

/**
 * Builds the clouds once the worker has made their noise, and hands the same
 * noise to the weather and the cloud shadows. Null if the noise cannot be
 * built: a sky without clouds is still a sky, so it says why and carries on.
 */
export async function loadCloudPass(
  scene: Scene,
  view: () => Camera,
  weather: CloudWeather,
  lighting: CloudLighting,
): Promise<CloudPass | null> {
  try {
    const noise = await loadCloudNoise();
    const textures = createCloudTextures(scene, noise);
    weather.setNoise(noise);
    cloudShadowField.weather = textures.weather;
    cloudShadowField.shape = textures.shape;
    return new CloudPass(scene, view, textures, weather, lighting);
  } catch (error: unknown) {
    console.warn("Clouds are off: their noise could not be built.", error);
    return null;
  }
}
