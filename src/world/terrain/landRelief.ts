import { smoothStep } from "../blend";
import { SETTLEMENTS } from "../houses/settlements";
import { createNoise2D } from "./noise2d";
import { layeredNoise, ridgedNoise } from "./layeredNoise";

/** Rolling hills: how tall, and how far apart. */
const HILL_HEIGHT = 22;
const HILL_WAVELENGTH = 330;
/**
 * Dips are flattened almost level. Noise goes down as far as it goes up, and
 * the first version let a third of that depth through — which sank a third of
 * the island under the sea, as flooded hollows with beaches round them in the
 * middle of the fields. Kept to under a metre, a dip is a flat valley floor.
 * Water inland is the rivers' job.
 */
const DIP_SHARE = 0.04;
/** Lifts the hills a little so more of the land is up than down. */
const HILL_LIFT = 0.18;

/**
 * The mountain ranges: where each is centred, how far it spreads, how tall it
 * gets. All placed in the gaps between settlements, at least 450 m from any
 * of them, so no village sits at the foot of a cliff.
 */
export const MOUNTAIN_RANGES: readonly { x: number; z: number; radius: number; height: number }[] =
  [
    { x: 40, z: 690, radius: 380, height: 270 },
    { x: 90, z: -700, radius: 270, height: 180 },
    { x: 860, z: -160, radius: 230, height: 150 },
  ];
const RIDGE_WAVELENGTH = 270;
/**
 * Four layers of ridge detail, not five. The fifth has a wavelength of 17 m,
 * which the 4 m grid samples only four times — and four samples of a sharp
 * crest is a row of spikes. Up close the mountains came out as broken glass.
 */
const RIDGE_OCTAVES = 4;
/** Share of a range that is a solid massif, the rest being ridges on top of it. */
const MASSIF_SHARE = 0.3;
/** How far past a settlement's clearance the land stays low and level. */
const LOWLAND_REACH = 240;

const hillNoise = createNoise2D(311);
const ridgeNoise = createNoise2D(529);

/** Rolling hills. Walkable almost everywhere, which is what they are for. */
export function hillsAt(x: number, z: number): number {
  const wave =
    layeredNoise(hillNoise, x / HILL_WAVELENGTH, z / HILL_WAVELENGTH, 4, 0.42) + HILL_LIFT;
  return (wave < 0 ? wave * DIP_SHARE : wave) * HILL_HEIGHT;
}

/** Mountains, deliberately too steep to walk up except along the odd ridge. */
export function mountainsAt(x: number, z: number): number {
  let total = 0;
  for (const range of MOUNTAIN_RANGES) {
    const away = Math.hypot(x - range.x, z - range.z) / range.radius;
    if (away >= 1) continue;
    const fall = (1 - away * away) ** 2;
    const ridges = ridgedNoise(
      ridgeNoise,
      x / RIDGE_WAVELENGTH,
      z / RIDGE_WAVELENGTH,
      RIDGE_OCTAVES,
    );
    total += fall * range.height * (MASSIF_SHARE + (1 - MASSIF_SHARE) * ridges);
  }
  return total;
}

/**
 * How much relief the land is allowed here: 0 at a settlement, 1 well clear.
 *
 * People settle in the flat bits. Doing it the other way round — scattering
 * villages over finished terrain and hoping — puts a cottage on a hillside
 * with its door three metres up a slope.
 */
export function reliefAllowedAt(x: number, z: number): number {
  let allowed = 1;
  for (const settlement of SETTLEMENTS) {
    const away = Math.hypot(x - settlement.centreX, z - settlement.centreZ);
    allowed = Math.min(
      allowed,
      smoothStep(settlement.clearance, settlement.clearance + LOWLAND_REACH, away),
    );
  }
  return allowed;
}
