import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { smoothStep } from "./blend";
import { moonDirectionAt, sunDirectionAt } from "./celestialPath";

/** Height where a body's light starts and finishes fading at the horizon. */
const HORIZON_FADE_START = -0.05;
const HORIZON_FADE_END = 0.15;

/** Where the sun and the moon stand in the sky, and how much of each is up. */
export class SkyPlaces {
  protected readonly towardSun = new Vector3(0, 1, 0);
  protected readonly towardMoon = new Vector3(0, 1, 0);
  protected sunUp = 0;
  protected moonUp = 0;

  get sunDirection(): Vector3 {
    return this.towardSun;
  }

  get moonDirection(): Vector3 {
    return this.towardMoon;
  }

  /** Height of the sun, -1 below the platform and 1 overhead. */
  get sunHeight(): number {
    return this.towardSun.y;
  }

  /** Height of the moon, -1 below the platform and 1 overhead. */
  get moonHeight(): number {
    return this.towardMoon.y;
  }

  /** Compass bearing of the sun in radians, 0 north, clockwise. */
  get sunBearing(): number {
    return Math.atan2(this.towardSun.x, this.towardSun.z);
  }

  /** Compass bearing of the moon in radians, 0 north, clockwise. */
  get moonBearing(): number {
    return Math.atan2(this.towardMoon.x, this.towardMoon.z);
  }

  /** How much of the sun is up, 0 to 1, eased across the horizon. */
  get sunAboveHorizon(): number {
    return this.sunUp;
  }

  /** How much of the moon is up, 0 to 1, eased across the horizon. */
  get moonAboveHorizon(): number {
    return this.moonUp;
  }

  /** Puts both bodies where they stand at this moment of the calendar. */
  place(totalHours: number): void {
    sunDirectionAt(totalHours, this.towardSun);
    moonDirectionAt(totalHours, this.towardMoon);
    this.sunUp = smoothStep(HORIZON_FADE_START, HORIZON_FADE_END, this.towardSun.y);
    this.moonUp = smoothStep(HORIZON_FADE_START, HORIZON_FADE_END, this.towardMoon.y);
  }
}
