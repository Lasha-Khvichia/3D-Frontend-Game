import type { BoxSpec, WallSpec } from "./buildWallSegments";
import type { Side } from "./houseBlueprint";
import { layStonePlinth, PLINTH_HEIGHT } from "./layStonePlinth";
import { between } from "./seededRandom";
import { measureSegment, outerFaceOf, slabOnWall } from "./wallSurface";

/** Stones per square metre of the plastered wall above the plinth. */
const SCATTER_DENSITY = 1.6;
/** Nothing is placed closer than this to the edge of its wall segment. */
const EDGE_MARGIN = 0.06;

const STONE_LENGTH = [0.22, 0.55] as const;
const STONE_HEIGHT = [0.13, 0.28] as const;
const STONE_STICK_OUT = [0.03, 0.06] as const;

/**
 * Stone across a wall: a rough course along the base, and single stones showing
 * through the plaster above it.
 *
 * Placed on the wall segments rather than on the wall, so a stone can never
 * land across a doorway or a window. The segments are what is left after the
 * openings are cut, so anywhere on one of them is solid wall.
 */
export function scatterWallStones(
  wall: WallSpec,
  side: Side,
  segments: readonly BoxSpec[],
  random: () => number,
): BoxSpec[] {
  const surface = outerFaceOf(wall, side);
  const stones: BoxSpec[] = [];

  for (const segment of segments) {
    const { along, length, low, high } = measureSegment(segment, surface, wall.from);
    const start = along - length / 2 + EDGE_MARGIN;
    const usable = length - EDGE_MARGIN * 2;
    if (usable <= 0) continue;

    if (low < 0.02) {
      stones.push(...layStonePlinth(surface, wall.from, start, usable, random));
    }

    const openLow = Math.max(low, PLINTH_HEIGHT) + EDGE_MARGIN;
    const openHigh = high - EDGE_MARGIN;
    const count = Math.round(usable * Math.max(0, openHigh - openLow) * SCATTER_DENSITY);
    for (let index = 0; index < count; index += 1) {
      const size = pickSize(usable, openHigh - openLow, random);
      stones.push(
        slabOnWall(
          surface,
          wall.from,
          start + size.length / 2 + random() * (usable - size.length),
          // Squared, so stones gather low on the wall and thin out towards the
          // eaves, the way weather and repair actually leave them.
          openLow + Math.pow(random(), 2) * (openHigh - openLow - size.height) + size.height / 2,
          size.length,
          size.height,
          between(random, STONE_STICK_OUT[0], STONE_STICK_OUT[1]),
        ),
      );
    }
  }
  return stones;
}

function pickSize(maxLength: number, maxHeight: number, random: () => number) {
  return {
    length: Math.min(between(random, STONE_LENGTH[0], STONE_LENGTH[1]), maxLength),
    height: Math.min(between(random, STONE_HEIGHT[0], STONE_HEIGHT[1]), Math.max(0.05, maxHeight)),
  };
}
