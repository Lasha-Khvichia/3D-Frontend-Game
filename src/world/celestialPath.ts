import type { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * Where the sun and moon sit in the sky.
 *
 * This is the standard horizontal-coordinate conversion from astronomy: given
 * the observer's latitude, a body's declination and its hour angle, it returns
 * a unit vector pointing at that body.
 *
 * Axes: +x east, +y up, +z north.
 */

const DEGREES = Math.PI / 180;
const HOURS_PER_TURN = 24;

/**
 * Latitude and declination are chosen together so the sun crosses the horizon
 * at exactly 06:00 and 21:00, a 15 hour day:
 *
 *   cos(halfDayAngle) = -tan(latitude) * tan(declination)
 *   halfDay 7.5 h  ->  halfDayAngle 112.5 deg  ->  cos = -0.38268
 *   tan(45 deg) * tan(declination) = 0.38268  ->  declination = 20.95 deg
 *
 * That is a real place and a real date: mid-northern latitude in high summer.
 */
const OBSERVER_LATITUDE = 45 * DEGREES;
const SUN_DECLINATION = 20.95 * DEGREES;

export const SUNRISE_HOUR = 6;
export const SUNSET_HOUR = 21;
/** Halfway between sunrise and sunset, when the sun is highest. */
export const SOLAR_NOON_HOUR = (SUNRISE_HOUR + SUNSET_HOUR) / 2;

/**
 * A lunar day is 24 h 50.5 min, not 24 h. The moon travels its own orbit while
 * the world turns underneath it, so it falls about 50 minutes behind the sun
 * every day and works all the way around in 29.5 days. That lag is what makes
 * the moon rise a little later each night, and why it sometimes hangs in the
 * daytime sky long after it should have gone down.
 */
const LUNAR_DAY_HOURS = 24.841;
/** Starts the moon opposite the sun, so night one has a proper high moon. */
const LUNAR_PHASE_OFFSET_HOURS = LUNAR_DAY_HOURS / 2;
/** The moon's declination swings over a 27.32 day month, tilting its arc. */
const LUNAR_DECLINATION_PERIOD_HOURS = 27.32 * 24;
const LUNAR_DECLINATION_RANGE = 23 * DEGREES;

/** Writes a unit vector pointing at the sun. Takes the hour of day, 0 to 24. */
export function sunDirectionAt(hourOfDay: number, out: Vector3): void {
  const hourAngle = ((hourOfDay - SOLAR_NOON_HOUR) / HOURS_PER_TURN) * Math.PI * 2;
  toHorizonVector(hourAngle, SUN_DECLINATION, out);
}

/**
 * Writes a unit vector pointing at the moon. Takes total hours since the game
 * started, not the hour of day, because the moon drifts across days.
 */
export function moonDirectionAt(totalHours: number, out: Vector3): void {
  const sinceNoon = totalHours - SOLAR_NOON_HOUR - LUNAR_PHASE_OFFSET_HOURS;
  const hourAngle = (sinceNoon / LUNAR_DAY_HOURS) * Math.PI * 2;
  const declination =
    LUNAR_DECLINATION_RANGE * Math.sin((totalHours / LUNAR_DECLINATION_PERIOD_HOURS) * Math.PI * 2);
  toHorizonVector(hourAngle, declination, out);
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
