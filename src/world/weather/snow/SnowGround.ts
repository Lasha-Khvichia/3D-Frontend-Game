import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { WeatherListener, WeatherState } from "../weatherState";
import { FootprintMap } from "./FootprintMap";
import { PRINT_FADE_HOURS, PRINT_WINDOW_HOURS } from "./footprintStamps";
import { snowCoverAt, snowLineAt } from "./snowCover";
import { snowField } from "./snowField";

/** Metres between boot prints, and how far each foot falls either side of the walk. */
const STRIDE = 0.8;
const FOOT_APART = 0.12;
/** Below this the cover is too thin to hold a print. */
const HOLDS_A_PRINT = 0.15;
/** Longer than any step: past this the player was put somewhere, not walked. */
const A_LEAP = 3;

/**
 * The snow lying on the high ground, and the trail the player leaves in it.
 *
 * Where the snow lies is a function of time like the weather (`snowCover.ts`),
 * so nothing about it is stored. The trail is the one thing that is: it is
 * what the player did, and no date can work that out. It is kept only round
 * them (`FootprintMap`) and fades as the snow fills it in.
 */
export class SnowGround implements WeatherListener {
  private readonly prints: FootprintMap;
  private lastX = Number.NaN;
  private lastZ = Number.NaN;
  private walked = 0;
  private rightFoot = false;
  private filling = 1;

  constructor(
    scene: Scene,
    private readonly eye: Vector3,
    private readonly ground: { heightAt(x: number, z: number): number },
  ) {
    this.prints = new FootprintMap(scene);
    snowField.prints = this.prints.texture;
    snowField.foot = this.prints.area;
  }

  setWeather(state: Readonly<WeatherState>): void {
    // Falling snow and wind fill a print in: a blizzard wipes a trail in minutes.
    const falling = state.form === "snow" ? 6 * state.precipitation : 0;
    this.filling = 1 + falling + state.wind / 12;
  }

  /** Every step. */
  update(totalHours: number): void {
    snowField.line = snowLineAt(totalHours);
    snowField.nowShare = this.prints.shareNow(totalHours);
    snowField.printLife = (PRINT_WINDOW_HOURS / PRINT_FADE_HOURS) * this.filling;
    this.trackFeet(totalHours);
    this.prints.update(this.eye.x, this.eye.z, totalHours);
  }

  /** A print every stride, left and right of the line walked, where there is snow to take it. */
  private trackFeet(totalHours: number): void {
    const { x, z } = this.eye;
    if (!Number.isFinite(this.lastX)) {
      this.lastX = x;
      this.lastZ = z;
      return;
    }
    const stepX = x - this.lastX;
    const stepZ = z - this.lastZ;
    const far = Math.hypot(stepX, stepZ);
    this.lastX = x;
    this.lastZ = z;
    if (far < 1e-4 || far > A_LEAP) return;
    this.walked += far;
    if (this.walked < STRIDE) return;
    this.walked = 0;
    if (snowCoverAt(x, z, this.ground.heightAt(x, z), totalHours) < HOLDS_A_PRINT) return;
    const towardX = stepX / far;
    const towardZ = stepZ / far;
    this.rightFoot = !this.rightFoot;
    const side = this.rightFoot ? FOOT_APART : -FOOT_APART;
    this.prints.press(x + towardZ * side, z - towardX * side, towardX, towardZ, totalHours);
  }
}
