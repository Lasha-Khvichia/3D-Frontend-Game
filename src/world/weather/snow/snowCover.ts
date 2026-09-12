import { airTemperature } from "../../calendar/climate";
import { MOUNTAIN_RANGES } from "../../terrain/landRelief";

/**
 * The two ranges that keep their snow: the great massif north of the island
 * and the southern one. The eastern hill is 150 m and stays bare rock — the
 * player's choice, and it gives the east a different look.
 */
export const SNOWY_RANGES = [MOUNTAIN_RANGES[0]!, MOUNTAIN_RANGES[1]!] as const;

/** Highest the snow line ever sits. Above this the snow never melts, in any year. */
const SUMMER_LINE = 95;
/** Lowest it comes in the coldest weeks. Well above the settlements: lowland snow is its own phase. */
const WINTER_LINE = 45;
/** Metres from bare ground to full cover. */
export const SNOW_EDGE = 14;
/** Day means that map to the two lines: 10 °C is summer's, −4 °C midwinter's. */
const MILD = 10;
const COLD = -4;

/**
 * Where snow lies on the island: always on the two high ranges, and further
 * down their slopes through the winter.
 *
 * The line follows the climate rather than a calendar of its own, so it
 * creeps down through autumn and lifts through spring without a date
 * anywhere. Like the weather, it is a function of time: nothing is stored,
 * so the same day always has the same snow, and a saved game comes back to it.
 */
export function snowLineAt(totalHours: number): number {
  // The day's mean at sea level: no daily swing, so the line does not bob
  // up and down between dawn and afternoon.
  const mean = airTemperature(totalHours, 0, 0);
  const winterness = Math.min(1, Math.max(0, (MILD - mean) / (MILD - COLD)));
  return SUMMER_LINE - (SUMMER_LINE - WINTER_LINE) * winterness;
}

/** 1 where the ground belongs to a snowy range, 0 elsewhere. */
export function inSnowyRange(x: number, z: number): number {
  for (const range of SNOWY_RANGES) {
    if (Math.hypot(x - range.x, z - range.z) < range.radius) return 1;
  }
  return 0;
}

/** How deep the cover is here, 0 to 1, before the slope thins it. */
export function snowCoverAt(x: number, z: number, height: number, totalHours: number): number {
  if (inSnowyRange(x, z) === 0) return 0;
  const line = snowLineAt(totalHours);
  return Math.min(1, Math.max(0, (height - line) / SNOW_EDGE));
}
