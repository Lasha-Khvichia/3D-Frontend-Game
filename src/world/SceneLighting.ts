import type { Light } from "@babylonjs/core/Lights/light";
import type { Scene } from "@babylonjs/core/scene";
import { AMBIENT_LIGHT_NAME } from "../scenes/createEmptyScene";
import { applyAmbientLight } from "./ambientLight";
import { FLASH_FILL, flashSky } from "./lightningFlash";
import type { SunAndMoon } from "./SunAndMoon";
import {
  createTimeOfDayLighting,
  sampleTimeOfDay,
  type TimeOfDayLighting,
} from "./timeOfDayPalette";
import { paintAir } from "./weather/weatherAir";
import { behindClouds, cloudsShownOf, throughClouds } from "./sky/skyThrough";
import {
  applySkyWeather,
  copySkyWeather,
  createSkyWeather,
  type SkyWeather,
} from "./weather/weatherSky";

/**
 * The light of one moment: the sky's colours, the air, the light the sun and
 * moon give, and the flat fill — from the hour, the weather and any lightning.
 *
 * `DayNightCycle` owns one and paints it whenever the clock moves.
 */
export class SceneLighting {
  /** The sky's colours and the sun's light, weather included. Read only. */
  readonly palette: TimeOfDayLighting = createTimeOfDayLighting();
  private readonly ambientLight: Light;
  /** What the weather does to the sky: grey, dark, purple, misty. */
  private readonly weather: SkyWeather = createSkyWeather();
  /** Lightning lighting the sky this instant, 0 to 1. */
  private flash = 0;

  constructor(
    private readonly scene: Scene,
    private readonly sunAndMoon: SunAndMoon,
  ) {
    const ambientLight = scene.getLightByName(AMBIENT_LIGHT_NAME);
    if (!ambientLight) {
      throw new Error(`SceneLighting needs a light named "${AMBIENT_LIGHT_NAME}" in the scene`);
    }
    this.ambientLight = ambientLight;
  }

  /** Taken when next painted; `DayNightCycle.refresh` to show it at once, as when paused. */
  setWeather(weather: Readonly<SkyWeather>): void {
    copySkyWeather(weather, this.weather);
  }

  /** How much of the drawn clouds show, 0 to 1: fog hides them, rain mostly does not. */
  get cloudsShown(): number {
    return cloudsShownOf(this.weather);
  }

  /** Share of a light beyond `cover` of cloud reaching the eye: for halos over the picture. */
  throughClouds(cover: number): number {
    return throughClouds(cover, this.weather);
  }

  /** What a light drawn behind the cloud veil is dimmed by; `cover` defaults to the whole sky's. */
  behindClouds(cover = this.weather.cover): number {
    return behindClouds(cover, this.weather);
  }

  /** A lightning flash, 0 to 1, shown when next painted. */
  setFlash(amount: number): void {
    this.flash = amount;
  }

  /** Lights the scene for this moment. The sun and moon must already be placed. */
  paint(totalHours: number): void {
    const { palette, sunAndMoon, scene } = this;
    sampleTimeOfDay(totalHours, sunAndMoon.sunHeight, palette);
    applySkyWeather(palette, this.weather);
    if (this.flash > 0) flashSky(palette, this.flash);
    scene.clearColor.copyFrom(palette.background);
    paintAir(scene, palette.background, this.weather.mist);
    sunAndMoon.shine(palette);
    applyAmbientLight(
      this.ambientLight,
      palette,
      sunAndMoon.sunAboveHorizon,
      sunAndMoon.moonAboveHorizon,
    );
    this.ambientLight.intensity += this.flash * FLASH_FILL;
  }
}
