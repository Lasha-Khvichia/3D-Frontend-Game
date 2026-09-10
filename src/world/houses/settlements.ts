import { HAMLET_SITES, hamletHouses } from "./hamletLayout";
import {
  STREET_CENTRE_X,
  STREET_CENTRE_Z,
  VILLAGE_HOUSES,
  type PlacedHouse,
} from "./villageHouses";

/**
 * One inhabited place: where it is, how much room it needs to itself, and the
 * houses in it.
 *
 * `clearance` is what everything else in the world reads. A cliff dropped on
 * the street would be a cliff inside somebody's kitchen, and the scatter that
 * places cliffs has no other way to know a settlement is there.
 */
export type Settlement = {
  readonly name: string;
  readonly centreX: number;
  readonly centreZ: number;
  readonly clearance: number;
  readonly houses: readonly PlacedHouse[];
};

/** The street is 70 m long. This keeps its approaches open as well as its houses. */
const VILLAGE_CLEARANCE = 65;
/** A green 15 m across, the cottages round it, and room to walk behind them. */
const HAMLET_CLEARANCE = 38;

/**
 * Everywhere people live: the one village, and five hamlets scattered across
 * the map.
 *
 * The hamlets are the same houses built by the same code, three to a green
 * instead of ten to a street. Nothing about them is a cheaper copy — walk to
 * one and the doors open and the fires are lit, because they are made by the
 * same `buildHouse` call the village is.
 */
export const SETTLEMENTS: readonly Settlement[] = [
  {
    name: "village",
    centreX: STREET_CENTRE_X,
    centreZ: STREET_CENTRE_Z,
    clearance: VILLAGE_CLEARANCE,
    houses: VILLAGE_HOUSES,
  },
  ...HAMLET_SITES.map((site) => ({
    name: site.name,
    centreX: site.x,
    centreZ: site.z,
    clearance: HAMLET_CLEARANCE,
    houses: hamletHouses(site),
  })),
];

/** Every house in the world, in one list, for the systems that need them all. */
export const ALL_HOUSES: readonly PlacedHouse[] = SETTLEMENTS.flatMap(
  (settlement) => settlement.houses,
);
