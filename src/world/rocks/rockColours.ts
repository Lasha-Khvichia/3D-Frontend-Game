import { clamp01, lerp, smoothStep } from "../blend";

/** Multiplies the rock grey. Grass takes hold wherever the ground is gentle enough. */
const GRASS: readonly [number, number, number] = [0.45, 0.7, 0.38];
/**
 * How wide the band is between bare rock and full grass. Where it sits is the
 * rock's own business — a knoll is green from halfway down, a crag only on its
 * caps.
 *
 * Wide on purpose. The colour is stored per vertex and interpolated across
 * each face, so a narrow band on a coarse mesh turns the join into a visible
 * patch with straight sides.
 */
const GRASS_BAND = 0.3;
/** How level a face must be, as an upward lean, before moss takes it. Only the very tops. */
const GRASS_FROM = 0.88;

/**
 * A colour per vertex: rock on the steep parts, grass on the gentle ones.
 *
 * Taken from the surface's own lean rather than its height, so grass lands
 * where grass would land — on the shoulders and caps, not in a band at a
 * fixed altitude. Multiplied into one shared material, so a whole formation
 * stays a single draw call.
 */
export function rockColours(normals: readonly number[]): number[] {
  const colours: number[] = [];
  for (let vertex = 0; vertex < normals.length; vertex += 3) {
    const grass = smoothStep(
      GRASS_FROM - GRASS_BAND,
      GRASS_FROM + GRASS_BAND * 0.4,
      clamp01(normals[vertex + 1] ?? 0),
    );
    colours.push(lerp(1, GRASS[0], grass), lerp(1, GRASS[1], grass), lerp(1, GRASS[2], grass), 1);
  }
  return colours;
}
