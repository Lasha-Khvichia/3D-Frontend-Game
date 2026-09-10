import { publishStats } from "../../ui/bridge";
import { SEA_LEVEL } from "../terrain/terrainConstants";
import { wrapHours } from "../TimeOfDay";
import { dateAt } from "./calendar";
import { airTemperature } from "./climate";

/**
 * Tells the overlay the time, the date and the air temperature where the
 * player stands. Only when the shown minute changes — about once a real
 * second — so React re-renders rarely, never at frame rate.
 */
export class CalendarReport {
  private lastMinute = Number.NaN;

  publish(totalHours: number, height: number): void {
    const minute = Math.floor(totalHours * 60);
    if (minute === this.lastMinute) return;
    this.lastMinute = minute;
    publishStats({
      timeOfDayHours: wrapHours(totalHours),
      date: dateAt(totalHours),
      airTemperature: airTemperature(totalHours, height - SEA_LEVEL),
    });
  }
}
