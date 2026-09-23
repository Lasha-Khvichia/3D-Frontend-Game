import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import type { ShadowQuality } from "../settings/gameSettings";
import { CelestialBodies, type BodyShares } from "./CelestialBodies";
import type { CelestialGlow } from "./CelestialGlow";
import { SkyLights } from "./SkyLights";
import { SkyPlaces } from "./SkyPlaces";
import type { TimeOfDayLighting } from "./timeOfDayPalette";

/**
 * The sun and the moon: where they stand (`SkyPlaces`), their lights and
 * shadows (`SkyLights`), and their discs (`CelestialBodies`).
 *
 * Both orbit continuously and are never hidden. Below the horizon they keep
 * travelling under the platform, so the cycle reads as one unbroken orbit.
 * The sun's arc follows the date: high and long in summer, low and short in
 * winter. The moon runs on a 24 h 50 min lunar day against the sun's 24 h, so
 * it slips later every night and drifts through the whole cycle in 29.5 days.
 */
export class SunAndMoon extends SkyPlaces {
  private readonly lights: SkyLights;
  private readonly bodies: CelestialBodies;
  /** Where the player is. The sky is drawn around them, not around the origin. */
  private focus: Vector3 | null = null;

  constructor(scene: Scene) {
    super();
    this.lights = new SkyLights(scene);
    this.bodies = new CelestialBodies(scene);
  }

  /** The halos, dimmed by cloud. */
  get glow(): CelestialGlow {
    return this.bodies.glow;
  }

  /** Dims each body by the cloud in front of it (`CloudedBodies`). */
  setCloudCover(glow: BodyShares, seen: BodyShares): void {
    this.bodies.setCloudCover(glow, seen);
  }

  /** The starburst. Switched off with the rest of the sun effects. */
  setGlareVisible(visible: boolean): void {
    this.bodies.setGlareVisible(visible);
  }

  /** The sun disc, which the god rays use as their emitter. */
  get sunMesh(): CelestialBodies["sunMesh"] {
    return this.bodies.sunMesh;
  }

  setShadowQuality(quality: ShadowQuality): void {
    this.lights.shadows.setQuality(quality);
  }

  /**
   * Keeps the shadows, and the sky itself, centred on this point. Real bodies
   * are far enough away that walking changes nothing, so the sky is carried
   * along: hung from the origin, a kilometre's walk swung the sun across it.
   */
  setShadowFocus(point: Vector3): void {
    this.focus = point;
    this.lights.shadows.setFocus(point);
  }

  /** Anything added here casts a shadow from the sun, and from the moon. */
  addShadowCaster(mesh: AbstractMesh): void {
    this.lights.shadows.addCaster(mesh);
  }

  removeShadowCaster(mesh: AbstractMesh): void {
    this.lights.shadows.removeCaster(mesh);
  }

  /** Lights the world from where `place` put them, in this step's colours. */
  shine(lighting: TimeOfDayLighting): void {
    this.lights.shine(lighting, this.towardSun, this.towardMoon, this.sunUp, this.moonUp);
    this.bodies.place(this.towardSun, this.towardMoon, this.focus);
  }
}
