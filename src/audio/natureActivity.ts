import { smoothStep } from "../world/blend";
import type { WeatherState } from "../world/weather/weatherState";

/** Day of the year winter ends and starts: 1 March and 1 December; late winter and autumn either side. */
const SPRING = 59;
const WINTER = 334;
const FULL_SPRING = 90;
const FULL_AUTUMN = 304;

/**
 * How busy the birds are now, 0 to 1. Every dry, not too windy day by day has
 * birds, busiest in a sunny spring or summer dawn chorus: in winter, cold and
 * under cloud there are fewer (and `BirdSong` makes them quieter), never none.
 */
export function birdActivity(
  dayOfYear: number,
  hour: number,
  sunHeight: number,
  weather: Readonly<WeatherState>,
): number {
  if (weather.precipitation > 0.1 || weather.wind > 9) return 0;
  const season =
    dayOfYear < SPRING || dayOfYear >= WINTER
      ? 0.25
      : dayOfYear < FULL_SPRING || dayOfYear >= FULL_AUTUMN
        ? 0.5
        : 1;
  const sunny = weather.cover < 0.6 ? 1 : 0.4;
  const cold = weather.temperature < 0 ? 0.6 : 1;
  const daylight = smoothStep(-0.05, 0.12, sunHeight);
  const dawn =
    hour < 11 ? smoothStep(-0.12, 0.02, sunHeight) * (1 - smoothStep(0.15, 0.45, sunHeight)) : 0;
  return season * sunny * cold * Math.max(0.3 * daylight, dawn);
}

/** How loud the crickets are now, 0 to 1: warm, dry, still nights. */
export function cricketActivity(sunHeight: number, weather: Readonly<WeatherState>): number {
  if (weather.precipitation > 0.05 || weather.wind > 7) return 0;
  const warm = smoothStep(12, 18, weather.temperature);
  const night = 1 - smoothStep(-0.12, 0.02, sunHeight);
  return warm * night;
}

/** How much the weather works a house's timbers, 0 on a fair day to 1 in a storm. */
export function weatherBadness(weather: Readonly<WeatherState>): number {
  const wind = (weather.wind - 5) / 10;
  const rain = weather.precipitation * 0.6;
  const storm = (weather.darkness - 0.4) * 1.5;
  return Math.min(1, Math.max(0, wind, rain, storm));
}
