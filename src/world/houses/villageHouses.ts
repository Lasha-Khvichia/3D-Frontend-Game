import type { HouseBlueprint } from "./houseBlueprint";
import { chimneyWallFor } from "./chimneyWallFor";
import { HOUSE_SHAPES, type HouseName } from "./houseShapes";

/** Middle of the street the two rows of houses face across. */
export const STREET_CENTRE_Z = 30;
/** Halfway along the street, so other systems can keep their distance from it. */
export const STREET_CENTRE_X = -3;
/** Half the width of the street, from its middle to a doorstep. */
const STREET_HALF_WIDTH = 6;

/** Which side of the street a house stands on. The door always faces it. */
type Row = "north" | "south";

/** Five a side, spaced so no two houses touch and the street stays open. */
const STREET: readonly { name: HouseName; row: Row; x: number }[] = [
  { name: "barn", row: "north", x: -34 },
  { name: "longhouse", row: "north", x: -19 },
  { name: "hall", row: "north", x: -3 },
  { name: "workshop", row: "north", x: 13 },
  { name: "stable", row: "north", x: 27 },
  { name: "cottageWest", row: "south", x: -30 },
  { name: "weavers", row: "south", x: -16 },
  { name: "bakehouse", row: "south", x: -1 },
  { name: "cottageEast", row: "south", x: 13 },
  { name: "storehouse", row: "south", x: 25 },
];

export type PlacedHouse = {
  readonly blueprint: HouseBlueprint;
  readonly centreX: number;
  readonly centreZ: number;
};

/** The street runs along X, so a house sits back from it by half its own depth. */
export const VILLAGE_HOUSES: readonly PlacedHouse[] = STREET.map(({ name, row, x }) => {
  const shape = HOUSE_SHAPES[name];
  const setBack = STREET_HALF_WIDTH + shape.depth / 2;
  const doorWall = row === "north" ? "south" : "north";
  return {
    blueprint: {
      ...shape,
      name,
      doorWall,
      chimneyWall: chimneyWallFor(name, shape.ridgeAxis, doorWall),
    },
    centreX: x,
    centreZ: row === "north" ? STREET_CENTRE_Z + setBack : STREET_CENTRE_Z - setBack,
  };
});
