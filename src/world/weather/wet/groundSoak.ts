import { HOURS_PER_DAY } from "../../calendar/calendar";
import { halfDayHours, SOLAR_NOON_HOUR } from "../../celestialPath";
import { kindAt, type WeatherMoment } from "../sampleWeather";
import { KIND_LOOKS, type WeatherKind } from "../weatherKinds";
import { weatherTemperature } from "../weatherTemperature";

/** How much water the ground is holding: darkening it, and standing in puddles. */
export type Soak = { wet: number; puddles: number };

/** Hours of weather looked back over. Older rain has dried, so the date alone rebuilds this. */
const WINDOW_HOURS = 24;
/** Worked out on this grid and blended between, so it never steps visibly. */
const STEP_HOURS = 1 / 12;
/** Hours of the heaviest rain to soak dry ground. */
const SOAK_HOURS = 0.4;
/** Hours of that rain on soaked ground before puddles stand. */
const POOL_HOURS = 1.6;
/** Hours to dry out, in sun and no wind. Night, cloud and cold are several times slower. */
const DRY_HOURS = 4;
/** Puddles go last, as they do after real rain. */
const DRAIN_HOURS = 7;
/** Below this it falls as snow, which lies instead of soaking in (snow cover is its own phase). */
const FREEZING = 0.5;

/**
 * How wet the ground is now, from the weather of the last day.
 *
 * The weather is a function of time and nothing about it is stored, so this
 * cannot be either: it is the same sum replayed over a window that ends now.
 * What fell more than a day ago has dried, so the window is a day, and the
 * answer is the same whether the player walked here or jumped the clock.
 *
 * Walking forward, only the newest step is worked out. The whole window is
 * replayed only when the clock jumps or runs backwards, which is the menu.
 */
export class SoakTrail {
  private readonly soak: Soak = { wet: 0, puddles: 0 };
  private readonly next: Soak = { wet: 0, puddles: 0 };
  private readonly shown: Soak = { wet: 0, puddles: 0 };
  private readonly moment: WeatherMoment = { kind: "clear", hail: false };
  private mark = Number.NaN;

  /**
   * `altitude` is the player's height over the sea, which decides whether it
   * is rain or snow up here; `held` is the kind the menu is holding, if any.
   */
  at(totalHours: number, altitude: number, held: WeatherKind | null): Readonly<Soak> {
    const mark = Math.floor(totalHours / STEP_HOURS);
    const behind = mark - this.mark;
    if (!(behind >= 0 && behind <= WINDOW_HOURS / STEP_HOURS)) this.rebuild(mark);
    for (let step = this.mark; step < mark; step += 1) {
      this.advance(this.soak, step * STEP_HOURS, altitude, held);
    }
    this.mark = mark;
    // One step ahead as well, and the answer eased between: the grid is
    // coarse enough that a whole step of rain would show as a jump.
    this.next.wet = this.soak.wet;
    this.next.puddles = this.soak.puddles;
    this.advance(this.next, mark * STEP_HOURS, altitude, held);
    const through = totalHours / STEP_HOURS - mark;
    this.shown.wet = this.soak.wet + (this.next.wet - this.soak.wet) * through;
    this.shown.puddles = this.soak.puddles + (this.next.puddles - this.soak.puddles) * through;
    return this.shown;
  }

  private rebuild(mark: number): void {
    this.soak.wet = 0;
    this.soak.puddles = 0;
    this.mark = mark - Math.round(WINDOW_HOURS / STEP_HOURS);
  }

  /** One grid step of soaking and drying, from the weather at that moment. */
  private advance(soak: Soak, hours: number, altitude: number, held: WeatherKind | null): void {
    const kind = held ?? kindAt(hours, this.moment).kind;
    const look = KIND_LOOKS[kind];
    const temperature = weatherTemperature(hours, altitude, look.cover, look.precipitation);
    const falling = temperature < FREEZING ? 0 : look.precipitation;
    // Sun and wind carry the water off; a cold, still, overcast night barely does.
    const daylight = sunIsUp(hours) ? 1 : 0;
    const airing =
      temperature < 0 ? 0 : (0.3 + 0.7 * daylight * (1 - 0.75 * look.cover)) * (1 + look.wind / 12);
    const wet = soak.wet + (falling * STEP_HOURS) / SOAK_HOURS - (airing * STEP_HOURS) / DRY_HOURS;
    soak.wet = Math.min(1, Math.max(0, wet));
    // Puddles only once the ground can take no more, and they go last.
    const standing = soak.wet > 0.85 ? falling : 0;
    const pooled =
      soak.puddles + (standing * STEP_HOURS) / POOL_HOURS - (airing * STEP_HOURS) / DRAIN_HOURS;
    soak.puddles = Math.min(1, Math.max(0, pooled));
    // Ground with water standing on it is never dry ground: the puddle keeps it soaked.
    soak.wet = Math.max(soak.wet, soak.puddles);
  }
}

function sunIsUp(totalHours: number): boolean {
  const day = Math.floor(totalHours / HOURS_PER_DAY);
  const hour = totalHours - day * HOURS_PER_DAY;
  return Math.abs(hour - SOLAR_NOON_HOUR) < halfDayHours(day * HOURS_PER_DAY + SOLAR_NOON_HOUR);
}
