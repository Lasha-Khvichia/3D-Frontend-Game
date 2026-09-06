import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";
import { FINE_DETAIL_LAYER } from "../fineDetailLayer";

const CAPACITY = 300;

/**
 * The flames in a hearth.
 *
 * Blended additively, so overlapping particles brighten each other the way real
 * flame does instead of stacking into flat orange. Gravity points *up*: fire is
 * hot gas, and the particles should accelerate away from the hearth rather than
 * drift and fall.
 *
 * Lifetimes are short and sizes vary a lot, which is what gives the licking
 * motion. A long-lived, uniform particle reads as a smoke plume, not a fire.
 */
export function createFireParticles(scene: Scene, at: Vector3, texture: Texture): ParticleSystem {
  const fire = new ParticleSystem(`fire-${at.x.toFixed(1)}-${at.z.toFixed(1)}`, CAPACITY, scene);
  fire.particleTexture = texture;
  fire.emitter = at;
  fire.minEmitBox = new Vector3(-0.3, 0, -0.14);
  fire.maxEmitBox = new Vector3(0.3, 0.03, 0.14);

  // Colour over each particle's life rather than a flat pair.
  //
  // Particles are densest at the point they are born, so starting them at full
  // strength piles opaque white into the bottom of the hearth however low the
  // alpha goes. Fading them in over the first quarter of their life spreads the
  // brightness up the flame, where it belongs.
  fire.addColorGradient(0, new Color4(1, 0.78, 0.36, 0));
  fire.addColorGradient(0.28, new Color4(1, 0.56, 0.13, 0.3));
  fire.addColorGradient(0.72, new Color4(0.86, 0.21, 0.04, 0.2));
  fire.addColorGradient(1, new Color4(0.3, 0.05, 0.01, 0));

  // Small and many. Large particles read as floating balls however they are
  // coloured; it is the overlap of dozens of small additive ones that looks
  // like flame.
  fire.minSize = 0.05;
  fire.maxSize = 0.19;
  // Tapers as it climbs, which is the shape of a flame.
  fire.addSizeGradient(0, 1);
  fire.addSizeGradient(1, 0.35);
  fire.minLifeTime = 0.45;
  fire.maxLifeTime = 1.05;
  fire.emitRate = 105;
  fire.blendMode = ParticleSystem.BLENDMODE_ONEONE;

  // Gravity points up: fire is hot gas, so particles should accelerate away
  // from the hearth rather than drift and fall.
  fire.gravity = new Vector3(0, 1.5, 0);
  fire.direction1 = new Vector3(-0.24, 1.1, -0.24);
  fire.direction2 = new Vector3(0.24, 1.9, 0.24);
  fire.minEmitPower = 0.3;
  fire.maxEmitPower = 0.8;
  fire.updateSpeed = 0.012;
  fire.minAngularSpeed = -1.6;
  fire.maxAngularSpeed = 1.6;

  // Sub-pixel on the mini-map, and it would only smear the map's colours.
  fire.layerMask = FINE_DETAIL_LAYER;
  fire.preventAutoStart = true;
  return fire;
}
