import { type GrassBlocker, grassBeside, GRASS_FADE } from "../grassBlockers";
import { rockHeightAt } from "./rockHeight";
import type { RockShape } from "./rockShape";
import { ROCK_BURY, ROCK_BURY_TAPER } from "./createRockMesh";

/** Directions the stone's outline is measured along. */
const DIRECTIONS = 64;
/** How far out of the ground the stone must stand before grass under it is hidden. */
const SHOWING = 0.01;
/** Kept clear inside the outline too: the mesh is flat between vertices, the outline is not. */
const MARGIN = 0.04;

/**
 * Where grass meets a stone: exactly at the line the stone comes out of the
 * ground, found in 64 directions from the same surface its mesh is built
 * from. A square round a round stone left a bald patch at every corner and
 * still let blades up through its sides.
 */
export function rockGrassBlocker(shape: RockShape): GrassBlocker {
  const edge = Array.from({ length: DIRECTIONS }, (_, index) => {
    const angle = (index / DIRECTIONS) * Math.PI * 2;
    // In from the rim until the stone first shows above the ground.
    let radius = shape.reach;
    while (radius > 0) {
      const above =
        rockHeightAt(shape, Math.sin(angle) * radius, Math.cos(angle) * radius) -
        ROCK_BURY * (radius / shape.reach) ** ROCK_BURY_TAPER;
      if (above > SHOWING) break;
      radius -= 0.02;
    }
    return Math.max(0, radius) + MARGIN;
  });
  const reach = Math.max(...edge) + GRASS_FADE;
  return {
    bounds: {
      minX: shape.x - reach,
      maxX: shape.x + reach,
      minZ: shape.z - reach,
      maxZ: shape.z + reach,
    },
    grassLeftAt: (x, z) => {
      const dx = x - shape.x;
      const dz = z - shape.z;
      const turn = ((Math.atan2(dx, dz) / (Math.PI * 2)) * DIRECTIONS + DIRECTIONS) % DIRECTIONS;
      const index = Math.floor(turn);
      const share = turn - index;
      const radius = edge[index]! + (edge[(index + 1) % DIRECTIONS]! - edge[index]!) * share;
      return grassBeside(Math.hypot(dx, dz) - radius);
    },
  };
}
