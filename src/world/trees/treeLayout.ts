import { createSeededRandom, seedFromText } from "../houses/seededRandom";
import { awayFromRoad } from "../roads/offTheRoad";
import { TREE_SPECIES, type TreeSpeciesName } from "./treeSpecies";

export type TreePlacement = {
  readonly name: string;
  readonly species: TreeSpeciesName;
  readonly x: number;
  readonly z: number;
};

/** How many trees the wood holds. */
const TREE_COUNT = 44;
/** Inside this the village stands, and no tree may. */
const VILLAGE = { minX: -44, maxX: 35, minZ: 14, maxZ: 47 };
/** The player starts here and should not start inside a trunk. */
const SPAWN_CLEARANCE = 9;
/** Half the platform, less enough room that no tree grows through the edge. */
const REACH = 88;
/** No trunk closer than this to a road's edge: a tree may lean over a road, not stand in it. */
const OFF_THE_ROAD = 2.5;
/** No two trunks closer than this, or the wood reads as a hedge. */
const SPACING = 9;
/** Give up rather than loop forever if the ground runs out. */
const ATTEMPTS = 4000;

const SPECIES = Object.keys(TREE_SPECIES) as TreeSpeciesName[];

/**
 * Where the trees stand, scattered rather than listed.
 *
 * Rejection sampling from a seeded stream: throw a point at the platform, keep
 * it if it is clear of the village, of the spawn, of the platform edge and of
 * every tree already placed. Deterministic, so the wood is in the same place on
 * every load, and the count is one number to change.
 *
 * Listing forty-four positions by hand would be forty-four chances to overlap a
 * house by two metres and not notice.
 *
 * Worked out on the first ask rather than when this file loads, because one
 * of the things a tree must keep clear of is a road, and the roads are laid
 * while the terrain is built.
 */
let wood: readonly TreePlacement[] | null = null;

export function treePlacements(): readonly TreePlacement[] {
  wood ??= scatterTrees();
  return wood;
}

function scatterTrees(): TreePlacement[] {
  const random = createSeededRandom(seedFromText("woodland"));
  const placed: TreePlacement[] = [];

  for (let attempt = 0; attempt < ATTEMPTS && placed.length < TREE_COUNT; attempt += 1) {
    const x = (random() * 2 - 1) * REACH;
    const z = (random() * 2 - 1) * REACH;
    if (x > VILLAGE.minX && x < VILLAGE.maxX && z > VILLAGE.minZ && z < VILLAGE.maxZ) continue;
    if (Math.hypot(x, z) < SPAWN_CLEARANCE) continue;
    if (placed.some((tree) => Math.hypot(tree.x - x, tree.z - z) < SPACING)) continue;
    if (awayFromRoad(x, z) < OFF_THE_ROAD) continue;

    placed.push({
      name: `tree-${placed.length}`,
      species: SPECIES[Math.floor(random() * SPECIES.length)] ?? "oak",
      x,
      z,
    });
  }

  return placed;
}
