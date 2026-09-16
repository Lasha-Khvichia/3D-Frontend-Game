import { DAYS_PER_YEAR, HOURS_PER_DAY } from "../../calendar/calendar";
import type { WeatherMoment } from "../sampleWeather";
import type { WeatherKind } from "../weatherKinds";
import { BAND_METRES, iceThickness, passHour, SNOW_BANDS } from "./snowAndIceHour";

export { BAND_METRES, SNOW_BANDS };

/**
 * The replay starts on 1 September, when no snow lies below the permanent
 * caps and no river holds ice, in any year of this climate. A window of so
 * many days would not do: through a hard winter nothing melts, so what fell
 * before the window would still count, and walking to a date would not agree
 * with jumping to it.
 */
const SNOW_YEAR_START_DAY = 243;

/** Snow and ice by height, now: metres of each, eased between whole hours. */
export type Winter = { readonly deep: readonly number[]; readonly ice: readonly number[] };

/**
 * How deep the snow lies and how thick the river ice is, by height above the
 * sea. Replayed rather than stored, an hour at a time since the ground was
 * last bare, so the same date always has the same winter, walked to or
 * jumped to. Only the height matters, so sixteen numbers of each describe the
 * whole island. `at` returns the same arrays each time: copy them to keep them.
 */
export class SnowTrail {
  private readonly deep = new Array<number>(SNOW_BANDS).fill(0);
  private readonly frost = new Array<number>(SNOW_BANDS).fill(0);
  private readonly nextDeep = new Array<number>(SNOW_BANDS).fill(0);
  private readonly nextFrost = new Array<number>(SNOW_BANDS).fill(0);
  private readonly shown = {
    deep: new Array<number>(SNOW_BANDS).fill(0),
    ice: new Array<number>(SNOW_BANDS).fill(0),
  };
  private readonly moment: WeatherMoment = { kind: "clear", hail: false };
  private mark = Number.NaN;

  /** `held` is the weather the menu is holding, if any. */
  at(totalHours: number, held: WeatherKind | null): Winter {
    const mark = Math.floor(totalHours);
    if (!(mark >= this.mark)) this.rebuild(mark);
    for (let hour = this.mark; hour < mark; hour += 1)
      this.advance(this.deep, this.frost, hour, held);
    this.mark = mark;
    for (let band = 0; band < SNOW_BANDS; band += 1) {
      this.nextDeep[band] = this.deep[band]!;
      this.nextFrost[band] = this.frost[band]!;
    }
    this.advance(this.nextDeep, this.nextFrost, mark, held);
    const through = totalHours - mark;
    for (let band = 0; band < SNOW_BANDS; band += 1) {
      const deep = this.deep[band]!;
      const frost = this.frost[band]!;
      this.shown.deep[band] = deep + (this.nextDeep[band]! - deep) * through;
      this.shown.ice[band] = iceThickness(frost + (this.nextFrost[band]! - frost) * through);
    }
    return this.shown;
  }

  private rebuild(mark: number): void {
    this.deep.fill(0);
    this.frost.fill(0);
    this.mark = Math.max(0, lastBareGround(mark));
  }

  private advance(deep: number[], frost: number[], hour: number, held: WeatherKind | null): void {
    // The yearly zero, so walking through a winter and jumping into it agree.
    if (hour === lastBareGround(hour)) {
      deep.fill(0);
      frost.fill(0);
    }
    passHour(deep, frost, hour, held, this.moment);
  }
}

/** Reads between the bands: the value at any height. */
export function depthAtHeight(bands: readonly number[], height: number): number {
  const at = Math.min(SNOW_BANDS - 1.001, Math.max(0, height / BAND_METRES));
  const low = Math.floor(at);
  return bands[low]! + (bands[low + 1]! - bands[low]!) * (at - low);
}

/** The 1 September on or before this moment: the last time the ground was bare. */
function lastBareGround(totalHours: number): number {
  const start = SNOW_YEAR_START_DAY * HOURS_PER_DAY;
  const year = Math.floor((totalHours - start) / (DAYS_PER_YEAR * HOURS_PER_DAY));
  return start + year * DAYS_PER_YEAR * HOURS_PER_DAY;
}
