/**
 * The kinds of weather, and what each does to the sky and the air.
 *
 * Rain, sleet, snow and hail are not kinds: the same cloud brings whichever
 * the temperature allows, so a drizzle at 5 °C is light snow at −3 °C.
 * Morning mist is not a kind either; it is laid over whatever the sky is doing.
 */
export const WEATHER_KINDS = [
  "clear",
  "fair",
  "cloudy",
  "overcast",
  "fog",
  "drizzle",
  "rain",
  "downpour",
  "thunderstorm",
  "purple",
] as const;

export type WeatherKind = (typeof WEATHER_KINDS)[number];

export type WeatherLook = {
  /** Share of the sky under cloud, 0 to 1. */
  cover: number;
  /** 0 a bright sky, 1 a black storm: darkens the clouds, the air and the light. */
  darkness: number;
  /** How far one can see, in metres. */
  visibility: number;
  /** 0 nothing falling, 1 the heaviest. */
  precipitation: number;
  /** Wind at the ground, metres a second. */
  wind: number;
  /** How far towards a purple day's colours. */
  purple: number;
};

// cover darkness visibility precipitation wind purple
const look = (...v: [number, number, number, number, number, number]): WeatherLook => ({
  cover: v[0],
  darkness: v[1],
  visibility: v[2],
  precipitation: v[3],
  wind: v[4],
  purple: v[5],
});

export const KIND_LOOKS: Readonly<Record<WeatherKind, WeatherLook>> = {
  clear: look(0.04, 0, 3000, 0, 3, 0),
  fair: look(0.32, 0, 3000, 0, 4, 0),
  cloudy: look(0.58, 0.05, 3000, 0, 5, 0),
  overcast: look(0.9, 0.2, 2500, 0, 4.5, 0),
  fog: look(0.85, 0.1, 140, 0, 0.8, 0),
  drizzle: look(0.94, 0.3, 1600, 0.15, 4, 0),
  rain: look(0.96, 0.45, 900, 0.5, 6, 0),
  downpour: look(0.98, 0.65, 350, 1, 8, 0),
  thunderstorm: look(1, 0.9, 500, 0.85, 12, 0),
  purple: look(0.45, 0, 2200, 0, 3, 1),
};

/** Kinds from which something falls. */
export function isWet(kind: WeatherKind): boolean {
  return KIND_LOOKS[kind].precipitation > 0;
}
