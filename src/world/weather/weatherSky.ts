import type { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import type { TimeOfDayLighting } from "../timeOfDayPalette";

/** What the weather does to the sky's colours and light. A `WeatherState` is one. */
export type SkyWeather = {
  cover: number;
  darkness: number;
  purple: number;
  mist: number;
  /** Metres. */
  visibility: number;
};

/** How much fog or falling rain and snow hides the sky: 0 clear, 1 at 200 m or less. */
export function murkOf(weather: Readonly<SkyWeather>): number {
  return Math.min(1, Math.max(0, (1500 - weather.visibility) / 1300));
}

type Rgb = readonly [number, number, number];
type Colour = Color3 | Color4;

/** A purple day: a pink horizon, deep violet overhead, and pink sunlight on everything. */
const PURPLE_HORIZON: Rgb = [0.95, 0.5, 0.8];
const PURPLE_OVERHEAD: Rgb = [0.42, 0.18, 0.62];
const PURPLE_SUNLIGHT: Rgb = [1, 0.55, 0.8];

/**
 * Turns the time of day's sky into the weather's.
 *
 * - Cloud greys it: the same light, scattered until none of the blue is left.
 * - A storm darkens the air and weakens the light: dark grey at midday, and
 *   since the clouds are lit by these same colours, black clouds overhead.
 * - A purple day tints it, keeping each colour's brightness, so a purple
 *   night is still night.
 *
 * - Thick fog or heavy rain flattens it to the horizon's colour: past a few
 *   hundred metres there is no sky to see, only the grey the land fades into.
 *
 * The clouds, the fog and the ground all take these colours, so all change
 * together.
 */
export function applySkyWeather(lighting: TimeOfDayLighting, weather: Readonly<SkyWeather>): void {
  greyForOvercast(lighting.background, weather.cover);
  greyForOvercast(lighting.zenith, weather.cover);
  const murk = murkOf(weather);
  lighting.zenith.r += (lighting.background.r - lighting.zenith.r) * murk;
  lighting.zenith.g += (lighting.background.g - lighting.zenith.g) * murk;
  lighting.zenith.b += (lighting.background.b - lighting.zenith.b) * murk;
  const dim = 1 - 0.62 * weather.darkness;
  scale(lighting.background, dim);
  scale(lighting.zenith, dim);
  lighting.lightIntensity *= 1 - 0.5 * weather.darkness;
  tint(lighting.background, PURPLE_HORIZON, 0.75 * weather.purple);
  tint(lighting.zenith, PURPLE_OVERHEAD, 0.75 * weather.purple);
  tint(lighting.lightColor, PURPLE_SUNLIGHT, 0.85 * weather.purple);
}

export function createSkyWeather(): SkyWeather {
  return { cover: 0, darkness: 0, purple: 0, mist: 0, visibility: 3000 };
}

/** Takes the sky's share of the weather's state. */
export function copySkyWeather(from: Readonly<SkyWeather>, to: SkyWeather): void {
  to.cover = from.cover;
  to.darkness = from.darkness;
  to.purple = from.purple;
  to.mist = from.mist;
  to.visibility = from.visibility;
}

function greyForOvercast(colour: Colour, overcast: number): void {
  const grey = luminance(colour);
  const share = Math.pow(overcast, 1.5) * 0.9;
  colour.r += (grey * 1.0 - colour.r) * share;
  colour.g += (grey * 1.03 - colour.g) * share;
  colour.b += (grey * 1.08 - colour.b) * share;
}

function scale(colour: Colour, by: number): void {
  colour.r *= by;
  colour.g *= by;
  colour.b *= by;
}

function tint(colour: Colour, hue: Rgb, share: number): void {
  if (share <= 0) return;
  const brightness = luminance(colour) / (hue[0] * 0.3 + hue[1] * 0.59 + hue[2] * 0.11);
  colour.r += (hue[0] * brightness - colour.r) * share;
  colour.g += (hue[1] * brightness - colour.g) * share;
  colour.b += (hue[2] * brightness - colour.b) * share;
}

export function luminance(colour: Colour): number {
  return colour.r * 0.3 + colour.g * 0.59 + colour.b * 0.11;
}
