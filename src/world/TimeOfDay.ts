const HOURS_PER_DAY = 24;
/** 08:00 puts the sun about 25 degrees up, inside the starting camera view. */
const DEFAULT_START_HOUR = 8;
const DEFAULT_REAL_SECONDS_PER_GAME_DAY = 300;

/**
 * The in-game clock.
 *
 * `currentHour` wraps at 24 and drives the sun. `totalHours` never wraps and
 * drives the moon, which needs to know how many days have passed.
 */
export class TimeOfDay {
  private elapsedHours = 0;
  private readonly startHour: number;

  constructor(
    startHour: number = DEFAULT_START_HOUR,
    private readonly realSecondsPerGameDay: number = DEFAULT_REAL_SECONDS_PER_GAME_DAY,
  ) {
    this.startHour = wrapHours(startHour);
  }

  /** Hour of day, 0 to 24. */
  get currentHour(): number {
    return wrapHours(this.totalHours);
  }

  /** Hours since the game started, plus the starting hour. Never wraps. */
  get totalHours(): number {
    return this.startHour + this.elapsedHours;
  }

  /** Whole days since the game started. Day 0 is the first day. */
  get dayNumber(): number {
    return Math.floor(this.totalHours / HOURS_PER_DAY);
  }

  /** Feed this the fixed simulation delta, never the render frame delta. */
  advance(realDeltaSeconds: number): void {
    this.elapsedHours += (realDeltaSeconds / this.realSecondsPerGameDay) * HOURS_PER_DAY;
  }

  /** Jump to an hour on the current day. Out of range wraps: 26 becomes 2. */
  set(hour: number): void {
    const dayStart = this.dayNumber * HOURS_PER_DAY;
    this.elapsedHours = dayStart + wrapHours(hour) - this.startHour;
  }

  /** Skip whole days forward. Useful for watching the moon drift. */
  skipDays(days: number): void {
    this.elapsedHours += days * HOURS_PER_DAY;
  }
}

export function wrapHours(hours: number): number {
  return ((hours % HOURS_PER_DAY) + HOURS_PER_DAY) % HOURS_PER_DAY;
}
