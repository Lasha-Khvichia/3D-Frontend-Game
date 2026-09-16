import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { DayNightCycle } from "../DayNightCycle";
import type { CloudWeather } from "./CloudWeather";

/**
 * How much of the sun and the moon the clouds let through, eased so a cloud
 * edge crossing the sun fades its halo rather than blinking it.
 *
 * Two shares for each body. `seen` is for what is drawn behind the cloud veil
 * — the disc and the glare — and makes up for clouds rain has thinned out of
 * the veil. `glow` is for what is added over the finished picture — the halo
 * and the god rays — which no veil covers at all.
 */
export class CloudedBodies {
  private readonly cover = { sun: 0, moon: 0 };
  private readonly glow = { sun: 1, moon: 1 };
  private readonly seen = { sun: 1, moon: 1 };

  constructor(
    private readonly dayNight: DayNightCycle,
    private readonly weather: CloudWeather,
  ) {}

  /** Share of sunlight reaching the player past the clouds and through the air. */
  get sunlight(): number {
    return this.glow.sun;
  }

  update(seconds: number, eye: Vector3, clouds: boolean): void {
    const { sunAndMoon, light } = this.dayNight;
    const ease = Math.min(1, seconds * 3);
    const sun = clouds ? this.weather.coverToward(eye, sunAndMoon.sunDirection) : 0;
    const moon = clouds ? this.weather.coverToward(eye, sunAndMoon.moonDirection) : 0;
    this.cover.sun += (sun - this.cover.sun) * ease;
    this.cover.moon += (moon - this.cover.moon) * ease;
    this.glow.sun = light.throughClouds(this.cover.sun);
    this.glow.moon = light.throughClouds(this.cover.moon);
    // With the clouds switched off there is no veil in front to make up for.
    this.seen.sun = clouds ? light.behindClouds(this.cover.sun) : this.glow.sun;
    this.seen.moon = clouds ? light.behindClouds(this.cover.moon) : this.glow.moon;
    sunAndMoon.setCloudCover(this.glow, this.seen);
  }
}
