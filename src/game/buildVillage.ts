import type { Scene } from "@babylonjs/core/scene";
import { FireShadows } from "../world/fire/FireShadows";
import { VillageFires } from "../world/fire/VillageFires";
import { buildSettlements } from "../world/houses/buildSettlements";
import { buildLanterns } from "../world/nightLights/buildLanterns";
import { NightLights } from "../world/nightLights/NightLights";
import { WindowGlow } from "../world/nightLights/WindowGlow";
import { VillageOpenings } from "../world/openings/VillageOpenings";
import type { Land } from "./buildLand";

export type Village = ReturnType<typeof buildVillage>;

/**
 * Every house on the island, with its doors and shutters, its fireplace and
 * its chimney, all casting shadows from the sun.
 */
export function buildVillage(scene: Scene, { dayNight, godRays, player }: Land) {
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
  // The firelight's shadows, drawn only inside its own house: what that house is made of, and the player.
  const fireShadows = new FireShadows(
    fires.light,
    houses.map((house, index) => {
      const own = (opening: { houseName: string }) => opening.houseName === house.blueprint.name;
      return [
        house.walls,
        house.roof,
        ...openings.doors.filter((door) => own(door.opening)).map((door) => door.panel),
        ...openings.windows.filter((window) => own(window.opening)).flatMap((w) => w.panels),
        ...(fires.hearths[index] ? [fires.hearths[index].stonework] : []),
        player.controller.bean,
      ];
    }),
  );

  // Lanterns by every door, along the street and round the greens, and windows lit till bedtime.
  const lanterns = buildLanterns(scene, houses);
  for (const mesh of lanterns.shadowCasters) sunAndMoon.addShadowCaster(mesh);
  for (const mesh of lanterns.occlusionSkips) godRays.excludeFromOcclusion(mesh);
  const windowGlow = new WindowGlow(
    scene,
    openings.windows.map((window) => window.opening),
  );
  const { windows } = openings;
  const nightLights = new NightLights(houses, windows, lanterns.glass, lanterns.places, windowGlow);

  return { houses, openings, fires, fireShadows, lanterns, nightLights };
}
