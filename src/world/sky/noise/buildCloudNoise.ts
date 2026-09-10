import { buildWeatherMap } from "./buildWeatherMap";
import { byte, clamp01, octaves } from "./noiseBytes";
import { TileablePerlin } from "./TileablePerlin";
import { TileableWorley } from "./TileableWorley";

/** Texels along each side of the volume that gives clouds their shape. */
export const SHAPE_SIZE = 64;
/** Texels along each side of the volume that erodes their edges. */
export const DETAIL_SIZE = 32;
export { WEATHER_SIZE } from "./buildWeatherMap";

/** Raw RGBA bytes for the three textures clouds are built from. */
export type CloudNoise = {
  readonly shape: Uint8Array;
  readonly detail: Uint8Array;
  readonly weather: Uint8Array;
};

/**
 * Builds the noise every cloud is carved from. Pure and repeatable: the same
 * sky every time, and it can run in a worker because it touches nothing else.
 *
 * - **Shape**, 64³: red is Perlin-Worley — smooth Perlin billows dilated by
 *   Worley bubbles — and green, blue and alpha are Worley at rising
 *   frequencies. Together they give each cloud its lumpy outline.
 * - **Detail**, 32³: finer Worley, used only to eat away at the edges, which
 *   is what turns a blob into wisps.
 * - **Weather**, 256²: red is where clouds grow at all, green how tall they
 *   stand, from a thin sheet to a towering heap.
 */
export function buildCloudNoise(): CloudNoise {
  return { shape: buildShape(), detail: buildDetail(), weather: buildWeatherMap() };
}

function buildShape(): Uint8Array {
  const perlin = new TileablePerlin(11);
  const worley = [4, 8, 16, 32, 64].map((cells, index) => new TileableWorley(cells, 20 + index));
  const out = new Uint8Array(SHAPE_SIZE ** 3 * 4);
  let at = 0;
  for (let z = 0; z < SHAPE_SIZE; z += 1) {
    for (let y = 0; y < SHAPE_SIZE; y += 1) {
      for (let x = 0; x < SHAPE_SIZE; x += 1) {
        const [u, v, w] = [x / SHAPE_SIZE, y / SHAPE_SIZE, z / SHAPE_SIZE];
        const bubbles = worley.map((noise) => noise.at(u, v, w));
        const low = octaves(bubbles[0]!, bubbles[1]!, bubbles[2]!);
        const billows = clamp01(
          0.5 +
            0.7 *
              (perlin.at(u * 4, v * 4, w * 4, 4) * 0.57 +
                perlin.at(u * 8, v * 8, w * 8, 8) * 0.29 +
                perlin.at(u * 16, v * 16, w * 16, 16) * 0.14),
        );
        // Perlin-Worley, as Hillaire's tileable volume noise builds it.
        out[at++] = byte(low + billows * (1 - low));
        out[at++] = byte(low);
        out[at++] = byte(octaves(bubbles[1]!, bubbles[2]!, bubbles[3]!));
        out[at++] = byte(octaves(bubbles[2]!, bubbles[3]!, bubbles[4]!));
      }
    }
  }
  return out;
}

function buildDetail(): Uint8Array {
  const worley = [4, 8, 16, 32].map((cells, index) => new TileableWorley(cells, 40 + index));
  const out = new Uint8Array(DETAIL_SIZE ** 3 * 4);
  let at = 0;
  for (let z = 0; z < DETAIL_SIZE; z += 1) {
    for (let y = 0; y < DETAIL_SIZE; y += 1) {
      for (let x = 0; x < DETAIL_SIZE; x += 1) {
        const [u, v, w] = [x / DETAIL_SIZE, y / DETAIL_SIZE, z / DETAIL_SIZE];
        const b = worley.map((noise) => noise.at(u, v, w));
        out[at++] = byte(octaves(b[0]!, b[1]!, b[2]!));
        out[at++] = byte(octaves(b[1]!, b[2]!, b[3]!));
        out[at++] = byte(0.625 * b[2]! + 0.375 * b[3]!);
        out[at++] = 255;
      }
    }
  }
  return out;
}
