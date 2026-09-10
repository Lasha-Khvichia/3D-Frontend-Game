import { DAYS_PER_YEAR, HOURS_PER_DAY } from "./calendar";

/**
 * The sun's slow yearly path through the sky, which is what the seasons are.
 * `celestialPath.ts` turns this into where the sun stands at an hour.
 */

const DEGREES = Math.PI / 180;

/** The tilt of the world's axis, which is the whole reason there are seasons. */
const AXIAL_TILT = 23.44 * DEGREES;

/**
 * The world's orbit is a slightly squashed circle, closest to the sun on
 * 3 January. The sun runs ahead of its average pace through winter and
 * behind it through summer — which is why the summer half of the year is a
 * week longer — by up to 1.9 degrees.
 *
 * 3 January is day 2; the fraction is tuned so the equinoxes fall on
 * 20 March and 22 September and the solstices on 21 June and 21 December,
 * within a few hours of where they fall in 2026.
 */
const PERIHELION_DAY = 2.45;
const PERIHELION_LONGITUDE = 282.94 * DEGREES;
const ORBIT_LEAD = 1.915 * DEGREES;
const ORBIT_LEAD_TWICE = 0.02 * DEGREES;

/** How far round its yearly path the sun has got, in radians: 0 at the spring equinox. */
export function solarLongitude(totalHours: number): number {
  const turn = ((totalHours / HOURS_PER_DAY - PERIHELION_DAY) / DAYS_PER_YEAR) * Math.PI * 2;
  return (
    turn +
    ORBIT_LEAD * Math.sin(turn) +
    ORBIT_LEAD_TWICE * Math.sin(2 * turn) +
    PERIHELION_LONGITUDE
  );
}

/**
 * How far north of the sky's equator a point on the sun's yearly path lies:
 * 23.4 degrees at midsummer, when the sun rides high and stays up long, and
 * as far south at midwinter. The moon keeps close to the same path.
 */
export function declinationAt(longitude: number): number {
  return Math.asin(Math.sin(AXIAL_TILT) * Math.sin(longitude));
}
