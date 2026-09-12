import type { Light } from "@babylonjs/core/Lights/light";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { AMBIENT_LIGHT_NAME } from "../scenes/createEmptyScene";
import { TimeOfDay } from "./TimeOfDay";
import { CalendarReport } from "./calendar/CalendarReport";
import { createTimeOfDayLighting, sampleTimeOfDay } from "./timeOfDayPalette";
import { SunAndMoon } from "./SunAndMoon";
import { applyAmbientLight } from "./ambientLight";
import {
  applySkyWeather,
  copySkyWeather,
  createSkyWeather,
  murkOf,
  type SkyWeather,
} from "./weather/weatherSky";
import { paintAir } from "./weather/weatherAir";
import type { TimeOfDayLighting } from "./timeOfDayPalette";
import type { ShadowQuality } from "../settings/gameSettings";

export type DayNightCycleOptions = {
  /** Hours since the calendar began, when the game opens. Defaults to 10:00 on 1 March. */
  startHours?: number;
  /** Real seconds for one full in-game day. Defaults to 1200. */
  realSecondsPerGameDay?: number;
};

/**
 * Drives the void colour, the ambient fill, and the sun and moon from the
 * in-game clock and calendar.
 *
 * Advance it from the fixed simulation step, never from the render frame, or
 * the cycle runs faster on a 144Hz monitor than on a 60Hz one.
 */
export class DayNightCycle {
  private readonly scene: Scene;
  private readonly ambientLight: Light;
  /** The sun and moon themselves: their directions, lights, discs and halos. */
  readonly sunAndMoon: SunAndMoon;
  private readonly clock: TimeOfDay;
  private readonly lighting = createTimeOfDayLighting();
  private readonly report = new CalendarReport();
  private clockFrozen = false;
  /** What the weather does to the sky: grey, dark, purple, misty. */
  private readonly weather: SkyWeather = createSkyWeather();

  constructor(scene: Scene, options: DayNightCycleOptions = {}) {
    const ambientLight = scene.getLightByName(AMBIENT_LIGHT_NAME);
    if (!ambientLight) {
      throw new Error(`DayNightCycle needs a light named "${AMBIENT_LIGHT_NAME}" in the scene`);
    }

    this.scene = scene;
    this.ambientLight = ambientLight;
    this.sunAndMoon = new SunAndMoon(scene);
    this.clock = new TimeOfDay(options.startHours, options.realSecondsPerGameDay);
    this.apply();
  }

  get currentHour(): number {
    return this.clock.currentHour;
  }

  /** Hours since the calendar began, for the date and anything that turns with the sky. */
  get totalHours(): number {
    return this.clock.totalHours;
  }

  /** Whole days since the calendar began. */
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
  /**
   * Taking a caster out again matters once the world is bigger than the shadow
   * box: a tree 100 m away is drawn into the shadow map every frame and casts
   * nothing anyone can see.
   */
  removeShadowCaster(mesh: AbstractMesh): void {
    this.sunAndMoon.removeShadowCaster(mesh);
  }

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

  /** The sky's colours and the sun's light this step, weather included. Read only. */
  get palette(): TimeOfDayLighting {
    return this.lighting;
  }

  /** Taken on the next step; `refresh` to show it at once, as when paused. */
  setWeather(weather: Readonly<SkyWeather>): void {
    copySkyWeather(weather, this.weather);
  }

  /** How much fog or falling rain and snow hides the sky and its clouds, 0 to 1. */
  get murk(): number {
    return murkOf(this.weather);
  }

  /** Repaints from the clock and the weather now, without advancing. */
  refresh(): void {
    this.apply();
  }

  /** Jump to a day of this year, 0 for 1 January to 364, keeping the hour. */
  setDayOfYear(day: number): void {
    this.clock.setDayOfYear(day);
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
    const hours = this.clock.totalHours;
    this.sunAndMoon.place(hours);
    sampleTimeOfDay(hours, this.sunAndMoon.sunHeight, this.lighting);
    applySkyWeather(this.lighting, this.weather);
    this.scene.clearColor.copyFrom(this.lighting.background);
    paintAir(this.scene, this.lighting.background, this.weather.mist);
    this.sunAndMoon.shine(this.lighting);
    applyAmbientLight(
      this.ambientLight,
      this.lighting,
      this.sunAndMoon.sunAboveHorizon,
      this.sunAndMoon.moonAboveHorizon,
    );
    this.report.publish(hours);
  }
}
