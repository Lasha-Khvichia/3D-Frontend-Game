import { DAYS_PER_YEAR, FIRST_DAY_OF_GAME, HOURS_PER_DAY } from "./calendar/calendar";

/** The game opens at 10:00 on 1 March, the first morning of spring, the sun 23 degrees up. */
const DEFAULT_START_HOURS = FIRST_DAY_OF_GAME * HOURS_PER_DAY + 10;
/** Twenty real minutes: a season is about 30 hours of play, a year about 122. */
const DEFAULT_REAL_SECONDS_PER_GAME_DAY = 1200;

/**
 * The in-game clock.
 *
 * It holds one number, the hours since the first midnight of the calendar,
 * and never wraps. `currentHour` is that number folded into a day and drives
 * the sun's daily arc; the whole number drives the date, the seasons, the moon
 * and the stars. See `calendar/calendar.ts`.
 */
export class TimeOfDay {
  private hours: number;

  constructor(
    startHours: number = DEFAULT_START_HOURS,
    private readonly realSecondsPerGameDay: number = DEFAULT_REAL_SECONDS_PER_GAME_DAY,
  ) {
    this.hours = startHours;
  }

  /** Hour of day, 0 to 24. */
  get currentHour(): number {
    return wrapHours(this.hours);
  }

  /** Hours since the calendar began. Never wraps. */
  get totalHours(): number {
    return this.hours;
  }

  /** Whole days since the calendar began. Day 0 is 1 January, Year 1. */
  get dayNumber(): number {
    return Math.floor(this.hours / HOURS_PER_DAY);
  }

  /** Feed this the fixed simulation delta, never the render frame delta. */
  advance(realDeltaSeconds: number): void {
    this.hours += (realDeltaSeconds / this.realSecondsPerGameDay) * HOURS_PER_DAY;
  }

  /** Jump to an hour on the current day. Out of range wraps: 26 becomes 2. */
  set(hour: number): void {
    this.hours = this.dayNumber * HOURS_PER_DAY + wrapHours(hour);
  }

  /** Jump to a day of this year, 0 for 1 January to 364, keeping the hour. */
  setDayOfYear(day: number): void {
    const yearStart = Math.floor(this.dayNumber / DAYS_PER_YEAR) * DAYS_PER_YEAR;
    const wrapped = ((Math.round(day) % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR;
    this.hours = (yearStart + wrapped) * HOURS_PER_DAY + this.currentHour;
  }
}

export function wrapHours(hours: number): number {
  return ((hours % HOURS_PER_DAY) + HOURS_PER_DAY) % HOURS_PER_DAY;
}
