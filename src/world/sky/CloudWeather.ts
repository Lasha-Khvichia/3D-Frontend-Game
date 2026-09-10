import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SHADOW_ALTITUDE, SHADOW_DARKNESS, WEATHER_TILE } from "./cloudLayer";
import { cloudShadeAt } from "./cloudShadeAt";
import type { CloudNoise } from "./noise/buildCloudNoise";

/**
 * The sky's weather: how much of it is cloud, which way the wind blows it, and
 * how far it has blown.
 *
 * Runs on real seconds, not game hours. A game day is five minutes, and wind
 * on the game clock would race clouds across the sky like a time-lapse.
 *
 * Cover rises and falls on two slow waves of seven and three minutes, which
 * never line up the same way twice: clear spells, broken skies, and every few
 * minutes an overcast that thins out again.
 */
export class CloudWeather {
  /** 0 is a clear sky, 1 overcast. */
  cover = 0;
  /** Metres the wind has carried the clouds, kept inside one weather repeat. */
  readonly drift = { x: 0, z: 0 };
  /** Metres the lumps inside each cloud have risen: how clouds change shape as they go. */
  rise = 0;
  private seconds = 95;
  private noise: CloudNoise | null = null;

  /** The noise the clouds are made of, once the worker has built it. Until then there is no cloud. */
  setNoise(noise: CloudNoise): void {
    this.noise = noise;
  }

  advance(seconds: number): void {
    this.seconds += seconds;
    const t = this.seconds;
    const wave =
      Math.sin((t / 420) * Math.PI * 2) * 0.34 + Math.sin((t / 170) * Math.PI * 2 + 1.3) * 0.14;
    this.cover = Math.min(0.92, Math.max(0.08, 0.46 + wave));
    const heading = 0.7 + Math.sin((t / 600) * Math.PI * 2) * 0.6;
    const speed = 14 + Math.sin((t / 300) * Math.PI * 2) * 5;
    this.drift.x = (this.drift.x + Math.sin(heading) * speed * seconds) % WEATHER_TILE;
    this.drift.z = (this.drift.z + Math.cos(heading) * speed * seconds) % WEATHER_TILE;
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
