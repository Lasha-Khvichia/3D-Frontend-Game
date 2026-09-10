import { SETTLEMENTS } from "../houses/settlements";
import { createNoise2D } from "./noise2d";
import { layeredNoise } from "./layeredNoise";

/** The island's average radius, before the lobes and bays bend it. */
const BASE_RADIUS = 980;
/**
 * The large shape of the coast: a handful of sine waves round the compass.
 * [how many times round, how strong, where it starts]. Low counts make the
 * island lopsided, higher ones add headlands; nothing here repeats evenly
 * enough to read as a flower.
 */
const LOBES: readonly (readonly [number, number, number])[] = [
  [2, 0.11, 0.7],
  [3, 0.08, 2.1],
  [4, 0.055, 4.4],
  [5, 0.04, 1.3],
  [7, 0.025, 5.2],
];
/**
 * How far the coast is pushed about by noise, and over what distance.
 *
 * This is the domain warp — the point is moved before the island is asked
 * about it — and it is what turns a wobbly circle into bays and headlands.
 * Kept gentle on purpose. A warp that moves points faster than it moves their
 * neighbours folds space over, and a folded coast is an inland sea, with the
 * edge-of-the-world teleport sitting in the middle of it.
 */
const WARP_METRES = 100;
const WARP_WAVELENGTH = 620;
/** Land kept past every settlement's own clearance, whatever the coast does. */
const SETTLEMENT_SHORE = 170;

const warpAlongX = createNoise2D(71);
const warpAlongZ = createNoise2D(172);

/**
 * How far a point is inside the island, in metres. Negative out at sea.
 *
 * Not an exact distance to the nearest beach — the warp bends space a little —
 * but it goes from positive to negative exactly once along any line out from
 * the middle, and the beach, the shallow shelf and the edge of the world are
 * all measured in it, so they always agree with each other.
 *
 * Every settlement is unioned in as a disc of land of its own. The coast is
 * noise, and noise does not know where people live.
 */
export function coastDistance(x: number, z: number): number {
  const warpedX =
    x + layeredNoise(warpAlongX, x / WARP_WAVELENGTH, z / WARP_WAVELENGTH, 2, 0.3) * WARP_METRES;
  const warpedZ =
    z + layeredNoise(warpAlongZ, x / WARP_WAVELENGTH, z / WARP_WAVELENGTH, 2, 0.3) * WARP_METRES;

  const bearing = Math.atan2(warpedX, warpedZ);
  let radius = BASE_RADIUS;
  for (const [times, strength, start] of LOBES) {
    radius += BASE_RADIUS * strength * Math.sin(times * bearing + start);
  }
  let inside = radius - Math.hypot(warpedX, warpedZ);

  for (const settlement of SETTLEMENTS) {
    const away = Math.hypot(x - settlement.centreX, z - settlement.centreZ);
    inside = Math.max(inside, settlement.clearance + SETTLEMENT_SHORE - away);
  }
  return inside;
}
