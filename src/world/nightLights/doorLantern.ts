import type { House } from "../houses/buildHouse";
import { WALL_THICKNESS } from "../houses/houseBlueprint";
import type { PlacedOpening } from "../houses/placeOpenings";
import { SETTLEMENTS } from "../houses/settlements";
import type { LanternPlace } from "./lanternPlaces";
import { DOOR_LANTERN_OUT } from "./lanternSizes";

/** Metres: the glass above the step, and out beside the door's edge. */
const HEIGHT = 2.1;
const BESIDE = 0.35;

/**
 * The lantern by a house's door, on whichever side has more wall before a
 * corner or an open shutter, so it never hangs where a shutter swings.
 */
export function doorLantern(house: House, index: number, door: PlacedOpening): LanternPlace {
  const { centre, outward, along } = door;
  const alongOf = (x: number, z: number) => (x - centre.x) * along.x + (z - centre.z) * along.z;
  const { minX, maxX, minZ, maxZ } = house.footprint;
  const corners = [
    alongOf(minX, minZ),
    alongOf(maxX, minZ),
    alongOf(minX, maxZ),
    alongOf(maxX, maxZ),
  ];
  const windows = house.openings.filter(
    (o) => o.kind !== "door" && o.outward.x * outward.x + o.outward.z * outward.z > 0.9,
  );
  // A window's hole reaches half its width from its middle, and each open shutter half again.
  const room = (side: number) =>
    Math.min(
      Math.max(...corners.map((t) => t * side)) - WALL_THICKNESS,
      ...windows
        .map((w) => ({ t: alongOf(w.centre.x, w.centre.z) * side, width: w.width }))
        .filter(({ t }) => t > 0)
        .map(({ t, width }) => t - width),
    );
  const side = room(1) >= room(-1) ? 1 : -1;
  // Where the wall is short, halfway between the door and what is beside it.
  const beside = side * Math.min(door.width / 2 + BESIDE, (door.width / 2 + room(side)) / 2);
  const out = door.wallThickness / 2 + DOOR_LANTERN_OUT;
  const name = house.blueprint.name;
  return {
    x: centre.x + outward.x * out + along.x * beside,
    y: HEIGHT,
    z: centre.z + outward.z * out + along.z * beside,
    settlement: SETTLEMENTS.findIndex((s) => s.houses.some((h) => h.blueprint.name === name)),
    wall: { outX: outward.x, outZ: outward.z, house: index },
  };
}
