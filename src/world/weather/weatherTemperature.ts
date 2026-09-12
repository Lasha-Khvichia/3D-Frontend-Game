import { airTemperature } from "../calendar/climate";
import { wandering } from "./weatherNoise";

/**
 * The air temperature the weather makes of the climate's.
 *
 * - Warm and cold spells: the weather wanders a few degrees either side of
 *   the usual for days at a time, five in winter and three in summer. A
 *   winter spell above freezing is a thaw, and rain instead of snow.
 * - Cloud evens the day out: less sun by day, a blanket by night. Under full
 *   cover the rise from dawn to afternoon is 40% of a clear day's.
 * - Rain cools warm air as the drops evaporate, by up to 2 °C.
 */
export function weatherTemperature(
  totalHours: number,
  altitude: number,
  cover: number,
  precipitation: number,
): number {
  const usual = airTemperature(totalHours, altitude);
  const winterness = Math.min(1, Math.max(0, (12 - usual) / 20));
  const spell = (3 + 2 * winterness) * wandering(totalHours / 96, 3);
  const cooling = 2 * precipitation * Math.min(1, Math.max(0, (usual - 5) / 10));
  return airTemperature(totalHours, altitude, 1 - 0.6 * cover, spell - cooling);
}
