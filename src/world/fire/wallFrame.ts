import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { BoxSpec } from "../houses/buildWallSegments";
import { WALL_THICKNESS, type HouseBlueprint, type Side } from "../houses/houseBlueprint";

const OUTWARD: Record<Side, 1 | -1> = { north: 1, south: -1, east: 1, west: -1 };

/**
 * A frame of reference stuck to one wall of a house.
 *
 * Everything in a fireplace is placed relative to the wall it backs onto:
 * across it, out through it, and up. Working in those three directions instead
 * of world X and Z means the same numbers build the fireplace whichever wall it
 * lands on, with no axis swapping at every line.
 */
export type WallFrame = {
  /** +1 when the outside of the wall faces the positive axis direction. */
  readonly outward: 1 | -1;
  /** The wall's inside surface, and its outside surface. */
  readonly innerFace: number;
  readonly outerFace: number;
  /**
   * A box, given its offset across the wall, its bottom and top, its width
   * across the wall, where it starts along the outward axis, and how deep it is.
   */
  box(
    along: number,
    low: number,
    high: number,
    alongSize: number,
    outFrom: number,
    outSize: number,
  ): BoxSpec;
  /** A point, given its offset across the wall, along the outward axis, and up. */
  point(along: number, out: number, y: number): Vector3;
};

export function wallFrameFor(
  blueprint: HouseBlueprint,
  centreX: number,
  centreZ: number,
): WallFrame {
  const alongX = blueprint.chimneyWall === "north" || blueprint.chimneyWall === "south";
  const outward = OUTWARD[blueprint.chimneyWall];
  const halfSize = (alongX ? blueprint.depth : blueprint.width) / 2;
  const wallCentre = alongX ? centreZ : centreX;
  const alongCentre = alongX ? centreX : centreZ;

  return {
    outward,
    innerFace: wallCentre + outward * (halfSize - WALL_THICKNESS),
    outerFace: wallCentre + outward * halfSize,
    box: (along, low, high, alongSize, outFrom, outSize) => ({
      x: alongX ? alongCentre + along : outFrom + (outward * outSize) / 2,
      y: (low + high) / 2,
      z: alongX ? outFrom + (outward * outSize) / 2 : alongCentre + along,
      width: alongX ? alongSize : outSize,
      height: high - low,
      depth: alongX ? outSize : alongSize,
    }),
    point: (along, out, y) =>
      alongX ? new Vector3(alongCentre + along, y, out) : new Vector3(out, y, alongCentre + along),
  };
}
