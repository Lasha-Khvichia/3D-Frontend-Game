import type { HeightGrid } from "../terrain/HeightGrid";
import { layRoads, type RoadSegment } from "./roadField";
import { roadCountry } from "./roadCountry";
import { roadRoutes } from "./roadRoutes";
import { routeOverLand, type RoadPoint } from "./routeOverLand";
import { settlementGate } from "./settlementGate";
import { smoothRoad } from "./smoothRoad";
import { villageStreet } from "./villageStreet";

/** Metres of water past which the ground is no place for a road. */
const WET = 0.06;
/** Metres from a bridge that counts as being on it. */
const AT_A_BRIDGE = 24;

/**
 * Lays every road on the island and hands back what was laid.
 *
 * Each one is found over the land rather than ruled across the map: the
 * cheapest way between two places, where climbing costs dearly and high
 * ground costs more than low (`routeOverLand`), then rounded into the sort of
 * line a road wears for itself (`smoothRoad`). So they bend round the hills
 * instead of going over them, and cross a river only at a bridge.
 *
 * Roads leave the village at the two ends of its street and stop outside a
 * hamlet's ring of cottages, so none is driven through somebody's house. If
 * the land offers no way at all, that road is laid straight and counted in
 * what comes back.
 */
export function buildRoads(
  grid: HeightGrid,
  waterDepthAt: (x: number, z: number) => number,
  crossings: readonly RoadPoint[],
): { segments: RoadSegment[]; straightened: number; forded: number } {
  const street = villageStreet();
  // The street itself is a road: bare ground between the two rows of houses,
  // which the cobbles are then laid on.
  const segments: RoadSegment[] = [
    {
      ax: street.westX,
      az: street.centreZ,
      bx: street.eastX,
      bz: street.centreZ,
      halfWidth: street.halfWidth,
    },
  ];
  const country = roadCountry(grid, waterDepthAt, crossings);
  let straightened = 0;
  let forded = 0;
  for (const route of roadRoutes()) {
    const from = settlementGate(route.from, route.to.centreX, route.to.centreZ);
    const to = settlementGate(route.to, route.from.centreX, route.from.centreZ);
    const found = routeOverLand(country, from, to);
    if (!found) straightened += 1;
    const corners = found ? [from, ...found, to] : [from, to];
    const rounded = smoothRoad(corners);
    // A rounded corner may cut across a river the corners themselves kept out
    // of. Where it does, that road keeps its corners.
    const points = isDry(rounded, waterDepthAt, crossings) ? rounded : corners;
    if (!isDry(points, waterDepthAt, crossings)) forded += 1;
    for (let index = 0; index + 1 < points.length; index += 1) {
      const a = points[index]!;
      const b = points[index + 1]!;
      if (Math.hypot(b.x - a.x, b.z - a.z) < 0.5) continue;
      segments.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z });
    }
  }
  layRoads(segments);
  return { segments, straightened, forded };
}

/** Whether a whole run of road stays out of the water, sampled along it and not only at its turns. */
function isDry(
  points: readonly RoadPoint[],
  waterDepthAt: (x: number, z: number) => number,
  crossings: readonly RoadPoint[],
): boolean {
  for (let index = 0; index + 1 < points.length; index += 1) {
    const from = points[index]!;
    const to = points[index + 1]!;
    const steps = Math.max(1, Math.round(Math.hypot(to.x - from.x, to.z - from.z) / 3));
    for (let step = 0; step <= steps; step += 1) {
      const along = step / steps;
      const at = { x: from.x + (to.x - from.x) * along, z: from.z + (to.z - from.z) * along };
      if (waterDepthAt(at.x, at.z) <= WET) continue;
      if (!crossings.some((c) => Math.hypot(c.x - at.x, c.z - at.z) < AT_A_BRIDGE)) return false;
    }
  }
  return true;
}
