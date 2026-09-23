import { layRoads, type RoadSegment } from "./roadField";
import { roadRoutes } from "./roadRoutes";
import { routeRoad, type Crossing } from "./routeRoad";
import { settlementGate } from "./settlementGate";
import { villageStreet } from "./villageStreet";

/** Metres of water that counts as too wet to lay a road across. */
const WET = 0.06;

/**
 * Lays every road on the island and hands back what was laid.
 *
 * Roads leave the village at the two ends of its street, not from the middle
 * of it, so none of them is driven through somebody's house; between the
 * hamlets they run from green to green. Where one would walk into a river it
 * bends to a bridge (`routeRoad`).
 */
export function buildRoads(
  waterDepthAt: (x: number, z: number) => number,
  bridges: readonly Crossing[],
): RoadSegment[] {
  const street = villageStreet();
  // The street itself is a road: bare ground between the two rows of houses,
  // which the cobbles are then laid on.
  const streetRun: RoadSegment = {
    ax: street.westX,
    az: street.centreZ,
    bx: street.eastX,
    bz: street.centreZ,
    halfWidth: street.halfWidth,
  };
  const isWet = (x: number, z: number): boolean => waterDepthAt(x, z) > WET;
  const segments: RoadSegment[] = [streetRun];
  for (const route of roadRoutes()) {
    const from = settlementGate(route.from, route.to.centreX, route.to.centreZ);
    const to = settlementGate(route.to, route.from.centreX, route.from.centreZ);
    const points = routeRoad(from, to, isWet, bridges);
    for (let index = 0; index + 1 < points.length; index += 1) {
      const a = points[index]!;
      const b = points[index + 1]!;
      if (Math.hypot(b.x - a.x, b.z - a.z) < 1) continue;
      segments.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z });
    }
  }
  layRoads(segments);
  return segments;
}
