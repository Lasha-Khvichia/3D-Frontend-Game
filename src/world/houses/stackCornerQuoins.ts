import type { BoxSpec } from "./buildWallSegments";
import type { HouseBlueprint } from "./houseBlueprint";
import { between } from "./seededRandom";

/** The long and short faces of a corner block. */
const QUOIN_LONG = 0.5;
const QUOIN_SHORT = 0.26;
/** Height of one course, block plus the mortar gap above it. */
const QUOIN_RISE = 0.34;
/** How far a block stands proud of the wall it is set into. */
const STICK_OUT = 0.05;

/**
 * Dressed stone blocks stacked up each corner of the house, turned alternately
 * so they read as interlocking.
 *
 * Corners are where a wall is weakest and where real builders spent their good
 * stone, so quoins are the single detail that most says "this is masonry, not a
 * painted box". They also hide the seam where two walls meet.
 */
export function stackCornerQuoins(
  blueprint: HouseBlueprint,
  centreX: number,
  centreZ: number,
  random: () => number,
): BoxSpec[] {
  const halfWidth = blueprint.width / 2;
  const halfDepth = blueprint.depth / 2;
  const courses = Math.floor((blueprint.wallHeight - 0.1) / QUOIN_RISE);
  const blocks: BoxSpec[] = [];

  for (const alongX of [1, -1] as const) {
    for (const alongZ of [1, -1] as const) {
      const cornerX = centreX + alongX * halfWidth;
      const cornerZ = centreZ + alongZ * halfDepth;

      for (let course = 0; course < courses; course += 1) {
        // Every other block turns its long face the other way, which is what
        // makes the stack look tied together rather than piled up.
        const longAlongX = course % 2 === 0;
        const width = longAlongX ? QUOIN_LONG : QUOIN_SHORT;
        const depth = longAlongX ? QUOIN_SHORT : QUOIN_LONG;
        const stickOut = STICK_OUT * between(random, 0.7, 1.3);
        blocks.push({
          x: cornerX - alongX * (width / 2 - stickOut),
          y: QUOIN_RISE / 2 + course * QUOIN_RISE,
          z: cornerZ - alongZ * (depth / 2 - stickOut),
          width,
          height: QUOIN_RISE * between(random, 0.8, 0.9),
          depth,
        });
      }
    }
  }
  return blocks;
}
