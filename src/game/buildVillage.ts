import type { Scene } from "@babylonjs/core/scene";
import { VillageFires } from "../world/fire/VillageFires";
import { buildSettlements } from "../world/houses/buildSettlements";
import { VillageOpenings } from "../world/openings/VillageOpenings";
import type { Land } from "./buildLand";

export type Village = ReturnType<typeof buildVillage>;

/**
 * Every house on the island, with its doors and shutters, its fireplace and
 * its chimney, all casting shadows from the sun.
 */
export function buildVillage(scene: Scene, { dayNight, godRays }: Land) {
  const { sunAndMoon } = dayNight;
  const houses = buildSettlements(scene);
  for (const house of houses) {
    sunAndMoon.addShadowCaster(house.walls);
    sunAndMoon.addShadowCaster(house.roof);
    // Stone and timber sit flat on walls that already block the light.
    for (const detail of house.decor) godRays.excludeFromOcclusion(detail);
  }

  const openings = new VillageOpenings(scene, houses);
  for (const mesh of openings.shadowCasters) sunAndMoon.addShadowCaster(mesh);
  for (const mesh of openings.occlusionSkips) godRays.excludeFromOcclusion(mesh);

  // Fireplaces, chimneys, and the one firelight the whole village shares.
  const fires = new VillageFires(scene, houses);
  for (const mesh of fires.shadowCasters) sunAndMoon.addShadowCaster(mesh);

  return { houses, openings, fires };
}
