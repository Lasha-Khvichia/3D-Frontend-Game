import type { Scene } from "@babylonjs/core/scene";
import { Blackout } from "../player/Blackout";
import { Health } from "../player/Health";
import type { SunAndMoon } from "../world/SunAndMoon";
import type { Terrain } from "../world/terrain/Terrain";
import { Boars } from "../world/creatures/Boars";

/**
 * What lives in the wild, and what it can do to you: the boars at their dens,
 * your health, and the blackout when it runs out.
 *
 * Built once the terrain exists, because the dens keep clear of the roads,
 * and the roads are found while the terrain is built.
 */
export function buildCreatures(scene: Scene, terrain: Terrain, sunAndMoon: SunAndMoon) {
  const boars = new Boars(scene, terrain);
  for (const mesh of boars.herd.meshes) sunAndMoon.addShadowCaster(mesh);
  return { boars, health: new Health(), blackout: new Blackout() };
}
