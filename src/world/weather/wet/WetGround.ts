import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { DayNightCycle } from "../../DayNightCycle";
import { SEA_LEVEL } from "../../terrain/terrainConstants";
import type { NearRoofs } from "../precipitation/NearRoofs";
import type { Weather } from "../Weather";
import type { WeatherListener, WeatherState } from "../weatherState";
import { SoakTrail } from "./groundSoak";
import { SHELTER_SLOTS, wetField } from "./wetField";

/** Kept small so the rings on the puddles never lose their precision, however long the game runs. */
const CLOCK_WRAP = 600;
/** How much of the moon's light glints off water, against the sun's. */
const MOONLIGHT = 0.12;

/**
 * What the rain leaves behind: ground and grass darkened and glossy, and
 * puddles standing on the flat.
 *
 * How wet the ground is comes from the weather of the last day (`SoakTrail`),
 * not from anything this keeps, so the same date and hour is always as wet —
 * walk here, or jump the clock, and the puddles are the same. What this holds
 * is only what the shaders need to draw it (`wetField`).
 */
export class WetGround implements WeatherListener {
  private readonly trail = new SoakTrail();
  private rain = 0;

  constructor(
    private readonly eye: Vector3,
    private readonly weather: Weather,
    private readonly dayNight: DayNightCycle,
    private readonly roofs: NearRoofs,
  ) {}

  setWeather(state: Readonly<WeatherState>): void {
    // What falls now rings the puddles; what has fallen is what soaked the ground.
    this.rain = state.form === "snow" ? 0 : state.precipitation;
  }

  /** Every step. `seconds` is real time, which is what the rings run on. */
  update(totalHours: number, seconds: number): void {
    const soak = this.trail.at(totalHours, this.eye.y - SEA_LEVEL, this.weather.held);
    wetField.wet = soak.wet;
    wetField.puddles = soak.puddles;
    wetField.rain = this.rain;
    wetField.clock = (wetField.clock + seconds) % CLOCK_WRAP;
    this.lightWater();
    for (let slot = 0; slot < SHELTER_SLOTS * 8; slot += 1) {
      wetField.roofs[slot] = this.roofs.packed[slot]!;
    }
  }

  /** Water mirrors the sky and glints at whichever of the sun and moon is up. */
  private lightWater(): void {
    const { background, lightIntensity } = this.dayNight.palette;
    wetField.sky.set(background.r, background.g, background.b);
    // Brighter by day: the water mirrors the whole lit dome, not just its average colour.
    wetField.skyStrength = 0.9 + 0.4 * lightIntensity;
    const { sunAndMoon } = this.dayNight;
    const sunUp = sunAndMoon.sunHeight > 0.02;
    wetField.toSun.copyFrom(sunUp ? sunAndMoon.sunDirection : sunAndMoon.moonDirection);
    wetField.sunStrength = sunUp
      ? lightIntensity
      : MOONLIGHT * Math.max(0, sunAndMoon.moonHeight * 4);
  }
}
