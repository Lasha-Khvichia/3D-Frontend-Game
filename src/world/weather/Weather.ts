import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { publishStats } from "../../ui/bridge";
import { SEA_LEVEL } from "../terrain/terrainConstants";
import { KIND_LOOKS, type WeatherKind, type WeatherLook } from "./weatherKinds";
import { wandering } from "./weatherNoise";
import { blendLooks } from "./blendLooks";
import { kindAt, mistAt, type WeatherMoment } from "./sampleWeather";
import { weatherTemperature } from "./weatherTemperature";
import {
  createWeatherState,
  formOf,
  weatherName,
  type WeatherListener,
  type WeatherState,
} from "./weatherState";

/** Where the wind usually blows towards: east, off the westerlies. */
const PREVAILING_HEADING = Math.PI / 2;

/**
 * The weather: worked out afresh every step from the date and hour, never
 * stored, so the same moment always has the same weather — a forecast is the
 * same sum done for tomorrow. Each hour has a kind (`dayPlans.ts` decides
 * them), and the look eases across them (`blendLooks`).
 */
export class Weather {
  readonly state: WeatherState = createWeatherState();
  private readonly listeners: WeatherListener[] = [];
  /** The kinds at four hour marks round now: the hour before, this, the next, the one after. */
  private readonly marks: WeatherMoment[] = [0, 1, 2, 3].map(() => ({
    kind: "clear",
    hail: false,
  }));
  private readonly looks: WeatherLook[] = [0, 1, 2, 3].map(() => KIND_LOOKS.clear);
  private forced: WeatherKind | null = null;
  private shownName = "";
  private shownTemperature = Number.NaN;

  /** `eye` is where the player stands: the temperature, and so rain or snow, is taken there. */
  constructor(private readonly eye: Vector3) {}

  /** Everything that follows the weather gets every step's. */
  addListener(listener: WeatherListener): void {
    this.listeners.push(listener);
  }

  /** For testing from the menu: hold one kind of weather, or null to let it run. */
  force(kind: WeatherKind | null): void {
    this.forced = kind;
  }

  /** The kind the menu is holding, if any: what soaked the ground has to follow it too. */
  get held(): WeatherKind | null {
    return this.forced;
  }

  update(totalHours: number): void {
    const state = this.state;
    const hour = Math.floor(totalHours);
    for (let i = 0; i < 4; i += 1) {
      const mark = kindAt(hour - 1 + i, this.marks[i]!);
      if (this.forced) mark.kind = this.forced;
      this.looks[i] = KIND_LOOKS[mark.kind];
    }
    const t = totalHours - hour;
    blendLooks(this.looks, t, this.state);
    const now = this.marks[t < 0.5 ? 1 : 2]!;
    state.kind = now.kind;
    state.hail = now.hail && !this.forced;
    // Calmer or wilder from day to day, swinging slowly either side of the westerly.
    state.wind *= 1 + 0.4 * wandering(totalHours / 30, 1);
    state.heading = PREVAILING_HEADING + 1.1 * wandering(totalHours / 40, 2);
    // Ground mist lies low (`HeightMistPlugin`), so it does not shorten the view over it.
    state.mist = this.forced ? 0 : mistAt(totalHours);
    const altitude = this.eye.y - SEA_LEVEL;
    state.temperature = weatherTemperature(totalHours, altitude, state.cover, state.precipitation);
    state.form = formOf(state);
    // Falling snow hides far more than rain does, and a blizzard nearly everything.
    if (state.form === "snow") {
      state.visibility = Math.min(state.visibility, 1400 - 1100 * state.precipitation);
      if (state.wind >= 10 && state.precipitation > 0.4) state.visibility = 120;
    }
    for (const listener of this.listeners) listener.setWeather(state);
    this.report();
  }

  /** Tells the overlay only when the name or the whole degree changes. */
  private report(): void {
    const name = weatherName(this.state);
    const temperature = Math.round(this.state.temperature);
    if (name === this.shownName && temperature === this.shownTemperature) return;
    this.shownName = name;
    this.shownTemperature = temperature;
    publishStats({ weather: name, airTemperature: this.state.temperature });
  }
}
