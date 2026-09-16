import type { Scene } from "@babylonjs/core/scene";
import { TimeOfDay } from "./TimeOfDay";
import { CalendarReport } from "./calendar/CalendarReport";
import { SunAndMoon } from "./SunAndMoon";
import { SceneLighting } from "./SceneLighting";

export type DayNightCycleOptions = {
  /** Hours since the calendar began, when the game opens. Defaults to 10:00 on 1 March. */
  startHours?: number;
  /** Real seconds for one full in-game day. Defaults to 1200. */
  realSecondsPerGameDay?: number;
};

/**
 * Drives the sun and moon, the sky's colours and the light from the in-game
 * clock and calendar.
 *
 * Advance it from the fixed simulation step, never from the render frame, or
 * the cycle runs faster on a 144Hz monitor than on a 60Hz one.
 */
export class DayNightCycle {
  /** The sun and moon themselves: directions, lights, discs, halos and shadows. */
  readonly sunAndMoon: SunAndMoon;
  /** The sky's colours, the air and the fill light, with the weather and lightning in them. */
  readonly light: SceneLighting;
  private readonly clock: TimeOfDay;
  private readonly report = new CalendarReport();
  private clockFrozen = false;

  constructor(scene: Scene, options: DayNightCycleOptions = {}) {
    this.sunAndMoon = new SunAndMoon(scene);
    this.light = new SceneLighting(scene, this.sunAndMoon);
    this.clock = new TimeOfDay(options.startHours, options.realSecondsPerGameDay);
    this.apply();
  }

  get currentHour(): number {
    return this.clock.currentHour;
  }

  /** Hours since the calendar began, for the date and anything that turns with the sky. */
  get totalHours(): number {
    return this.clock.totalHours;
  }

  /** Whole days since the calendar began. */
  get dayNumber(): number {
    return this.clock.dayNumber;
  }

  /** Repaints from the clock and the weather now, without advancing. */
  refresh(): void {
    this.apply();
  }

  /** Jump to a day of this year, 0 for 1 January to 364, keeping the hour. */
  setDayOfYear(day: number): void {
    this.clock.setDayOfYear(day);
    this.apply();
  }

  advance(fixedDeltaSeconds: number): void {
    if (!this.clockFrozen) this.clock.advance(fixedDeltaSeconds);
    this.apply();
  }

  /** Holds the sun and moon where they are without pausing the game. */
  setClockFrozen(frozen: boolean): void {
    this.clockFrozen = frozen;
  }

  /** Jump to an hour. Out-of-range values wrap: 26 becomes 2. */
  setTimeOfDay(hour: number): void {
    this.clock.set(hour);
    this.apply();
  }

  private apply(): void {
    const hours = this.clock.totalHours;
    this.sunAndMoon.place(hours);
    this.light.paint(hours);
    this.report.publish(hours);
  }
}
