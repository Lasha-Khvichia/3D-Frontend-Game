import type { WeatherKind } from "./weatherKinds";

export type PrecipitationForm = "none" | "rain" | "sleet" | "snow" | "hail";

/** The weather at this moment, blended hour to hour. One object, rewritten every step. */
export type WeatherState = {
  /** The kind the hour is turning into, for naming it. */
  kind: WeatherKind;
  hail: boolean;
  cover: number;
  darkness: number;
  /** Metres. */
  visibility: number;
  precipitation: number;
  purple: number;
  /** Ground mist, 0 to 1. */
  mist: number;
  /** Metres a second at the ground. */
  wind: number;
  /** The way the wind blows towards, in radians: 0 north, a quarter turn east. */
  heading: number;
  /** Degrees Celsius where the player stands. */
  temperature: number;
  form: PrecipitationForm;
};

/** Anything the weather changes: the sky, the air, the trees, the smoke. */
export type WeatherListener = { setWeather(state: Readonly<WeatherState>): void };

export function createWeatherState(): WeatherState {
  return {
    kind: "clear",
    hail: false,
    cover: 0,
    darkness: 0,
    visibility: 3000,
    precipitation: 0,
    purple: 0,
    mist: 0,
    wind: 3,
    heading: Math.PI / 2,
    temperature: 10,
    form: "none",
  };
}

/** What falls: snow below half a degree, sleet up to two and a half, hail from summer storms. */
export function formOf(state: Readonly<WeatherState>): PrecipitationForm {
  if (state.precipitation <= 0.01) return "none";
  if (state.hail && state.temperature > 4) return "hail";
  if (state.temperature < 0.5) return "snow";
  return state.temperature < 2.5 ? "sleet" : "rain";
}

/** What the stats panel calls it. */
export function weatherName(state: Readonly<WeatherState>): string {
  const snow = state.form === "snow";
  const sleet = state.form === "sleet";
  switch (state.kind) {
    case "drizzle":
      return snow ? "Light snow" : sleet ? "Sleet" : "Drizzle";
    case "rain":
      return snow ? "Snow" : sleet ? "Sleet" : "Rain";
    case "downpour":
      if (snow) return state.wind >= 10 ? "Blizzard" : "Heavy snow";
      return sleet ? "Heavy sleet" : "Downpour";
    case "thunderstorm":
      return state.form === "hail" ? "Hailstorm" : snow ? "Thundersnow" : "Thunderstorm";
    case "purple":
      return "Purple sky";
    case "fog":
      return "Fog";
    default:
      if (state.mist > 0.3) return "Mist";
      return state.kind.charAt(0).toUpperCase() + state.kind.slice(1);
  }
}
