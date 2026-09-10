import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import { moonDirectionAt, sunDirectionAt } from "./celestialPath";
import { createGlowLayer } from "./createGlowLayer";
import { createMoonTexture } from "./createMoonTexture";
import { createSunGlare, type SunGlare } from "./createSunGlare";
import { SunShadows } from "./SunShadows";
import { CELESTIAL_DISTANCE, createCelestialDisc, type CelestialDisc } from "./createCelestialDisc";
import type { TimeOfDayLighting } from "./timeOfDayPalette";
import type { ShadowQuality } from "../settings/gameSettings";
import { clamp01, lerp, smoothStep } from "./blend";

/**
 * 0.53 degrees across at the celestial distance, which is the sun's real
 * angular size from Earth. It is a pinpoint on purpose: the glare and the god
 * rays carry the effect, not the disc.
 */
const SUN_DIAMETER = 7.4;
const MOON_DIAMETER = 78;

/** Multiplies the palette intensity to get the sun's directional strength. */
const SUN_SHARE = 1.1;
const MOON_LIGHT_MAX = 0.42;

/** Height where a body's light starts and finishes fading at the horizon. */
const HORIZON_FADE_START = -0.05;
const HORIZON_FADE_END = 0.15;

/** Sun height at which the disc has finished turning from orange to white. */
const SUN_COLOUR_BLEND_HEIGHT = 0.4;
// Deliberately yellow, not white. The halo is added on top of a blue sky, so
// a white sun bleeds into blue. Holding the blue channel down keeps it warm.
const SUN_HORIZON_COLOUR: readonly [number, number, number] = [1.6, 0.55, 0.16];
const SUN_HIGH_COLOUR: readonly [number, number, number] = [1.62, 1.36, 0.62];
/** Lifts the whole moon texture. Emissive texture is added, not multiplied. */
const MOON_TEXTURE_LEVEL = 1.15;
const MOON_LIGHT_COLOUR: readonly [number, number, number] = [0.55, 0.65, 0.95];

/**
 * The sun and the moon: a directional light and a visible disc each.
 *
 * Both orbit continuously and are never hidden. Below the horizon they keep
 * travelling under the platform, so the cycle reads as one unbroken orbit.
 *
 * The moon runs on a 24 h 50 min lunar day against the sun's 24 h, so it slips
 * later every night and drifts through the whole cycle in 29.5 days.
 */
export class SunAndMoon {
  private readonly sunLight: DirectionalLight;
  private readonly moonLight: DirectionalLight;
  private readonly shadows: SunShadows;
  private readonly sunDisc: CelestialDisc;
  private readonly sunGlare: SunGlare;
  private readonly moonDisc: CelestialDisc;
  private readonly towardSun = new Vector3(0, 1, 0);
  private readonly towardMoon = new Vector3(0, 1, 0);
  private sunUp = 0;
  private moonUp = 0;
  /** Where the player is. The sky is drawn around them, not around the origin. */
  private focus: Vector3 | null = null;

  constructor(scene: Scene) {
    createGlowLayer(scene);

    this.sunLight = new DirectionalLight("sun-light", new Vector3(0, -1, 0), scene);
    this.sunLight.specular = Color3.Black();

    this.moonLight = new DirectionalLight("moon-light", new Vector3(0, -1, 0), scene);
    this.moonLight.diffuse = new Color3(...MOON_LIGHT_COLOUR);
    this.moonLight.specular = Color3.Black();

    this.shadows = new SunShadows(this.sunLight);

    this.sunDisc = createCelestialDisc(scene, { name: "sun-disc", diameter: SUN_DIAMETER });
    this.sunGlare = createSunGlare(scene);
    this.moonDisc = createCelestialDisc(scene, { name: "moon-disc", diameter: MOON_DIAMETER });
    // Babylon ADDS the emissive texture to the emissive colour. Black here is
    // what lets the dark maria in the texture actually read as dark.
    this.moonDisc.material.emissiveColor.set(0, 0, 0);
    const surface = createMoonTexture(scene);
    surface.level = MOON_TEXTURE_LEVEL;
    this.moonDisc.material.emissiveTexture = surface;

    // The sky is not in the haze. Fog is depth-based, and these sit 800 m out,
    // so without this the sun fades to sky colour and disappears.
    this.sunDisc.material.fogEnabled = false;
    this.sunGlare.material.fogEnabled = false;
    this.moonDisc.material.fogEnabled = false;
  }

