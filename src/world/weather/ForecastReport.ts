import { SEA_LEVEL } from "../terrain/terrainConstants";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { publishStats } from "../../ui/bridge";
import { HOURS_PER_DAY } from "../calendar/calendar";
import { forecastFor } from "./forecast";

/**
 * Tells the panel what tomorrow brings, once a day.
 *
 * The forecast is not a guess: it is the same function of the date the day
 * itself will run, so what is promised is what turns up.
 */
export class ForecastReport {
  private shownDay = -1;

  constructor(private readonly eye: Vector3) {}

  update(totalHours: number): void {
    const tomorrow = Math.floor(totalHours / HOURS_PER_DAY) + 1;
    if (tomorrow === this.shownDay) return;
    this.shownDay = tomorrow;
    publishStats({ forecast: forecastFor(tomorrow, this.eye.y - SEA_LEVEL) });
  }
}
