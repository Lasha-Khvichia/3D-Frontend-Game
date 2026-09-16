import { DAYS_PER_YEAR, HOURS_PER_DAY } from "../../calendar/calendar";
import { kindAt, type WeatherMoment } from "../sampleWeather";
import { KIND_LOOKS, type WeatherKind } from "../weatherKinds";
import { weatherTemperature } from "../weatherTemperature";

/** Heights it is worked out at: every 20 m from the sea to 300 m. */
export const SNOW_BANDS = 16;
export const BAND_METRES = 20;
/**
 * The replay starts on 1 September, when no snow lies below the permanent
 * caps in any year of this climate. A window of so many days would not do:
 * through a hard winter the snow never melts away, so what fell before the
 * window would still count and walking to a date would not agree with
 * jumping to it.
 */
const SNOW_YEAR_START_DAY = 243;
const STEP_HOURS = 1;
/** Tuned against Kyiv: snow lying about 95 days a year, 18 cm at its deepest. */
const FALL_PER_HOUR = 0.0035;
const MELT_PER_DEGREE_DAY = 0.009;
/** Rain eats snow faster than warm air alone does. */
const RAIN_MELT_PER_DAY = 0.12;
const DEEPEST = 0.8;
/** Snow rather than rain below this, as everywhere else in the weather. */
const FREEZING = 0.5;

/**
 * How deep the snow lies, by height above the sea.
 *
 * Snow is the slowest thing the weather does — it falls in an hour and lies
 * for weeks — so, like the rest of the weather, it is replayed rather than
 * stored: hourly falls and melts since the ground was last bare. The same
 * date always has the same snow, walked to or jumped to. Only the height
 * matters, so sixteen numbers describe the whole island.
 */
export class SnowTrail {
  private readonly deep = new Array<number>(SNOW_BANDS).fill(0);
  private readonly next = new Array<number>(SNOW_BANDS).fill(0);
  private readonly shown = new Array<number>(SNOW_BANDS).fill(0);
  private readonly moment: WeatherMoment = { kind: "clear", hail: false };
  private mark = Number.NaN;

  /** The depth at each band now, eased between whole hours. `held` is the menu's weather. */
  at(totalHours: number, held: WeatherKind | null): readonly number[] {
    const mark = Math.floor(totalHours / STEP_HOURS);
    if (!(mark >= this.mark)) this.rebuild(mark);
    for (let step = this.mark; step < mark; step += 1) this.advance(this.deep, step, held);
    this.mark = mark;
    for (let band = 0; band < SNOW_BANDS; band += 1) this.next[band] = this.deep[band]!;
    this.advance(this.next, mark, held);
    const through = totalHours / STEP_HOURS - mark;
    for (let band = 0; band < SNOW_BANDS; band += 1) {
      this.shown[band] = this.deep[band]! + (this.next[band]! - this.deep[band]!) * through;
    }
    return this.shown;
  }

  private rebuild(mark: number): void {
    this.deep.fill(0);
    this.mark = Math.max(0, lastBareGround(mark * STEP_HOURS) / STEP_HOURS);
  }

  /** One hour of snow falling and melting, at every height at once. */
  private advance(deep: number[], step: number, held: WeatherKind | null): void {
    const hours = step * STEP_HOURS;
    // The yearly zero, so walking through a winter and jumping into it agree.
    if (hours === lastBareGround(hours)) deep.fill(0);
    const look = KIND_LOOKS[held ?? kindAt(hours, this.moment).kind];
    for (let band = 0; band < SNOW_BANDS; band += 1) {
      const temperature = weatherTemperature(
        hours,
        band * BAND_METRES,
        look.cover,
        look.precipitation,
      );
      let depth = deep[band]!;
      if (temperature < FREEZING) {
        depth += look.precipitation * FALL_PER_HOUR * STEP_HOURS;
      } else {
        const melting = MELT_PER_DEGREE_DAY * temperature + RAIN_MELT_PER_DAY * look.precipitation;
        depth -= (melting * STEP_HOURS) / 24;
      }
      deep[band] = Math.min(DEEPEST, Math.max(0, depth));
    }
  }
}

/** Reads between the bands: the depth at any height. */
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
