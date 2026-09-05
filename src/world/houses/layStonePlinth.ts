import type { BoxSpec } from "./buildWallSegments";
import { between } from "./seededRandom";
import { slabOnWall, type WallSurface } from "./wallSurface";

/** Height of the stone base that runs along the foot of every wall. */
export const PLINTH_HEIGHT = 0.36;

const STONE_STICK_OUT = [0.03, 0.06] as const;

/**
 * A run of stones along the foot of a wall, with small gaps between them.
 *
 * Real cottages are built this way round: stone where the wall meets wet
 * ground, cheaper material above it. It also gives the eye a line to read the
 * ground plane against.
 */
export function layStonePlinth(
  surface: WallSurface,
  wallStart: number,
  start: number,
  usable: number,
  random: () => number,
): BoxSpec[] {
  const stones: BoxSpec[] = [];
  let cursor = start;

  while (cursor < start + usable - 0.15) {
    const length = Math.min(between(random, 0.3, 0.7), start + usable - cursor);
    const height = PLINTH_HEIGHT * between(random, 0.78, 1);
    stones.push(
      slabOnWall(
        surface,
        wallStart,
        cursor + length / 2,
        height / 2,
        length,
        height,
        between(random, STONE_STICK_OUT[0], STONE_STICK_OUT[1]),
      ),
    );
    cursor += length + between(random, 0.01, 0.05);
  }
  return stones;
}
