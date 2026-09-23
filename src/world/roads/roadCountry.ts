import { HOUSE_SHAPES } from "../houses/houseShapes";
import { ALL_HOUSES } from "../houses/settlements";
import type { HeightGrid } from "../terrain/HeightGrid";
import { GRID_HALF_EXTENT, SEA_LEVEL } from "../terrain/terrainConstants";
import { markShore } from "./markShore";

/** Metres a side of one square the roads are worked out on. */
export const ROUTE_CELL = 16;
/** Metres either side of a bridge that a road may cross water. */
const BRIDGE_REACH = 20;
/** Water deeper than this is not road-making country. */
const WET = 0.06;
/** Ground below this is the beach and the sea's edge; roads keep off it. */
const TOO_LOW = SEA_LEVEL + 0.8;
/** The nine places in a square a road is asked about: a river can hide between fewer. */
const HALF = ROUTE_CELL / 2;
const CORNERS = [-HALF, 0, HALF].flatMap((acrossX) =>
  [-HALF, 0, HALF].map((acrossZ) => [acrossX, acrossZ] as const),
);

/** Metres kept clear of a house. */
const ROUND_A_HOUSE = 4;

/** The island as the road-maker sees it: how high each square is, and which may not be used. */
export type RoadCountry = {
  readonly cells: number;
  readonly height: Float32Array;
  readonly blocked: Uint8Array;
  /** True where a road may cross water: the decks of the bridges. */
  readonly bridged: Uint8Array;
  /** True for dry squares next to water: passable, but a road keeps off them where it can. */
  readonly shore: Uint8Array;
};

/** The world position of a square's middle. */
export function placeOf(cell: number): number {
  return cell * ROUTE_CELL - GRID_HALF_EXTENT;
}

/** The square a world position falls in. */
export function cellOf(place: number): number {
  return Math.round((place + GRID_HALF_EXTENT) / ROUTE_CELL);
}

/**
 * Surveys the island for road building: the height of every square, and the
 * squares no road may cross — deep water away from a bridge, the sea's edge,
 * and the ground somebody's house stands on.
 */
export function roadCountry(
  grid: HeightGrid,
  waterDepthAt: (x: number, z: number) => number,
  crossings: readonly { x: number; z: number }[],
): RoadCountry {
  const cells = Math.ceil((GRID_HALF_EXTENT * 2) / ROUTE_CELL) + 1;
  const height = new Float32Array(cells * cells);
  const blocked = new Uint8Array(cells * cells);
  const bridged = new Uint8Array(cells * cells);
  const houses = ALL_HOUSES.map((house) => {
    const shape = HOUSE_SHAPES[house.blueprint.name as keyof typeof HOUSE_SHAPES];
    return {
      x: house.centreX,
      z: house.centreZ,
      halfX: (shape?.width ?? 6) / 2 + ROUND_A_HOUSE,
      halfZ: (shape?.depth ?? 6) / 2 + ROUND_A_HOUSE,
    };
  });

  for (let row = 0; row < cells; row += 1) {
    for (let column = 0; column < cells; column += 1) {
      const at = row * cells + column;
      const x = placeOf(column);
      const z = placeOf(row);
      const ground = grid.heightAt(x, z);
      height[at] = ground;
      const onABridge = crossings.some((c) => Math.hypot(c.x - x, c.z - z) < BRIDGE_REACH);
      bridged[at] = onABridge ? 1 : 0;
      // The whole square, not its middle: a river narrower than a square can
      // slip between two dry middles, and a road would step straight over it.
      const wet = CORNERS.some(
        ([acrossX, acrossZ]) => waterDepthAt(x + acrossX, z + acrossZ) > WET,
      );
      const inAHouse = houses.some(
        (h) => Math.abs(x - h.x) < h.halfX && Math.abs(z - h.z) < h.halfZ,
      );
      blocked[at] = (wet && !onABridge) || ground < TOO_LOW || inAHouse ? 1 : 0;
    }
  }
  const shore = markShore(cells, blocked, bridged);
  return { cells, height, blocked, bridged, shore };
}
