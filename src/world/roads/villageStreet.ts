import { HOUSE_SHAPES } from "../houses/houseShapes";
import { STREET_CENTRE_Z, VILLAGE_HOUSES } from "../houses/villageHouses";

/** Metres from the middle of the street to a doorstep, and past the last house it runs. */
const HALF_WIDTH = 6;
const PAST_THE_LAST_HOUSE = 7;

/** The ground the village street covers: cobbled, and where its roads leave from. */
export type Street = {
  readonly westX: number;
  readonly eastX: number;
  readonly centreZ: number;
  readonly halfWidth: number;
};

/**
 * The street the village is built along, worked out from the houses rather
 * than written down again: it runs from a little past the westernmost house
 * to a little past the easternmost, between the two rows of doorsteps.
 */
export function villageStreet(): Street {
  let west = Infinity;
  let east = -Infinity;
  for (const house of VILLAGE_HOUSES) {
    const half = HOUSE_SHAPES[house.blueprint.name as keyof typeof HOUSE_SHAPES].width / 2;
    west = Math.min(west, house.centreX - half);
    east = Math.max(east, house.centreX + half);
  }
  return {
    westX: west - PAST_THE_LAST_HOUSE,
    eastX: east + PAST_THE_LAST_HOUSE,
    centreZ: STREET_CENTRE_Z,
    halfWidth: HALF_WIDTH,
  };
}
