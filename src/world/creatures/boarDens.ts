import { createSeededRandom, seedFromText } from "../houses/seededRandom";
import { SETTLEMENTS } from "../houses/settlements";
import { awayFromRoad } from "../roads/offTheRoad";
import type { Ground } from "../terrain/Ground";

export type Den = {
  readonly index: number;
  readonly x: number;
  readonly z: number;
  /** How many boars live here. */
  readonly boars: number;
};

const DENS = 6;
/** Metres past a settlement's own ground that no den may be. */
const FROM_SETTLEMENTS = 120;
/** Metres between dens, so each is a place of its own. */
const APART = 280;
/** Metres off any road: boars keep to the wild. */
const OFF_ROAD = 30;
const SPREAD = 1250;
const ATTEMPTS = 6000;

const slope = { x: 0, z: 0 };
let found: readonly Den[] | null = null;

/**
 * Where the wild boars live: a handful of dens scattered over the wild
 * country, every one well clear of the village, the hamlets and the roads.
 *
 * Scattered from a seeded stream, so the dens are in the same places on every
 * load and can be marked on the map. Worked out on the first ask, not when the
 * file loads, because one of the things a den keeps clear of is a road, and
 * the roads are found while the terrain is built.
 */
export function boarDens(ground: Ground): readonly Den[] {
  found ??= scatterDens(ground);
  return found;
}

/** The dens if they have been worked out, for the map; none before that. */
export function knownDens(): readonly Den[] {
  return found ?? [];
}

function scatterDens(ground: Ground): Den[] {
  const random = createSeededRandom(seedFromText("boar-dens"));
  const dens: Den[] = [];
  for (let attempt = 0; attempt < ATTEMPTS && dens.length < DENS; attempt += 1) {
    const x = (random() * 2 - 1) * SPREAD;
    const z = (random() * 2 - 1) * SPREAD;
    const boars = 2 + Math.floor(random() * 3);
    if (!isWild(ground, x, z)) continue;
    if (dens.some((den) => Math.hypot(den.x - x, den.z - z) < APART)) continue;
    dens.push({ index: dens.length, x, z, boars });
  }
  return dens;
}

/** Dry, gentle, inland, below the scree, and nobody's ground. */
function isWild(ground: Ground, x: number, z: number): boolean {
  if (ground.inlandAt(x, z) < 90 || ground.waterDepthAt(x, z) > 0) return false;
  const height = ground.heightAt(x, z);
  if (height - ground.waterSurfaceAt(x, z) < 2 || height > 70) return false;
  ground.slopeAt(x, z, slope);
  if (Math.hypot(slope.x, slope.z) > 0.3) return false;
  if (awayFromRoad(x, z) < OFF_ROAD) return false;
  return SETTLEMENTS.every(
    (place) =>
      Math.hypot(place.centreX - x, place.centreZ - z) > place.clearance + FROM_SETTLEMENTS,
  );
}
