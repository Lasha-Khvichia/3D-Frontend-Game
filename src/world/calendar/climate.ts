import { DAYS_PER_YEAR, HOURS_PER_DAY, SUMMER_SOLSTICE_DAY } from "./calendar";
import { SOLAR_NOON_HOUR, halfDayHours } from "../celestialPath";

/**
 * The island's climate: the air temperature an ordinary day brings at this
 * date and hour, before any weather. Weather pushes it up and down from here.
 *
 * Modelled on an inland mid-latitude climate with four strong seasons, like
 * Kyiv's: about 25 °C on a midsummer afternoon, −6 °C on a midwinter dawn,
 * and snow that lies for weeks.
 */

/** The average over the whole year, at sea level. */
const YEAR_MEAN = 8;
/** How far the warmest and coldest weeks sit either side of the average. */
const SEASON_SWING = 12;
/** Land takes about a month to catch up with the sun, so the warmest weeks follow midsummer. */
const WARMEST_DAY = SUMMER_SOLSTICE_DAY + 33;
/** Half the rise from dawn to afternoon: wider in summer, when the days are long and the sun is high. */
const DAY_SWING_SUMMER = 5;
const DAY_SWING_WINTER = 2.5;
/** The warmest hour comes after the sun's highest, while the ground is still giving back heat. */
const WARMEST_AFTER_NOON = 2.5;
/** Air cools 6.5 °C for every kilometre climbed. */
const COOLING_PER_METRE = 0.0065;

/**
 * Degrees Celsius, at a height above the sea in metres. `dayRange` scales the
 * rise from dawn to afternoon — cloud flattens it — and `offset` is the
 * weather's own warm or cold spell.
 */
export function airTemperature(
  totalHours: number,
  altitude: number,
  dayRange = 1,
  offset = 0,
): number {
  const turn = (totalHours / HOURS_PER_DAY - WARMEST_DAY) / DAYS_PER_YEAR;
  const season = Math.cos(turn * Math.PI * 2);
  const dayMean = YEAR_MEAN + SEASON_SWING * season;
  const daySwing =
    (DAY_SWING_SUMMER + DAY_SWING_WINTER) / 2 +
    (season * (DAY_SWING_SUMMER - DAY_SWING_WINTER)) / 2;
  const height = COOLING_PER_METRE * Math.max(0, altitude);
  return dayMean + offset + daySwing * dayRange * dayCurve(totalHours) - height;
}

/**
 * −1 at sunrise, the coldest moment, climbing to +1 in mid-afternoon and
 * falling back through the night. Half a cosine each way, so it never jumps.
 */
function dayCurve(totalHours: number): number {
  const sunrise = SOLAR_NOON_HOUR - halfDayHours(totalHours);
  const warming = SOLAR_NOON_HOUR + WARMEST_AFTER_NOON - sunrise;
  const sinceSunrise = (((totalHours - sunrise) % HOURS_PER_DAY) + HOURS_PER_DAY) % HOURS_PER_DAY;
  if (sinceSunrise <= warming) return -Math.cos((sinceSunrise / warming) * Math.PI);
  return Math.cos(((sinceSunrise - warming) / (HOURS_PER_DAY - warming)) * Math.PI);
}
