import { airTemperature } from "../calendar/climate";
import { HOURS_PER_DAY } from "../calendar/calendar";
import { kindAt, mistAt, type WeatherMoment } from "./sampleWeather";
import { createWeatherState, formOf, weatherName } from "./weatherState";
import { KIND_LOOKS, type WeatherKind } from "./weatherKinds";
import { windAt } from "./weatherWind";

/** What tomorrow brings, as the panel shows it. */
export type Forecast = {
  readonly dayOfYear: number;
  readonly name: string;
  readonly high: number;
  readonly low: number;
};

/** Which kind of weather a day is remembered by: the worst of it, not the most of it. */
const TELLS: readonly WeatherKind[] = [
  "purple",
  "thunderstorm",
  "downpour",
  "rain",
  "drizzle",
  "fog",
  "overcast",
  "cloudy",
  "fair",
  "clear",
];

const moment: WeatherMoment = { kind: "clear", hail: false };
const state = createWeatherState();

/**
 * The weather a day will bring, worked out the same way the day itself will
 * work it out — because the weather is a function of the date, nothing has to
 * be stored and nothing can disagree with what turns up.
 *
 * A day is named by the worst hour in it between dawn and bedtime: a wet hour
 * in an otherwise fair day is what anyone would want to be told about.
 */
export function forecastFor(day: number, altitude: number): Forecast {
  const start = day * HOURS_PER_DAY;
  let worst = TELLS.length - 1;
  let hail = false;
  let high = -Infinity;
  let low = Infinity;
  for (let hour = 5; hour <= 22; hour += 1) {
    kindAt(start + hour, moment);
    const rank = TELLS.indexOf(moment.kind);
    if (rank >= 0 && rank < worst) {
      worst = rank;
      hail = moment.hail;
    }
    const degrees = airTemperature(start + hour, altitude);
    high = Math.max(high, degrees);
    low = Math.min(low, degrees);
  }
  const kind = TELLS[worst] ?? "clear";
  state.kind = kind;
  state.hail = hail;
  state.temperature = (high + low) / 2;
  state.precipitation = KIND_LOOKS[kind].precipitation;
  state.wind = windAt(start + 13, KIND_LOOKS[kind].wind);
  state.mist = mistAt(start + 8);
  state.form = formOf(state);
  return { dayOfYear: day, name: weatherName(state), high, low };
}
