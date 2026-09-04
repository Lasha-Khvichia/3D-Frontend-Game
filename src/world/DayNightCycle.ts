import type { Light } from "@babylonjs/core/Lights/light";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { AMBIENT_LIGHT_NAME } from "../scenes/createEmptyScene";
import { publishStats } from "../ui/bridge";
import { TimeOfDay } from "./TimeOfDay";
import { createTimeOfDayLighting, sampleTimeOfDay } from "./timeOfDayPalette";
import { SunAndMoon } from "./SunAndMoon";
import { applyAmbientLight } from "./ambientLight";
import type { ShadowQuality } from "../settings/gameSettings";

export type DayNightCycleOptions = {
  /** Hour the game starts at, 0 to 24. Defaults to 8. */
  startHour?: number;
  /** Real seconds for one full in-game day. Defaults to 300. */
  realSecondsPerGameDay?: number;
};

/**
 * Drives the void colour, the ambient fill, and the sun and moon from the
 * in-game clock.
 *
 * Advance it from the fixed simulation step, never from the render frame, or
 * the cycle runs faster on a 144Hz monitor than on a 60Hz one.
 */
export class DayNightCycle {
  private readonly scene: Scene;
  private readonly ambientLight: Light;
  private readonly sunAndMoon: SunAndMoon;
  private readonly clock: TimeOfDay;
  private readonly lighting = createTimeOfDayLighting();
  private lastPublishedMinute = -1;
  private clockFrozen = false;

  constructor(scene: Scene, options: DayNightCycleOptions = {}) {
    const ambientLight = scene.getLightByName(AMBIENT_LIGHT_NAME);
    if (!ambientLight) {
      throw new Error(`DayNightCycle needs a light named "${AMBIENT_LIGHT_NAME}" in the scene`);
    }

    this.scene = scene;
    this.ambientLight = ambientLight;
    this.sunAndMoon = new SunAndMoon(scene);
    this.clock = new TimeOfDay(options.startHour, options.realSecondsPerGameDay);
    this.apply();
  }

  get currentHour(): number {
    return this.clock.currentHour;
  }

  /** Whole days since the game started. */
  get dayNumber(): number {
    return this.clock.dayNumber;
  }

  /** Height of the sun, -1 below the platform and 1 overhead. */
  get sunHeight(): number {
    return this.sunAndMoon.sunHeight;
  }

  /** Height of the moon, -1 below the platform and 1 overhead. */
  get moonHeight(): number {
    return this.sunAndMoon.moonHeight;
  }

  /** The sun disc, which the god rays use as their emitter. */
  get sunMesh(): Mesh {
    return this.sunAndMoon.sunMesh;
  }

  /** Keeps the shadow frustum centred on this point as it moves. */
  setShadowFocus(point: Vector3): void {
    this.sunAndMoon.setShadowFocus(point);
  }

  /** Anything added here casts a shadow from the sun. */
  addShadowCaster(mesh: AbstractMesh): void {
    this.sunAndMoon.addShadowCaster(mesh);
  }

  /** Compass bearing of the sun in radians, 0 north, clockwise. */
  get sunBearing(): number {
    return this.sunAndMoon.sunBearing;
  }

  /** Compass bearing of the moon in radians, 0 north, clockwise. */
  get moonBearing(): number {
    return this.sunAndMoon.moonBearing;
  }

  /** Skip whole days forward to watch the moon drift away from the sun. */
  skipDays(days: number): void {
    this.clock.skipDays(days);
    this.apply();
  }

  advance(fixedDeltaSeconds: number): void {
    if (!this.clockFrozen) this.clock.advance(fixedDeltaSeconds);
    this.apply();
  }

  /** Holds the sun and moon where they are without pausing the game. */
  setClockFrozen(frozen: boolean): void {
    this.clockFrozen = frozen;
  }

  setSunEffectsVisible(visible: boolean): void {
    this.sunAndMoon.setGlareVisible(visible);
  }

  setShadowQuality(quality: ShadowQuality): void {
    this.sunAndMoon.setShadowQuality(quality);
  }

  /** Jump to an hour. Out-of-range values wrap: 26 becomes 2. */
  setTimeOfDay(hour: number): void {
    this.clock.set(hour);
    this.apply();
  }

  private apply(): void {
    sampleTimeOfDay(this.clock.currentHour, this.lighting);
    this.scene.clearColor.copyFrom(this.lighting.background);
    this.sunAndMoon.update(this.clock.currentHour, this.clock.totalHours, this.lighting);
    applyAmbientLight(
      this.ambientLight,
      this.lighting,
      this.sunAndMoon.sunAboveHorizon,
      this.sunAndMoon.moonAboveHorizon,
    );
    this.publishClock();
  }

  /** Publishes only when the displayed minute changes, so React re-renders rarely. */
  private publishClock(): void {
    const minute = Math.floor(this.clock.currentHour * 60);
    if (minute === this.lastPublishedMinute) return;
    this.lastPublishedMinute = minute;
    publishStats({ timeOfDayHours: this.clock.currentHour });
  }
}
