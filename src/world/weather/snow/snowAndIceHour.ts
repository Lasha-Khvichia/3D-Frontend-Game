import { kindAt, type WeatherMoment } from "../sampleWeather";
import { KIND_LOOKS, type WeatherKind } from "../weatherKinds";
import { weatherTemperature } from "../weatherTemperature";

/** Heights it is worked out at: every 20 m from the sea to 300 m. */
export const SNOW_BANDS = 16;
export const BAND_METRES = 20;
/** Tuned against Kyiv: snow lying about 95 days a year, 18 cm at its deepest. */
const FALL_PER_HOUR = 0.0035;
const MELT_PER_DEGREE_DAY = 0.009;
/** Rain eats snow faster than warm air alone does. */
const RAIN_MELT_PER_DAY = 0.12;
const DEEPEST = 0.8;
/** Snow rather than rain below this, as everywhere else in the weather. */
const FREEZING = 0.5;
/**
 * River ice grows with the square root of the frost it has had — Stefan's
 * law, the standard rule for ice — slower than on still water because the
 * river keeps moving. Metres per square root of a degree-day below zero.
 */
const ICE_GROWTH = 0.018;
/** A thaw takes ice away far faster than frost lays it down. */
const THAW_PER_DEGREE_DAY = 12;

/**
 * One hour of winter at every height at once: snow falling or melting, and
 * frost building up or thawing away. `deep` is metres of snow; `frost` is
 * degree-days below zero, which `iceThickness` turns into centimetres of ice.
 */
export function passHour(
  deep: number[],
  frost: number[],
  hours: number,
  held: WeatherKind | null,
  moment: WeatherMoment,
): void {
  const look = KIND_LOOKS[held ?? kindAt(hours, moment).kind];
  for (let band = 0; band < SNOW_BANDS; band += 1) {
    const altitude = band * BAND_METRES;
    const temperature = weatherTemperature(hours, altitude, look.cover, look.precipitation);
    let depth = deep[band]!;
    if (temperature < FREEZING) {
      depth += look.precipitation * FALL_PER_HOUR;
    } else {
      depth -= (MELT_PER_DEGREE_DAY * temperature + RAIN_MELT_PER_DAY * look.precipitation) / 24;
    }
    deep[band] = Math.min(DEEPEST, Math.max(0, depth));
    const frosted = temperature < 0 ? -temperature / 24 : (-temperature * THAW_PER_DEGREE_DAY) / 24;
    frost[band] = Math.max(0, frost[band]! + frosted);
  }
}

/** Metres of ice that much frost has laid on a river. */
export function iceThickness(frost: number): number {
  return ICE_GROWTH * Math.sqrt(frost);
}
