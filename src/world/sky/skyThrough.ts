import { murkOf, type SkyWeather } from "../weather/weatherSky";

/** Rain this heavy is all that is making the murk: below it, the murk is mostly fog. */
const ALL_RAIN = 0.3;
/** Of murk that is rain's, the share that still hides the clouds overhead. */
const RAIN_HIDES = 0.3;
/** How fast dark cloud hides a disc: none shows at two-thirds of a storm's darkness. */
const DISC_HIDING = 1.5;

/**
 * How much of the drawn clouds show, 0 to 1. Fog hides the sky entirely.
 * Rain hides the far land, but not the cloud base over your head, so clouds
 * in rain and storms keep their shape.
 */
export function cloudsShownOf(weather: Readonly<SkyWeather>): number {
  const rain = Math.min(1, weather.precipitation / ALL_RAIN);
  return 1 - murkOf(weather) * (1 - (1 - RAIN_HIDES) * rain);
}

/** Share of a light beyond `cover` of cloud that reaches the eye through the air. */
export function throughClouds(cover: number, weather: Readonly<SkyWeather>): number {
  return (1 - cover) * (1 - murkOf(weather));
}

/**
 * What a light drawn behind the cloud veil — the sun, the moon, a star — must
 * be dimmed by, with `cover` of cloud in front of it. The veil already covers
 * `cover × shown` of it; the clouds the murk no longer lets us draw must still
 * cover the rest, or the sun shows through a storm as a white dot. And storm
 * cloud is too thick for any disc to show through its thinner parts.
 */
export function behindClouds(cover: number, weather: Readonly<SkyWeather>): number {
  const shown = cloudsShownOf(weather);
  const thick = Math.max(0, 1 - DISC_HIDING * weather.darkness);
  return (thick * throughClouds(cover, weather)) / Math.max(0.001, 1 - cover * shown);
}
