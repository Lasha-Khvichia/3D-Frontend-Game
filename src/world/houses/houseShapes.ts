import type { HouseBlueprint } from "./houseBlueprint";

/** A house's dimensions, before it is given a place on the street. */
export type HouseShape = Omit<HouseBlueprint, "name" | "doorWall">;

/**
 * The ten houses the village is built from.
 *
 * No two share a size, a height, a roof pitch and a ridge direction, so the
 * street reads as a village rather than one house repeated ten times. Window
 * counts are not listed because they follow from wall length: the bigger
 * houses pick up more windows on their own.
 */
export const HOUSE_SHAPES = {
  barn: { width: 10, depth: 6.5, wallHeight: 3.4, roofRise: 2.8, ridgeAxis: "x" },
  longhouse: { width: 9.5, depth: 5.5, wallHeight: 2.8, roofRise: 2.2, ridgeAxis: "x" },
  hall: { width: 8, depth: 7, wallHeight: 3.2, roofRise: 2.6, ridgeAxis: "x" },
  workshop: { width: 7.5, depth: 6, wallHeight: 2.9, roofRise: 1.8, ridgeAxis: "x" },
  stable: { width: 7, depth: 5, wallHeight: 2.7, roofRise: 2.1, ridgeAxis: "x" },
  cottageWest: { width: 6, depth: 5, wallHeight: 2.6, roofRise: 1.9, ridgeAxis: "x" },
  weavers: { width: 5.5, depth: 5.5, wallHeight: 2.5, roofRise: 1.7, ridgeAxis: "z" },
  bakehouse: { width: 6.5, depth: 5, wallHeight: 2.6, roofRise: 2, ridgeAxis: "z" },
  cottageEast: { width: 5, depth: 6.5, wallHeight: 2.4, roofRise: 1.9, ridgeAxis: "z" },
  storehouse: { width: 6, depth: 6, wallHeight: 3, roofRise: 2.4, ridgeAxis: "z" },
} as const satisfies Record<string, HouseShape>;

export type HouseName = keyof typeof HOUSE_SHAPES;
