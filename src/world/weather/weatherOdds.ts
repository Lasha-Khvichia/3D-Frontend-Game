/**
 * How often each kind of weather comes, month by month, January first.
 *
 * Wet days and sunshine are Kyiv's, 1991–2020: the climate the calendar's
 * temperatures already follow, four strong seasons with snowy winters. A wet
 * day is one with any rain or snow at all, so most are a few hours of it, not
 * a day-long downpour. Fog and thunder are typical mid-continental figures.
 */

/**
 * Days a month with rain or snow: 164 a year, the station's own total, shared
 * out by month in the shape of its rainy-day and snowy-day columns. Those add
 * up to 211, because a day with both counts in each.
 */
export const WET_DAYS = [16, 15.5, 13.5, 13, 13, 13.5, 13, 10, 13, 12, 15.5, 16.5] as const;

/**
 * Share of the possible sunshine that arrives, from monthly sunshine hours
 * over daylight hours. December gets 12%: a Kyiv winter is mostly grey.
 */
export const SUNSHINE = [
  0.15, 0.22, 0.31, 0.4, 0.56, 0.58, 0.6, 0.58, 0.5, 0.36, 0.18, 0.12,
] as const;

/** Days a month that start in fog. */
export const FOG_DAYS = [6, 5, 4, 2, 1, 1, 1, 2, 3, 6, 8, 8] as const;

/**
 * Of the wet days, the share whose rain comes as afternoon showers rather
 * than a long grey spell: summer rain builds in the heat of the day.
 */
export const SHOWERY = [0, 0, 0.1, 0.3, 0.6, 0.75, 0.8, 0.75, 0.45, 0.15, 0, 0] as const;

/**
 * Of the wet days, the share with a thunderstorm: about 25 a year, nearly all
 * May to August. A typical mid-continental count, not a Kyiv figure.
 */
export const THUNDERY = [0, 0, 0.02, 0.1, 0.3, 0.45, 0.45, 0.4, 0.15, 0.03, 0, 0] as const;

/**
 * Chance that a clear, calm night ends in mist. Ground mist needs damp air
 * and a long night to cool in: most often in late summer and autumn.
 */
export const MISTY = [0.1, 0.1, 0.2, 0.25, 0.25, 0.3, 0.35, 0.45, 0.5, 0.45, 0.25, 0.1] as const;

/**
 * Chance that a wet day follows a wet day. Weather comes in spells: with
 * this, rain on one day makes rain the next more likely, as in real records
 * (typical mid-latitude values are 0.5 to 0.7).
 */
export const WET_AFTER_WET = 0.6;

/**
 * Chance of a wet day after a dry one, worked back from the share of wet days
 * and the persistence above, so the long-run count comes out right:
 * share = p / (1 + p − WET_AFTER_WET).
 */
export function wetAfterDry(month: number, daysInMonth: number): number {
  const share = Math.min(0.9, (WET_DAYS[month] ?? 12) / daysInMonth);
  return (share * (1 - WET_AFTER_WET)) / (1 - share);
}
