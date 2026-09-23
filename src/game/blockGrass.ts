import type { Boulders } from "../world/rocks/Boulders";
import { GrassBlockerGrid } from "../world/GrassBlockerGrid";
import { rectangleBlocker } from "../world/grassBlockers";
import type { House } from "../world/houses/buildHouse";
import type { Lanterns } from "../world/nightLights/buildLanterns";
import { roadField } from "../world/roads/roadField";
import { roadGrassBlockers } from "../world/roads/roadGrassBlockers";
import type { Woodland } from "../world/trees/Woodland";

/**
 * Everywhere grass may not grow: inside a wall, a trunk, a stone, a lantern
 * post, or a road. Each thins the grass back in over its own edge rather than
 * cutting a square hole, and they are gathered in one go because setting them
 * rewrites every blade.
 */
export function blockGrass(
  houses: readonly House[],
  woodland: Woodland,
  boulders: Boulders,
  lanterns: Lanterns,
): GrassBlockerGrid {
  return new GrassBlockerGrid([
    ...houses.map((house) => rectangleBlocker(house.footprint)),
    ...woodland.grassBlockers,
    ...boulders.grassBlockers,
    ...lanterns.grassBlockers,
    ...roadGrassBlockers(roadField.segments),
  ]);
}
