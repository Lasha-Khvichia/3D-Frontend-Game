import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SHADOW_ALTITUDE, SHADOW_DARKNESS, WEATHER_TILE } from "./cloudLayer";
import { cloudShadeAt } from "./cloudShadeAt";
import type { CloudNoise } from "./noise/buildCloudNoise";

/**
 * The clouds' side of the weather: how much of the sky is cloud, which way
 * the wind blows it, and how far it has blown. Cover and wind are the
 * weather's (`Weather`); this carries the clouds along.
 *
 * The drift runs on real seconds, not game hours. A game day is twenty
 * minutes, and wind on the game clock would race clouds across the sky like
 * a time-lapse.
 */
export class CloudWeather {
  /** 0 is a clear sky, 1 overcast. */
  cover = 0;
  /** Metres the wind has carried the clouds, kept inside one weather repeat. */
  readonly drift = { x: 0, z: 0 };
  /** Metres the lumps inside each cloud have risen: how clouds change shape as they go. */
  rise = 0;
  /** Metres a second at cloud height, and the way it blows towards. */
  private speed = 12;
  private heading = Math.PI / 2;
  private noise: CloudNoise | null = null;

  /** The noise the clouds are made of, once the worker has built it. Until then there is no cloud. */
  setNoise(noise: CloudNoise): void {
    this.noise = noise;
  }

  /**
   * Cover, and the wind at the ground. Wind a kilometre and more up blows
   * about twice as hard, and never quite stops.
   */
  setWeather(cover: number, groundWind: number, heading: number): void {
    this.cover = cover;
    this.speed = 5 + 1.8 * groundWind;
    this.heading = heading;
  }

  advance(seconds: number): void {
    this.drift.x = (this.drift.x + Math.sin(this.heading) * this.speed * seconds) % WEATHER_TILE;
    this.drift.z = (this.drift.z + Math.cos(this.heading) * this.speed * seconds) % WEATHER_TILE;
    this.rise = (this.rise + seconds * 1.6) % WEATHER_TILE;
  }

  /** How much cloud stands between a point and a light in direction `toward`, 0 to 1. */
  coverToward(point: Vector3, toward: Vector3): number {
    if (!this.noise || toward.y <= 0.02) return 0;
    const along = (SHADOW_ALTITUDE - point.y) / toward.y;
    return cloudShadeAt(this.noise, this, point.x + toward.x * along, point.z + toward.z * along);
  }

  /** Share of direct light from `toward` reaching a point: what the shadow shader works out too. */
  lightReaching(point: Vector3, toward: Vector3): number {
    return 1 - SHADOW_DARKNESS * this.coverToward(point, toward);
  }
}
