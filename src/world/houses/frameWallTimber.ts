import type { BoxSpec, WallSpec } from "./buildWallSegments";
import type { Side } from "./houseBlueprint";
import { between } from "./seededRandom";
import { measureSegment, outerFaceOf, slabOnWall } from "./wallSurface";

/** The beam that runs the length of the wall just under the eaves. */
const PLATE_HEIGHT = 0.16;
const PLATE_STICK_OUT = 0.05;
/** The beam carrying the wall above a door or a window. */
const LINTEL_HEIGHT = 0.16;
const LINTEL_OVERHANG = 0.16;
/** Upright posts. Narrow, because they are decoration, not structure. */
const STUD_WIDTH = 0.14;
const STUD_STICK_OUT = 0.04;
/** A segment narrower than this gets no post; it would look like a stripe. */
const MIN_SEGMENT_FOR_STUD = 1;
/** Roughly one post per this many metres of solid wall. */
const METRES_PER_STUD = 1.4;

/**
 * The timber on a wall: a plate under the eaves, a lintel over every opening,
 * and a few upright posts on the solid stretches between them.
 *
 * The lintel is the piece that matters. A hole in a wall needs something over
 * it holding the wall up, and an opening without one reads as a hole cut in
 * cardboard. It is also what Phase 2 hangs a door from.
 */
export function frameWallTimber(
  wall: WallSpec,
  side: Side,
  segments: readonly BoxSpec[],
  random: () => number,
): BoxSpec[] {
  const surface = outerFaceOf(wall, side);
  const span = wall.to - wall.from;
  const beams: BoxSpec[] = [
    slabOnWall(
      surface,
      wall.from,
      span / 2,
      wall.height - PLATE_HEIGHT / 2,
      span,
      PLATE_HEIGHT,
      PLATE_STICK_OUT,
    ),
  ];

  for (const opening of wall.openings) {
    beams.push(
      slabOnWall(
        surface,
        wall.from,
        opening.start + opening.width / 2,
        opening.sill + opening.height + LINTEL_HEIGHT / 2,
        opening.width + LINTEL_OVERHANG * 2,
        LINTEL_HEIGHT,
        PLATE_STICK_OUT,
      ),
    );
  }

  for (const segment of segments) {
    const { along, length, low, high } = measureSegment(segment, surface, wall.from);
    if (length < MIN_SEGMENT_FOR_STUD || high - low < 1.2) continue;

    const count = Math.max(1, Math.round(length / METRES_PER_STUD));
    for (let index = 0; index < count; index += 1) {
      const spread = (length - STUD_WIDTH * 2) * ((index + 1) / (count + 1) - 0.5);
      beams.push(
        slabOnWall(
          surface,
          wall.from,
          along + spread * between(random, 0.85, 1.15),
          (low + high) / 2,
          STUD_WIDTH,
          high - low,
          STUD_STICK_OUT,
        ),
      );
    }
  }
  return beams;
}
