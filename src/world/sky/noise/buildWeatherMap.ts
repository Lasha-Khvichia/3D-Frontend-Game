import { byte, clamp01 } from "./noiseBytes";
import { TileablePerlin } from "./TileablePerlin";
import { TileableWorley } from "./TileableWorley";

/** Texels along each side of the map of where clouds grow. */
export const WEATHER_SIZE = 256;

/**
 * The map of where clouds grow, 256² and repeating: red is how likely a cloud
 * is to stand over each point, green how tall it grows there, blue a spare
 * variation. Perlin gives the broad weather; two scales of Worley clump it into
 * separate clouds rather than one even haze.
 */
export function buildWeatherMap(): Uint8Array {
  const perlin = new TileablePerlin(61);
  const clumps = [6, 12].map((cells, index) => new TileableWorley(cells, 70 + index, 2));
  const fbm = (u: number, v: number, periods: number[], z: number): number => {
    let sum = 0;
    let weight = 0.5;
    for (const period of periods) {
      sum += perlin.at(u * period, v * period, z, period) * weight;
      weight *= 0.5;
    }
    return clamp01(0.5 + sum);
  };
  const out = new Uint8Array(WEATHER_SIZE ** 2 * 4);
  let at = 0;
  for (let y = 0; y < WEATHER_SIZE; y += 1) {
    for (let x = 0; x < WEATHER_SIZE; x += 1) {
      const [u, v] = [x / WEATHER_SIZE, y / WEATHER_SIZE];
      const lumps = clumps[0]!.at(u, v) * 0.65 + clumps[1]!.at(u, v) * 0.35;
      out[at++] = byte(fbm(u, v, [4, 8, 16, 32], 0.5) * 0.6 + lumps * 0.55 - 0.1);
      out[at++] = byte(fbm(u, v, [2, 4], 3.5));
      out[at++] = byte(fbm(u, v, [8, 16], 7.5));
      out[at++] = 255;
    }
  }
  return out;
}
