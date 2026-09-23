import type { PlacedOpening } from "../houses/placeOpenings";
import { SETTLEMENTS } from "../houses/settlements";
import { STREET_CENTRE_Z } from "../houses/villageHouses";
import type { LanternPlace } from "./lanternPlaces";
import { POST_LANTERN_HEIGHT } from "./lanternSizes";

/** Metres from the street's middle to a doorstep, and posts this far in from it. */
const STREET_EDGE = 6;
const POST_IN = 2.2;
/** Posts this far apart along each side, first and last this far along, staggered across. */
const EVERY = 12;
const WEST_END = -36;
const EAST_END = 30;
/** Nothing stands this close to a door. */
const DOOR_CLEAR = 3;
/** Round a hamlet green: this far from its middle, between the cottages. */
const GREEN_RADIUS = 8;

/** Posts down both sides of the village street, staggered, moved along a little to clear a door. */
export function streetPosts(doors: readonly PlacedOpening[]): LanternPlace[] {
  const posts: LanternPlace[] = [];
  for (const side of [-1, 1]) {
    const z = STREET_CENTRE_Z + side * (STREET_EDGE - POST_IN);
    for (let x = WEST_END + (side > 0 ? 0 : EVERY / 2); x <= EAST_END; x += EVERY) {
      const spot = [0, 1.5, -1.5, 3, -3]
        .map((shift) => x + shift)
        .find((px) => doors.every((d) => Math.hypot(d.centre.x - px, d.centre.z - z) > DOOR_CLEAR));
      if (spot !== undefined)
        posts.push({ x: spot, y: POST_LANTERN_HEIGHT, z, settlement: 0, wall: null });
    }
  }
  return posts;
}

/** Three posts round each hamlet green, each halfway round between two cottages. */
export function greenPosts(): LanternPlace[] {
  return SETTLEMENTS.flatMap((green, settlement) => {
    if (settlement === 0) return [];
    const angles = green.houses
      .map((h) => Math.atan2(h.centreX - green.centreX, h.centreZ - green.centreZ))
      .sort((a, b) => a - b);
    return angles.map((angle, i) => {
      const next = i + 1 < angles.length ? angles[i + 1]! : angles[0]! + Math.PI * 2;
      const middle = (angle + next) / 2;
      return {
        x: green.centreX + Math.sin(middle) * GREEN_RADIUS,
        y: POST_LANTERN_HEIGHT,
        z: green.centreZ + Math.cos(middle) * GREEN_RADIUS,
        settlement,
        wall: null,
      };
    });
  });
}
