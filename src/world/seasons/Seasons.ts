import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Woodland } from "../trees/Woodland";
import { tintGrass } from "./grassColours";
import type { WeatherListener, WeatherState } from "../weather/weatherState";
import { frostAt } from "./frostAt";
import { frostField } from "./frostField";
import { seasonLook } from "./seasonLook";
import type { LeafFall } from "./LeafFall";
import type { Wildflowers } from "./Wildflowers";

/**
 * The growing year, pushed into everything that shows it, every step.
 *
 * Nothing here is stored: the look is worked out afresh from the clock, like
 * the weather, so jumping the date and walking to it come out the same.
 */
/** Metres of snow that hide what grows under it, as they hide the grass. */
const SNOW_HIDES = 0.02;

export class Seasons implements WeatherListener {
  private temperature = 10;
  private cover = 0;

  constructor(
    private readonly woodland: Woodland,
    private readonly grass: { readonly meshes: Mesh[] },
    private readonly flowers: Wildflowers,
    private readonly leafFall: LeafFall,
  ) {}

  setWeather(state: Readonly<WeatherState>): void {
    this.temperature = state.temperature;
    this.cover = state.cover;
  }

  /** `snowDepth` is what lies underfoot: flowers, colour and frost go under it. */
  update(
    seconds: number,
    totalHours: number,
    eye: Vector3,
    snowDepth: number,
    sunHeight: number,
  ): void {
    const look = seasonLook(totalHours);
    const covered = Math.min(1, snowDepth / SNOW_HIDES);
    frostField.amount = frostAt(this.temperature, this.cover, sunHeight) * (1 - covered);
    this.woodland.setSeason(look);
    tintGrass(this.grass.meshes, look, frostField.amount);
    this.flowers.update(eye, look.flowers * (1 - covered));
    this.leafFall.update(seconds, eye, look);
  }
}
