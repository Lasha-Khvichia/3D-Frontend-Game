/** A place on the map a road passes through. */
export type RoadPoint = { readonly x: number; readonly z: number };

/** A bridge: where it stands, and which way the river runs under it. */
export type Crossing = RoadPoint & { readonly yaw: number };

/** Metres between the samples that look for water along a straight run. */
const SAMPLE = 4;
/** Metres either side of a bridge the road aims for, well clear of the channel. */
const APPROACH = 15;

/**
 * The way a road actually takes between two places: straight, unless that
 * would walk into a river, in which case it bends to a bridge and crosses
 * there.
 *
 * The bridge it picks is the one that costs the least walking, not the one
 * nearest the water, and it is met **across** the river rather than along the
 * road's own line — aimed the other way, a road climbs the bank to the bridge
 * with its feet in the water the whole way.
 */
export function routeRoad(
  from: RoadPoint,
  to: RoadPoint,
  isWet: (x: number, z: number) => boolean,
  crossings: readonly Crossing[],
  bends = 3,
): RoadPoint[] {
  if (bends <= 0 || !crossesWater(from, to, isWet)) return [from, to];
  const bridge = cheapest(crossings, from, to);
  if (!bridge) return [from, to];

  // Across the river is a quarter turn from the way it flows.
  const acrossX = Math.cos(bridge.yaw);
  const acrossZ = -Math.sin(bridge.yaw);
  const side = (from.x - bridge.x) * acrossX + (from.z - bridge.z) * acrossZ >= 0 ? 1 : -1;
  const before = {
    x: bridge.x + acrossX * APPROACH * side,
    z: bridge.z + acrossZ * APPROACH * side,
  };
  const after = {
    x: bridge.x - acrossX * APPROACH * side,
    z: bridge.z - acrossZ * APPROACH * side,
  };
  const left = crossings.filter((other) => other !== bridge);
  return [
    ...routeRoad(from, before, isWet, left, bends - 1),
    bridge,
    ...routeRoad(after, to, isWet, left, bends - 1),
  ];
}

/** Whether a straight run between two points stands in water anywhere along it. */
function crossesWater(
  from: RoadPoint,
  to: RoadPoint,
  isWet: (x: number, z: number) => boolean,
): boolean {
  const away = Math.hypot(to.x - from.x, to.z - from.z);
  const steps = Math.max(1, Math.round(away / SAMPLE));
  for (let step = 0; step <= steps; step += 1) {
    const along = step / steps;
    if (isWet(from.x + (to.x - from.x) * along, from.z + (to.z - from.z) * along)) return true;
  }
  return false;
}

/** The crossing that adds the least walking to a journey. */
function cheapest(crossings: readonly Crossing[], from: RoadPoint, to: RoadPoint): Crossing | null {
  let best: Crossing | null = null;
  let shortest = Infinity;
  for (const crossing of crossings) {
    const round =
      Math.hypot(crossing.x - from.x, crossing.z - from.z) +
      Math.hypot(to.x - crossing.x, to.z - crossing.z);
    if (round < shortest) [best, shortest] = [crossing, round];
  }
  return best;
}
