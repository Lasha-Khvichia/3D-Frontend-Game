import { buildWallSegments, type BoxSpec } from "./buildWallSegments";
import { frameWallTimber } from "./frameWallTimber";
import type { HouseBlueprint, PlannedWall } from "./houseBlueprint";
import { scatterWallStones } from "./scatterWallStones";
import { createSeededRandom, seedFromText } from "./seededRandom";
import { stackCornerQuoins } from "./stackCornerQuoins";

/** Everything hung on a house's walls, split by what it is made of. */
export type HouseDecor = {
  readonly stone: BoxSpec[];
  readonly timber: BoxSpec[];
};

/**
 * Phase 1: dresses a bare shell in stone and timber.
 *
 * None of this collides or casts a shadow. Every piece is a few centimetres
 * proud of a wall that already does both, so paying twice would buy nothing
 * you could see.
 *
 * Stone and timber run on separate random streams, seeded from the house's
 * name. Two streams rather than one so that changing how stone is scattered
 * does not also reshuffle every beam in the village.
 */
export function decorateHouse(
  blueprint: HouseBlueprint,
  centreX: number,
  centreZ: number,
  walls: readonly PlannedWall[],
): HouseDecor {
  const stoneRandom = createSeededRandom(seedFromText(`${blueprint.name}-stone`));
  const timberRandom = createSeededRandom(seedFromText(`${blueprint.name}-timber`));

  const stone: BoxSpec[] = [];
  const timber: BoxSpec[] = [];
  for (const wall of walls) {
    const segments = buildWallSegments(wall);
    stone.push(...scatterWallStones(wall, wall.side, segments, stoneRandom));
    timber.push(...frameWallTimber(wall, wall.side, segments, timberRandom));
  }
  stone.push(...stackCornerQuoins(blueprint, centreX, centreZ, stoneRandom));

  return { stone, timber };
}
