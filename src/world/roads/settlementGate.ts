import { HOUSE_SHAPES } from "../houses/houseShapes";
import type { Settlement } from "../houses/settlements";
import type { RoadPoint } from "./routeRoad";
import { villageStreet } from "./villageStreet";

/** Metres from a hamlet's green the road stops at: outside the ring its cottages stand on. */
const GREEN_GATE = 21;
/** Metres of room left round a house, and the turns tried to find a way between two of them. */
const CLEAR_OF_A_HOUSE = 2;
const TURNS = [0, 9, -9, 18, -18, 27, -27, 36, -36, 50, -50, 65, -65];

/**
 * Where a road meets a place: never its middle.
 *
 * The village is left at whichever end of its street faces the way you are
 * going, so no road is driven between the two rows of houses. A hamlet is met
 * just outside the ring its cottages stand in, at the gap between two of them
 * nearest the way the road comes from — which is what stops a road being laid
 * through somebody's kitchen.
 */
export function settlementGate(place: Settlement, towardX: number, towardZ: number): RoadPoint {
  const street = villageStreet();
  const onTheStreet = Math.abs(place.centreZ - street.centreZ) < street.halfWidth;
  if (onTheStreet && place.centreX > street.westX && place.centreX < street.eastX) {
    const end = towardX < place.centreX ? street.westX : street.eastX;
    return { x: end, z: street.centreZ };
  }

  const aim = Math.atan2(towardX - place.centreX, towardZ - place.centreZ);
  for (const turn of TURNS) {
    const angle = aim + (turn * Math.PI) / 180;
    const gate = {
      x: place.centreX + Math.sin(angle) * GREEN_GATE,
      z: place.centreZ + Math.cos(angle) * GREEN_GATE,
    };
    if (isClear(place, gate) && isClear(place, halfway(place, gate))) return gate;
  }
  return { x: place.centreX, z: place.centreZ };
}

/** Whether a spot stands clear of every house of this place. */
function isClear(place: Settlement, at: RoadPoint): boolean {
  return place.houses.every((house) => {
    const shape = HOUSE_SHAPES[house.blueprint.name as keyof typeof HOUSE_SHAPES];
    const halfX = (shape?.width ?? 6) / 2 + CLEAR_OF_A_HOUSE;
    const halfZ = (shape?.depth ?? 6) / 2 + CLEAR_OF_A_HOUSE;
    return Math.abs(at.x - house.centreX) > halfX || Math.abs(at.z - house.centreZ) > halfZ;
  });
}

function halfway(place: Settlement, gate: RoadPoint): RoadPoint {
  return { x: (place.centreX + gate.x) / 2, z: (place.centreZ + gate.z) / 2 };
}
