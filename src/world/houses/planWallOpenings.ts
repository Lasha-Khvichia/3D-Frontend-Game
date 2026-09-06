import type { Opening } from "./buildWallSegments";

/**
 * A doorway wide enough not to catch the player.
 *
 * The player's collision ellipsoid is 0.8 m across. Level design guidance is
 * that a gap needs to be about twice the player's width before it stops
 * feeling like a snag, so this is 1.4 m rather than the 1.0 m a real medieval
 * door would be. Phase 2 hangs a narrower door leaf inside it.
 */
export const DOORWAY_WIDTH = 1.4;
export const DOORWAY_HEIGHT = 2.05;

const WINDOW_WIDTH = 0.95;
const WINDOW_HEIGHT = 1.05;
/** Sill height above the floor. Low enough to see the ground through. */
const WINDOW_SILL = 1.05;

/** Keeps an opening from cutting into the corner where two walls meet. */
const CORNER_MARGIN = 0.7;

/**
 * A doorway in the middle of the door wall, and windows spread over whatever
 * solid wall is left.
 *
 * Wider walls simply get more windows, so ten houses of different sizes read as
 * ten different houses without ten hand-written opening lists.
 */
export function planWallOpenings(span: number, hasDoor: boolean, hasChimney = false): Opening[] {
  // A chimney breast fills the middle of its wall from floor to eaves. A window
  // in the same wall would end up behind the stack.
  if (hasChimney) return [];

  const openings: Opening[] = [];
  if (hasDoor) {
    openings.push({
      kind: "door",
      start: (span - DOORWAY_WIDTH) / 2,
      width: DOORWAY_WIDTH,
      sill: 0,
      height: DOORWAY_HEIGHT,
    });
  }

  const usable = span - CORNER_MARGIN * 2 - (hasDoor ? DOORWAY_WIDTH : 0);
  const perRun = hasDoor ? usable / 2 : usable;
  const count = Math.max(0, Math.min(3, Math.floor(perRun / (WINDOW_WIDTH * 2.2))));

  for (const centre of windowCentres(span, count, hasDoor)) {
    openings.push({
      kind: "window",
      start: centre - WINDOW_WIDTH / 2,
      width: WINDOW_WIDTH,
      sill: WINDOW_SILL,
      height: WINDOW_HEIGHT,
    });
  }
  return openings;
}

/** Evenly spaced along the wall, and along each half of it when a door splits it. */
function windowCentres(span: number, count: number, splitByDoor: boolean): number[] {
  if (count === 0) return [];
  if (!splitByDoor) {
    return Array.from({ length: count }, (_, index) => (span * (index + 1)) / (count + 1));
  }
  const run = (span - DOORWAY_WIDTH) / 2;
  const left = Array.from({ length: count }, (_, index) => (run * (index + 1)) / (count + 1));
  return [...left, ...left.map((offset) => span - offset)];
}
