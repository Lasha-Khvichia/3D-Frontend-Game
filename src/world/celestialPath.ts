import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FIRST_DAY_OF_GAME, HOURS_PER_DAY } from "./calendar/calendar";
import { declinationAt, solarLongitude } from "./calendar/solarYear";

/**
 * Where the sun and moon sit in the sky.
 *
 * This is the standard horizontal-coordinate conversion from astronomy: given
 * the observer's latitude, a body's declination and its hour angle, it returns
 * a unit vector pointing at that body.
 *
 * Axes: +x east, +y up, +z north. The sun's path through the year is in
 * `calendar/solarYear.ts`.
 */

const DEGREES = Math.PI / 180;

/** Mid-northern: the longest day is 15.4 hours and the shortest 8.6. */
const OBSERVER_LATITUDE = 45 * DEGREES;

/**
 * The sun is highest at 13:00 all year, not 12:00, as across most of Europe:
 * the clocks run an hour ahead of the sun, which moves daylight into the
 * evening. Days grow and shrink evenly either side of this hour.
 */
export const SOLAR_NOON_HOUR = 13;

/**
 * The moon travels its own orbit while the world turns underneath it, so it
 * falls about 50 minutes behind the sun every day and works all the way round
 * in 29.5 days. That lag is what makes the moon rise a little later each
 * night, and why it sometimes hangs in the daytime sky.
 */
const LUNAR_MONTH_HOURS = 29.5306 * HOURS_PER_DAY;
/** Full on the game's first night, 1 to 2 March, so night one has a proper moon. */
const FULL_MOON_HOURS = (FIRST_DAY_OF_GAME + 1) * HOURS_PER_DAY + SOLAR_NOON_HOUR - 12;

/** The sun's angle west of due south, in radians: 0 at solar noon, negative in the morning. */
export function solarHourAngle(totalHours: number): number {
  return ((totalHours - SOLAR_NOON_HOUR) / HOURS_PER_DAY) * Math.PI * 2;
}

/** Hours from sunrise to solar noon today: 7.7 at midsummer, 4.3 at midwinter. */
export function halfDayHours(totalHours: number): number {
  const across = -Math.tan(OBSERVER_LATITUDE) * Math.tan(declinationAt(solarLongitude(totalHours)));
  return (Math.acos(Math.min(1, Math.max(-1, across))) / (Math.PI * 2)) * HOURS_PER_DAY;
}

/** Writes a unit vector pointing at the sun. Takes hours since the calendar began. */
export function sunDirectionAt(totalHours: number, out: Vector3): void {
  toHorizonVector(solarHourAngle(totalHours), declinationAt(solarLongitude(totalHours)), out);
}

/**
 * Writes a unit vector pointing at the moon.
 *
 * The moon keeps close to the sun's yearly path through the stars, so how
 * high it rides depends on how far round that path it has got from the sun.
 * A full moon stands opposite the sun, which is why it rides high through
 * long winter nights and skims the horizon on short summer ones.
 */
export function moonDirectionAt(totalHours: number, out: Vector3): void {
  // How far the moon has fallen behind the sun: none when new, half a turn when full.
  const behindSun = Math.PI + ((totalHours - FULL_MOON_HOURS) / LUNAR_MONTH_HOURS) * Math.PI * 2;
  const hourAngle = solarHourAngle(totalHours) - behindSun;
  toHorizonVector(hourAngle, declinationAt(solarLongitude(totalHours) + behindSun), out);
}

function toHorizonVector(hourAngle: number, declination: number, out: Vector3): void {
  const sinDeclination = Math.sin(declination);
  const cosDeclination = Math.cos(declination);
  const sinLatitude = Math.sin(OBSERVER_LATITUDE);
  const cosLatitude = Math.cos(OBSERVER_LATITUDE);
  const cosHourAngle = Math.cos(hourAngle);

  out.set(
    -cosDeclination * Math.sin(hourAngle),
    sinDeclination * sinLatitude + cosDeclination * cosLatitude * cosHourAngle,
    sinDeclination * cosLatitude - cosDeclination * sinLatitude * cosHourAngle,
  );
  out.normalize();
}