  /** Height of the sun, -1 below the platform and 1 overhead. */
  get sunHeight(): number {
    return this.towardSun.y;
  }

  /** Height of the moon, -1 below the platform and 1 overhead. */
  get moonHeight(): number {
    return this.towardMoon.y;
  }

  /** The starburst. Switched off with the rest of the sun effects. */
  setGlareVisible(visible: boolean): void {
    this.sunGlare.mesh.setEnabled(visible);
  }

  setShadowQuality(quality: ShadowQuality): void {
    this.shadows.setQuality(quality);
  }

  /** The sun disc, which the god rays use as their emitter. */
  get sunMesh(): CelestialDisc["mesh"] {
    return this.sunDisc.mesh;
  }

  /**
   * Keeps the shadow frustum, and the sky itself, centred on this point.
   *
   * The discs used to hang 800 m from the world origin. That reads correctly
   * on a 200 m map, where the player is never far from the middle of it, and
   * wrongly on a 2 km one: walk a kilometre and the sun swings across the sky
   * with you, because you closed a real fraction of the distance to it. Real
   * bodies are far enough away that walking changes nothing, so the sky is
   * carried along instead.
   */
  setShadowFocus(point: Vector3): void {
    this.focus = point;
    this.shadows.setFocus(point);
  }

  /** Anything added here casts a shadow from the sun. */
  removeShadowCaster(mesh: AbstractMesh): void {
    this.shadows.removeCaster(mesh);
  }

  addShadowCaster(mesh: AbstractMesh): void {
    this.shadows.addCaster(mesh);
  }

  /** Compass bearing of the sun in radians, 0 north, clockwise. */
  get sunBearing(): number {
    return Math.atan2(this.towardSun.x, this.towardSun.z);
  }

  /** Compass bearing of the moon in radians, 0 north, clockwise. */
  get moonBearing(): number {
    return Math.atan2(this.towardMoon.x, this.towardMoon.z);
  }

  /** How much of the sun is up, 0 to 1, eased across the horizon. */
  get sunAboveHorizon(): number {
    return this.sunUp;
  }

  /** How much of the moon is up, 0 to 1, eased across the horizon. */
  get moonAboveHorizon(): number {
    return this.moonUp;
  }

  update(hourOfDay: number, totalHours: number, lighting: TimeOfDayLighting): void {
    sunDirectionAt(hourOfDay, this.towardSun);
    moonDirectionAt(totalHours, this.towardMoon);

    this.sunUp = smoothStep(HORIZON_FADE_START, HORIZON_FADE_END, this.towardSun.y);
    this.moonUp = smoothStep(HORIZON_FADE_START, HORIZON_FADE_END, this.towardMoon.y);

    // A directional light points the way light travels, which is from the body
    // toward the world. That is the opposite of where the body sits.
    this.sunLight.direction.copyFrom(this.towardSun).scaleInPlace(-1);
    this.moonLight.direction.copyFrom(this.towardMoon).scaleInPlace(-1);

    this.sunLight.diffuse.copyFrom(lighting.lightColor);
    this.sunLight.intensity = lighting.lightIntensity * SUN_SHARE * this.sunUp;
    // Moonlight is real but invisible next to daylight.
    this.moonLight.intensity = MOON_LIGHT_MAX * this.moonUp * (1 - this.sunUp);

    this.shadows.update(this.sunUp);

    this.sunDisc.mesh.position.copyFrom(this.towardSun).scaleInPlace(CELESTIAL_DISTANCE);
    this.moonDisc.mesh.position.copyFrom(this.towardMoon).scaleInPlace(CELESTIAL_DISTANCE);
    if (this.focus) {
      this.sunDisc.mesh.position.addInPlace(this.focus);
      this.moonDisc.mesh.position.addInPlace(this.focus);
    }
    this.sunGlare.mesh.position.copyFrom(this.sunDisc.mesh.position);
    this.paintSunDisc();
  }

  /** Orange near the horizon, white when high. Independent of the sky palette. */
  private paintSunDisc(): void {
    const blend = clamp01(this.towardSun.y / SUN_COLOUR_BLEND_HEIGHT);
    const colour = this.sunDisc.material.emissiveColor;
    colour.r = lerp(SUN_HORIZON_COLOUR[0], SUN_HIGH_COLOUR[0], blend);
    colour.g = lerp(SUN_HORIZON_COLOUR[1], SUN_HIGH_COLOUR[1], blend);
    colour.b = lerp(SUN_HORIZON_COLOUR[2], SUN_HIGH_COLOUR[2], blend);
  }
}
