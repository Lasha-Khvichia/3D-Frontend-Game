/**
 * The island's calendar is the real one: twelve months of their real lengths,
 * 365 days, no leap years. Year 1 begins on 1 January; the game opens on
 * 1 March, the first day of spring.
 *
 * Seasons are whole months, the way weather services count them: spring is
 * March to May, summer June to August, autumn September to November, winter
 * December to February. So each holds its equinox or solstice near its
 * middle month's 21st, and its coldest or warmest weeks near its middle.
 *
 * Time is counted in hours since midnight at the start of 1 January, Year 1.
 * Every date is worked out from that one number, so nothing can drift apart.
 */
export const HOURS_PER_DAY = 24;

export type Season = "spring" | "summer" | "autumn" | "winter";

type Month = { readonly name: string; readonly days: number; readonly season: Season };

export const MONTHS: readonly Month[] = [
  { name: "January", days: 31, season: "winter" },
  { name: "February", days: 28, season: "winter" },
  { name: "March", days: 31, season: "spring" },
  { name: "April", days: 30, season: "spring" },
  { name: "May", days: 31, season: "spring" },
  { name: "June", days: 30, season: "summer" },
  { name: "July", days: 31, season: "summer" },
  { name: "August", days: 31, season: "summer" },
  { name: "September", days: 30, season: "autumn" },
  { name: "October", days: 31, season: "autumn" },
  { name: "November", days: 30, season: "autumn" },
  { name: "December", days: 31, season: "winter" },
];

export const DAYS_PER_YEAR = MONTHS.reduce((days, month) => days + month.days, 0);

export type CalendarDate = {
  /** 1 onward. Turns over on 1 January. */
  readonly year: number;
  /** 0 on 1 January, 364 on 31 December. */
  readonly dayOfYear: number;
  /** 0 for January, 11 for December. */
  readonly month: number;
  /** 1 to 31. */
  readonly dayOfMonth: number;
  readonly season: Season;
};

/** The day of the year, counted from 0, of a date: `dayOf(5, 21)` is 21 June. */
export function dayOf(month: number, dayOfMonth: number): number {
  let day = dayOfMonth - 1;
  for (let before = 0; before < month; before += 1) day += MONTHS[before]?.days ?? 0;
  return day;
}

/** 1 March, the first day of spring. */
export const FIRST_DAY_OF_GAME = dayOf(2, 1);
/** 21 June: the longest day, and the shortest night. */
export const SUMMER_SOLSTICE_DAY = dayOf(5, 21);

export function dateAt(totalHours: number): CalendarDate {
  const days = Math.floor(totalHours / HOURS_PER_DAY);
  const dayOfYear = ((days % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR;
  let month = 0;
  let intoMonth = dayOfYear;
  while (month < MONTHS.length - 1 && intoMonth >= (MONTHS[month]?.days ?? 0)) {
    intoMonth -= MONTHS[month]?.days ?? 0;
    month += 1;
  }
  return {
    year: Math.floor(days / DAYS_PER_YEAR) + 1,
    dayOfYear,
    month,
    dayOfMonth: intoMonth + 1,
    season: MONTHS[month]?.season ?? "winter",
  };
}
