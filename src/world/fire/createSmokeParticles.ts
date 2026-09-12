import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { WeatherListener } from "../weather/weatherState";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";
import { FINE_DETAIL_LAYER } from "../fineDetailLayer";

const CAPACITY = 180;
/** Every chimney leans the same way, which is what makes it read as wind. */
/**
 * Which way every chimney's smoke drifts: the weather's wind, one vector
 * shared by them all. A particle system reads its gravity each frame, so
 * setting this moves every plume at once.
 */
const drift = new Vector3(0.42, 0.32, 0.2);

/** Follows the weather: in a 5 m/s wind smoke leans away at about 0.45 m/s. */
export const smokeWind: WeatherListener = {
  setWeather(weather) {
    drift.x = Math.sin(weather.heading) * 0.09 * weather.wind;
    drift.z = Math.cos(weather.heading) * 0.09 * weather.wind;
  },
};

/**
 * The smoke leaving a chimney.
 *
 * Everything about it is the opposite of the fire below: alpha blended rather
 * than additive so it darkens the sky instead of glowing, slow, long lived, and
 * growing as it goes. Smoke thins as it expands, so the particles fade out
 * while they swell.
 */
export function createSmokeParticles(scene: Scene, at: Vector3, texture: Texture): ParticleSystem {
  const smoke = new ParticleSystem(`smoke-${at.x.toFixed(1)}-${at.z.toFixed(1)}`, CAPACITY, scene);
  smoke.particleTexture = texture;
  smoke.emitter = at;
  smoke.minEmitBox = new Vector3(-0.14, 0, -0.14);
  smoke.maxEmitBox = new Vector3(0.14, 0.05, 0.14);

  // Pale and very translucent. Particles overlap heavily near the stack, so an
  // alpha that looks right on one particle stacks into solid black on twenty.
  smoke.color1 = new Color4(0.58, 0.56, 0.53, 0.3);
  smoke.color2 = new Color4(0.46, 0.45, 0.43, 0.2);
  smoke.colorDead = new Color4(0.45, 0.45, 0.45, 0);

  smoke.minSize = 0.3;
  smoke.maxSize = 0.55;
  // Grown over the particle's life, so a puff swells as it climbs.
  smoke.addSizeGradient(0, 0.32);
  smoke.addSizeGradient(1, 2.3);

  smoke.minLifeTime = 2.3;
  smoke.maxLifeTime = 4.2;
  smoke.emitRate = 18;
  smoke.blendMode = ParticleSystem.BLENDMODE_STANDARD;

  smoke.gravity = drift;
  smoke.direction1 = new Vector3(-0.16, 0.8, -0.16);
  smoke.direction2 = new Vector3(0.16, 1.25, 0.16);
  smoke.minEmitPower = 0.35;
  smoke.maxEmitPower = 0.8;
  smoke.updateSpeed = 0.02;
  smoke.minAngularSpeed = -0.4;
  smoke.maxAngularSpeed = 0.4;

  smoke.layerMask = FINE_DETAIL_LAYER;
  smoke.preventAutoStart = true;
  return smoke;
}
