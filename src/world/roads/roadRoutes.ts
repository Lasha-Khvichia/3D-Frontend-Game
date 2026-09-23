import { SETTLEMENTS, type Settlement } from "../houses/settlements";

/** Two places a road joins. */
export type RoadRoute = { readonly from: Settlement; readonly to: Settlement };

/**
 * Which places are joined to which: a road out of the village to every
 * hamlet, and a ring joining each hamlet to its neighbour round the island.
 *
 * Spokes alone leave a walk between two hamlets going through the village;
 * the ring alone leaves the village on the rim of its own island. Both
 * together is what a country that grew up round one market town looks like.
 */
export function roadRoutes(): RoadRoute[] {
  const [village, ...hamlets] = SETTLEMENTS;
  if (!village) return [];
  // Round the compass from the village, so the ring joins neighbours rather
  // than crossing the island to the far side.
  const round = [...hamlets].sort(
    (a, b) =>
      Math.atan2(a.centreX - village.centreX, a.centreZ - village.centreZ) -
      Math.atan2(b.centreX - village.centreX, b.centreZ - village.centreZ),
  );
  const routes: RoadRoute[] = round.map((hamlet) => ({ from: village, to: hamlet }));
  round.forEach((hamlet, index) => {
    const next = round[(index + 1) % round.length];
    if (next && next !== hamlet) routes.push({ from: hamlet, to: next });
  });
  return routes;
}
