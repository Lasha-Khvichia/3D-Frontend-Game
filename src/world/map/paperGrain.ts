import { MAP_PIXELS } from "./mapFrame";

const GRAIN = 256;
let grain: Float32Array | null = null;

/**
 * How light the paper is at a pixel, about 0.8 to 1: a blotchy wash with fine
 * grain in it, and edges darkened as old paper browns from the outside in.
 */
export function paperGrain(px: number, py: number): number {
  grain ??= buildGrain();
  const blotch = grain[(py % GRAIN) * GRAIN + (px % GRAIN)]!;
  const wash = grain[(Math.floor(py / 8) % GRAIN) * GRAIN + (Math.floor(px / 8) % GRAIN)]!;
  const edge = Math.min(px, py, MAP_PIXELS - 1 - px, MAP_PIXELS - 1 - py) / MAP_PIXELS;
  const browned = 0.78 + 0.22 * Math.min(1, edge / 0.07);
  return (0.9 + 0.05 * blotch + 0.05 * wash) * browned;
}

/** Smoothed random values, repeating every 256 pixels. */
function buildGrain(): Float32Array {
  let seed = 20260910;
  const random = (): number => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const raw = Float32Array.from({ length: GRAIN * GRAIN }, random);
  const smooth = new Float32Array(GRAIN * GRAIN);
  for (let y = 0; y < GRAIN; y += 1) {
    for (let x = 0; x < GRAIN; x += 1) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          sum += raw[((y + dy + GRAIN) % GRAIN) * GRAIN + ((x + dx + GRAIN) % GRAIN)]!;
        }
      }
      smooth[y * GRAIN + x] = sum / 9;
    }
  }
  return smooth;
}
