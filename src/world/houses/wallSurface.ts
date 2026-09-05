import type { BoxSpec, WallSpec } from "./buildWallSegments";
import type { Side } from "./houseBlueprint";

/** Which way is out, for each of the four walls. */
const OUTWARD: Record<Side, 1 | -1> = { north: 1, south: -1, east: 1, west: -1 };

/**
 * How far a decoration sinks into the wall behind it.
 *
 * Never zero. At zero the back of the stone is exactly level with the face of
 * the wall, and two surfaces in the same plane flicker against each other as
 * the camera moves.
 */
const EMBED = 0.05;

/** The outside face of a wall: which plane it is, and which way it points. */
export type WallSurface = {
  readonly axis: "x" | "z";
  readonly facePlane: number;
  readonly outward: 1 | -1;
};

export function outerFaceOf(wall: WallSpec, side: Side): WallSurface {
  const outward = OUTWARD[side];
  return {
    axis: wall.axis,
    facePlane: wall.offset + (outward * wall.thickness) / 2,
    outward,
  };
}

/**
 * Lays a slab flat against the outside of a wall.
 *
 * `along` is measured from the wall's start and `up` from the ground, both to
 * the middle of the slab, because everything placed here is centred on
 * something: a stone on its patch of wall, a beam on its opening.
 */
export function slabOnWall(
  surface: WallSurface,
  wallStart: number,
  along: number,
  up: number,
  length: number,
  height: number,
  stickOut: number,
): BoxSpec {
  const thickness = stickOut + EMBED;
  const outCentre = surface.facePlane + (surface.outward * (stickOut - EMBED)) / 2;
  const runsAlongX = surface.axis === "x";
  return {
    x: runsAlongX ? wallStart + along : outCentre,
    y: up,
    z: runsAlongX ? outCentre : wallStart + along,
    width: runsAlongX ? length : thickness,
    height,
    depth: runsAlongX ? thickness : length,
  };
}

/** Where a wall segment sits along its wall, and how tall it is. */
export function measureSegment(
  box: BoxSpec,
  surface: WallSurface,
  wallStart: number,
): { along: number; length: number; low: number; high: number } {
  const runsAlongX = surface.axis === "x";
  return {
    along: (runsAlongX ? box.x : box.z) - wallStart,
    length: runsAlongX ? box.width : box.depth,
    low: box.y - box.height / 2,
    high: box.y + box.height / 2,
  };
}
