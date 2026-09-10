import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Hearth } from "../fire/Hearth";
import type { Footprint } from "../footprint";
import type { Door } from "../openings/Door";
import type { ShutteredWindow } from "../openings/ShutteredWindow";
import type { DistanceGroup } from "../ShownByDistance";
import type { House } from "./buildHouse";

/**
 * Past this a house keeps only its shape. A timber frame 20 cm wide is a
 * pixel at 150 m, and every house carries a dozen draw calls of such detail.
 */
export const HOUSE_DETAIL_RANGE = 150;

/**
 * Past this a house loses its fittings: window bolts, their keepers, door
 * bars. A bolt 7 cm wide and 20 cm tall is a 1 by 4 pixel mark at 40 m on a
 * 1080p screen, and the 94 windows carry two meshes each — up to 188 draw
 * calls that were drawn at any distance.
 */
export const HOUSE_FITTINGS_RANGE = 40;

/**
 * Each house split in three for hiding at a distance.
 *
 * The body — walls, roof, door and chimney — is the house's shape on the
 * skyline, and goes only past the render distance. The detail — stone and
 * timber, shutters — goes past `HOUSE_DETAIL_RANGE`, and the fittings — bolts
 * and bars — past `HOUSE_FITTINGS_RANGE`.
 */
export function houseDistanceGroups(
  houses: readonly House[],
  doors: readonly Door[],
  windows: readonly ShutteredWindow[],
  hearths: readonly Hearth[],
): { bodies: DistanceGroup[]; details: DistanceGroup[]; fittings: DistanceGroup[] } {
  const bodies: DistanceGroup[] = [];
  const details: DistanceGroup[] = [];
  const fittings: DistanceGroup[] = [];
  for (const house of houses) {
    const name = house.blueprint.name;
    const ownDoors = doors.filter((door) => door.opening.houseName === name);
    const ownWindows = windows.filter((window) => window.opening.houseName === name);
    const ownHearths = hearths.filter((hearth) => isInside(house.footprint, hearth.firePoint));
    const place = {
      x: house.centreX,
      z: house.centreZ,
      radius: Math.hypot(house.blueprint.width, house.blueprint.depth) / 2,
    };
    bodies.push({
      ...place,
      nodes: [
        house.walls,
        house.roof,
        house.roofCollider,
        ...ownDoors.map((door) => door.nodes.leaf),
        ...ownHearths.map((hearth) => hearth.stonework),
      ],
    });
    details.push({
      ...place,
      nodes: [...house.decor, ...ownWindows.flatMap((window) => window.shutters)],
    });
    fittings.push({
      ...place,
      nodes: [
        ...ownDoors.flatMap((door) => door.nodes.bar),
        ...ownWindows.flatMap((window) => window.fittings),
      ],
    });
  }
  return { bodies, details, fittings };
}

function isInside(footprint: Footprint, point: Vector3): boolean {
  return (
    point.x >= footprint.minX &&
    point.x <= footprint.maxX &&
    point.z >= footprint.minZ &&
    point.z <= footprint.maxZ
  );
}
