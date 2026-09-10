import { lerp, smoothStep } from "../blend";

export type Rgb = readonly [number, number, number];

/** The same green the flat ground used, so grass blades still sit on their own colour. */
const GRASS: Rgb = [0.3, 0.44, 0.24];
const HIGH_GRASS: Rgb = [0.38, 0.4, 0.27];
const SAND: Rgb = [0.78, 0.72, 0.53];
const WET_SAND: Rgb = [0.55, 0.52, 0.4];
/** Shared with the flat sea floor beyond the grid, or the join shows as steps. */
export const DEEP: Rgb = [0.16, 0.24, 0.25];
const ROCK: Rgb = [0.47, 0.45, 0.42];
const SNOW: Rgb = [0.93, 0.95, 0.98];

/** Where snow starts lying. Deliberately plain — weather will own this later. */
export const SNOW_LINE = 95;
/** Rise per metre past which bare rock shows through, about 38 degrees. */
const ROCK_FROM = 0.62;
const ROCK_TO = 0.95;

/**
 * The colour of the ground at one vertex, from its height and how steep it is.
 *
 * `water` is the surface of the sea or river over this spot.
 *
 * Height decides the band — seabed, sand, meadow, upland, snow — and steepness
 * overrides it with rock, which is how real hills look: grass holds on to
 * anything it can and loses the rest.
 *
 * `speckle` is a small per-vertex variation, between -1 and 1, that stops the
 * bands being ruled lines.
 */
export function terrainColour(
  height: number,
  water: number,
  steepness: number,
  speckle: number,
  out: number[],
): void {
  // Measured from whatever water is here, so a riverbank gets the same sand
  // and wet shingle as the beach, at the river's own height.
  const above = height - water;
  let colour: Rgb;

  if (above < -0.2) {
    colour = blend(WET_SAND, DEEP, smoothStep(0, 6, -above));
  } else if (above < 1 + speckle * 0.3) {
    colour = SAND;
  } else {
    colour = blend(GRASS, HIGH_GRASS, smoothStep(35, 80, height));
  }

  const rock = smoothStep(ROCK_FROM, ROCK_TO, steepness);
  colour = blend(colour, ROCK, rock);

  // Snow settles on what is level enough to hold it and thins on the steep,
  // but does not vanish there: seen from the valley a mountain is almost all
  // steep face, and snow only on its ledges read as no snow at all.
  const snow =
    smoothStep(SNOW_LINE + speckle * 10, SNOW_LINE + 14 + speckle * 10, height) * (1 - rock * 0.45);
  colour = blend(colour, SNOW, snow);

  out.push(colour[0], colour[1], colour[2], 1);
}

function blend(from: Rgb, to: Rgb, share: number): Rgb {
  return [lerp(from[0], to[0], share), lerp(from[1], to[1], share), lerp(from[2], to[2], share)];
}
