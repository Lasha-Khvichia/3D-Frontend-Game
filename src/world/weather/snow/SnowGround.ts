import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { PLAYER_HEIGHT } from "../../../player/createPlayerBean";
import type { WeatherKind } from "../weatherKinds";
import type { WeatherListener, WeatherState } from "../weatherState";
import { FootprintMap } from "./FootprintMap";
import { Footsteps } from "./Footsteps";
import { PRINT_FADE_HOURS, PRINT_WINDOW_HOURS } from "./footprintStamps";
import { HOLDS_A_PRINT, snowDepthAt } from "./snowCover";
import { depthAtHeight, SnowTrail } from "./snowDepth";
import { snowField } from "./snowField";

/** Metres the feet may be above the snow and still be pressing into it. */
const ON_THE_SNOW = 0.1;

/**
 * The winter on the ground: snow lying, ice on the rivers, and the trail the
 * player leaves.
 *
 * Snow and ice are functions of time like the weather (`snowDepth.ts`), so
 * nothing about them is stored. The trail is the one thing that is: it is
 * what the player did, and no date can work that out. It is kept only round
 * them (`FootprintMap`) and fades as the snow fills it in.
 */
export class SnowGround implements WeatherListener {
  private readonly prints: FootprintMap;
  private readonly steps: Footsteps;
  private readonly trail = new SnowTrail();
  /** Metres of snow where the player stands: the grass is buried in it. */
  private underFoot = 0;
  private filling = 1;
  private hours = 0;

  constructor(
    scene: Scene,
    private readonly eye: Vector3,
    private readonly ground: { heightAt(x: number, z: number): number },
    private readonly weather: { readonly held: WeatherKind | null },
  ) {
    this.prints = new FootprintMap(scene);
    this.steps = new Footsteps(this.prints);
    snowField.prints = this.prints.texture;
    snowField.foot = this.prints.area;
  }

  setWeather(state: Readonly<WeatherState>): void {
    // Falling snow and wind fill a print in: a blizzard wipes a trail in minutes.
    const falling = state.form === "snow" ? 6 * state.precipitation : 0;
    this.filling = 1 + falling + state.wind / 12;
  }

  get depthUnderFoot(): number {
    return this.underFoot;
  }

  /** Metres of snow lying here, on the ground at this height. */
  depthAt(x: number, z: number, height: number): number {
    return snowDepthAt(snowField.deep, x, z, height);
  }

  /** Metres of ice on water at this height. */
  iceAt(height: number): number {
    return depthAtHeight(snowField.ice, height);
  }

  /** How trodden the snow is here, 0 to 1: the player's own trail is packed firm. */
  packedAt(x: number, z: number): number {
    return this.prints.packedAt(x, z, this.hours, snowField.printLife);
  }

  /** Every step: snow and ice at every height, then the trail through them. */
  update(totalHours: number): void {
    this.hours = totalHours;
    const winter = this.trail.at(totalHours, this.weather.held);
    for (let band = 0; band < winter.deep.length; band += 1) {
      snowField.deep[band] = winter.deep[band]!;
      snowField.ice[band] = winter.ice[band]!;
    }
    snowField.nowShare = this.prints.shareNow(totalHours);
    snowField.printLife = (PRINT_WINDOW_HOURS / PRINT_FADE_HOURS) * this.filling;
    const { x, z } = this.eye;
    const floor = this.ground.heightAt(x, z);
    this.underFoot = this.depthAt(x, z, floor);
    // Only feet on the snow leave a print. Without this the trail went on
    // being stamped through a jump, and along the ground under a bridge or a
    // roof — a walk in the air, printed below.
    const standing = this.eye.y - PLAYER_HEIGHT / 2 - floor < ON_THE_SNOW;
    this.steps.track(x, z, standing && this.underFoot >= HOLDS_A_PRINT, totalHours);
    this.prints.update(x, z, totalHours);
  }
}
