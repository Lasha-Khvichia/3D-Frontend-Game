import type { BoxSpec } from "../houses/buildWallSegments";

/** Gap left between planks, so the boards read separately. */
const PLANK_GAP = 0.012;
/** Thickness of the cross boards holding the planks together. */
const LEDGE_DEPTH = 0.03;
const LEDGE_HEIGHT = 0.14;

/**
 * A board panel, as a door leaf or a shutter would be built: vertical planks
 * held together by two cross pieces.
 *
 * Returned in the leaf's own coordinates, with the hinge at the origin and the
 * panel running out along +X. Merging it and then parenting it to the hinge is
 * what lets the whole thing swing as one.
 */
export function createPlankPanel(width: number, height: number, thickness: number): BoxSpec[] {
  const plankCount = Math.max(2, Math.round(width / 0.22));
  const plankWidth = (width - PLANK_GAP * (plankCount - 1)) / plankCount;
  const boards: BoxSpec[] = [];

  for (let index = 0; index < plankCount; index += 1) {
    boards.push({
      x: index * (plankWidth + PLANK_GAP) + plankWidth / 2,
      y: 0,
      z: 0,
      width: plankWidth,
      height,
      depth: thickness,
    });
  }

  // Cross pieces on the back, a little in from each end.
  for (const share of [0.22, 0.78]) {
    boards.push({
      x: width / 2,
      y: (share - 0.5) * height,
      z: -(thickness / 2 + LEDGE_DEPTH / 2),
      width,
      height: LEDGE_HEIGHT,
      depth: LEDGE_DEPTH,
    });
  }
  return boards;
}
