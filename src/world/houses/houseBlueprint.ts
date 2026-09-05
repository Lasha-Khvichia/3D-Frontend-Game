import type { WallSpec } from "./buildWallSegments";
import { planWallOpenings } from "./planWallOpenings";

export type Side = "north" | "south" | "east" | "west";

/** One house, described by numbers rather than by geometry. */
export type HouseBlueprint = {
  readonly name: string;
  /** Outside size in metres, along X and along Z. */
  readonly width: number;
  readonly depth: number;
  /** Height of the walls at the eaves, before the roof starts. */
  readonly wallHeight: number;
  /** How far the ridge rises above the eaves. */
  readonly roofRise: number;
  /** The wall the doorway is cut into. Point it at the street. */
  readonly doorWall: Side;
  /** The roof ridge runs along this axis. Changes the silhouette completely. */
  readonly ridgeAxis: "x" | "z";
};

/**
 * Wall thickness, and the reason the player cannot walk through a wall.
 *
 * Sprinting covers 0.133 m in one simulation step. Anything thinner than that
 * can be crossed entirely between two steps, with no contact in either, which
 * is exactly how the old glTF houses let the player inside. This leaves a
 * factor of 2.6.
 */
export const WALL_THICKNESS = 0.35;

/** A wall, and which face of the house it is, so decoration knows which way is out. */
export type PlannedWall = WallSpec & { readonly side: Side };

/**
 * Turns a blueprint into the four walls it is built from, openings included.
 *
 * Walls along X run the full width; walls along Z stop one thickness short at
 * each end, so the corners meet once instead of overlapping.
 */
export function planHouseWalls(
  blueprint: HouseBlueprint,
  centreX: number,
  centreZ: number,
): PlannedWall[] {
  const halfWidth = blueprint.width / 2;
  const halfDepth = blueprint.depth / 2;
  const inset = WALL_THICKNESS / 2;
  const northZ = centreZ + halfDepth - inset;
  const southZ = centreZ - halfDepth + inset;
  const endFrom = centreZ - halfDepth + WALL_THICKNESS;
  const endTo = centreZ + halfDepth - WALL_THICKNESS;

  const sides: readonly { side: Side; line: WallLine }[] = [
    {
      side: "north",
      line: { axis: "x", offset: northZ, from: centreX - halfWidth, to: centreX + halfWidth },
    },
    {
      side: "south",
      line: { axis: "x", offset: southZ, from: centreX - halfWidth, to: centreX + halfWidth },
    },
    {
      side: "east",
      line: { axis: "z", offset: centreX + halfWidth - inset, from: endFrom, to: endTo },
    },
    {
      side: "west",
      line: { axis: "z", offset: centreX - halfWidth + inset, from: endFrom, to: endTo },
    },
  ];

  return sides.map(({ side, line }) => ({
    ...line,
    side,
    thickness: WALL_THICKNESS,
    height: blueprint.wallHeight,
    openings: planWallOpenings(line.to - line.from, side === blueprint.doorWall),
  }));
}

type WallLine = Pick<WallSpec, "axis" | "offset" | "from" | "to">;
