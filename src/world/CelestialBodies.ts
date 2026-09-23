import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { CelestialGlow } from "./CelestialGlow";
import { CELESTIAL_DISTANCE, createCelestialDisc, type CelestialDisc } from "./createCelestialDisc";
import { createMoonTexture } from "./createMoonTexture";
import { createSunGlare, type SunGlare } from "./createSunGlare";
import { paintSunDisc } from "./paintSunDisc";

/**
 * 0.53 degrees across, which is the sun's real angular size from Earth. It is
 * a pinpoint on purpose: the glare and the god rays carry the effect, not the
 * disc. Both are sized as angles, so moving them further out changes nothing.
 */
const SUN_DIAMETER = CELESTIAL_DISTANCE * 0.00925;
const MOON_DIAMETER = CELESTIAL_DISTANCE * 0.0975;
/** Lifts the whole moon texture. Emissive texture is added, not multiplied. */
const MOON_TEXTURE_LEVEL = 1.15;

export type BodyShares = { readonly sun: number; readonly moon: number };

/** What is seen of the sun and the moon: the two discs, the sun's glare, and both halos. */
export class CelestialBodies {
  private readonly sunDisc: CelestialDisc;
  private readonly sunGlare: SunGlare;
  private readonly moonDisc: CelestialDisc;
  /** The halos, dimmed by cloud. */
  readonly glow: CelestialGlow;

  constructor(scene: Scene) {
    this.sunDisc = createCelestialDisc(scene, { name: "sun-disc", diameter: SUN_DIAMETER });
    this.sunGlare = createSunGlare(scene);
    this.moonDisc = createCelestialDisc(scene, { name: "moon-disc", diameter: MOON_DIAMETER });
    // Babylon ADDS the emissive texture to the emissive colour. Black here is
    // what lets the dark maria in the texture actually read as dark.
    this.moonDisc.material.emissiveColor.set(0, 0, 0);
    const surface = createMoonTexture(scene);
    surface.level = MOON_TEXTURE_LEVEL;
    this.moonDisc.material.emissiveTexture = surface;

    // The sky is not in the haze. Fog is depth-based, and these sit 1,390 m
    // out, so without this the sun fades to sky colour and disappears.
    this.sunDisc.material.fogEnabled = false;
    this.sunGlare.material.fogEnabled = false;
    this.moonDisc.material.fogEnabled = false;
    this.glow = new CelestialGlow(scene, this.sunDisc.mesh, this.moonDisc.mesh);
    // Under the clouds, not over them: drawn before the cloud veil.
    this.sunGlare.mesh.alphaIndex = -1;
  }

  /** `seen` dims the discs and glare, drawn behind the cloud veil; `glow` the halos. */
  setCloudCover(glow: BodyShares, seen: BodyShares): void {
    this.glow.setCloudCover(glow.sun, glow.moon);
    this.sunGlare.material.alpha = seen.sun;
    this.sunDisc.mesh.visibility = seen.sun;
    this.moonDisc.mesh.visibility = seen.moon;
  }

  setGlareVisible(visible: boolean): void {
    this.sunGlare.mesh.setEnabled(visible);
  }

  get sunMesh(): CelestialDisc["mesh"] {
    return this.sunDisc.mesh;
  }

  /** Hangs both discs out along their directions from `focus`, the player, so walking never moves them. */
  place(towardSun: Vector3, towardMoon: Vector3, focus: Vector3 | null): void {
    this.sunDisc.mesh.position.copyFrom(towardSun).scaleInPlace(CELESTIAL_DISTANCE);
    this.moonDisc.mesh.position.copyFrom(towardMoon).scaleInPlace(CELESTIAL_DISTANCE);
    if (focus) {
      this.sunDisc.mesh.position.addInPlace(focus);
      this.moonDisc.mesh.position.addInPlace(focus);
    }
    this.sunGlare.mesh.position.copyFrom(this.sunDisc.mesh.position);
    paintSunDisc(this.sunDisc.material.emissiveColor, towardSun.y);
  }
}
