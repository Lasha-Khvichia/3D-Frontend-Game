export type OpeningKind = "door" | "window";

/** A hole cut through a wall: a doorway, or a window. */
export type Opening = {
  readonly kind: OpeningKind;
  /** Distance from the wall's start to the opening's near edge. */
  readonly start: number;
  readonly width: number;
  /** Height of the opening's bottom edge above the floor. 0 for a doorway. */
  readonly sill: number;
  readonly height: number;
};

/** One axis-aligned wall, before its openings are cut out of it. */
export type WallSpec = {
  /** The direction the wall runs in. */
  readonly axis: "x" | "z";
  /** The coordinate it sits at: z for an x-axis wall, x for a z-axis wall. */
  readonly offset: number;
  readonly from: number;
  readonly to: number;
  readonly thickness: number;
  readonly height: number;
  readonly openings: readonly Opening[];
};

/** A box in world space, centred on x/y/z. */
export type BoxSpec = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
};

/**
 * Cuts a wall into the solid boxes left around its openings.
 *
 * Boxes rather than one mesh with holes punched through it, because boxes are
 * what the collision solver handles well: thick vertical faces, no slopes to
 * slide up, and no triangle thin enough to walk through between two steps.
 * Boolean subtraction would give the same shape and none of that. Modular
 * pieces are also what game level kits settled on after brush-based CSG.
 *
 * Each opening leaves up to three pieces: wall before it, an apron under a
 * window sill, and a lintel over the top. A doorway has no apron.
 */
export function buildWallSegments(wall: WallSpec): BoxSpec[] {
  const span = wall.to - wall.from;
  const sorted = [...wall.openings].sort((a, b) => a.start - b.start);
  const boxes: BoxSpec[] = [];

  let cursor = 0;
  for (const opening of sorted) {
    const end = opening.start + opening.width;
    if (opening.start > cursor) {
      boxes.push(solidPiece(wall, cursor, opening.start, 0, wall.height));
    }
    if (opening.sill > 0) {
      boxes.push(solidPiece(wall, opening.start, end, 0, opening.sill));
    }
    const top = opening.sill + opening.height;
    if (top < wall.height) {
      boxes.push(solidPiece(wall, opening.start, end, top, wall.height));
    }
    cursor = Math.max(cursor, end);
  }
  if (cursor < span) boxes.push(solidPiece(wall, cursor, span, 0, wall.height));

  return boxes;
}

/** One solid piece, from `along` to `alongEnd` and from `low` to `high`. */
function solidPiece(
  wall: WallSpec,
  along: number,
  alongEnd: number,
  low: number,
  high: number,
): BoxSpec {
  const centre = wall.from + (along + alongEnd) / 2;
  const length = alongEnd - along;
  const runsAlongX = wall.axis === "x";
  return {
    x: runsAlongX ? centre : wall.offset,
    y: (low + high) / 2,
    z: runsAlongX ? wall.offset : centre,
    width: runsAlongX ? length : wall.thickness,
    height: high - low,
    depth: runsAlongX ? wall.thickness : length,
  };
}
