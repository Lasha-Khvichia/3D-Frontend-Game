import { publishStats } from "../../ui/bridge";
import { wrapHours } from "../TimeOfDay";
import { dateAt } from "./calendar";

/**
 * Tells the overlay the time and the date. Only when the shown minute
 * changes — about once a real second — so React re-renders rarely, never at
 * frame rate. The temperature is the weather's to report.
 */
export class CalendarReport {
  private lastMinute = Number.NaN;

  publish(totalHours: number): void {
    const minute = Math.floor(totalHours * 60);
    if (minute === this.lastMinute) return;
    this.lastMinute = minute;
    publishStats({ timeOfDayHours: wrapHours(totalHours), date: dateAt(totalHours) });
  }
}
