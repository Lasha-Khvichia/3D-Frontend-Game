import type { Scene } from "@babylonjs/core/scene";
import { smokeWind } from "../world/fire/createSmokeParticles";
import { GrassBlockerGrid } from "../world/GrassBlockerGrid";
import { rectangleBlocker } from "../world/grassBlockers";
import { houseDistanceGroups } from "../world/houses/houseDistanceGroups";
import { serveWorldMap } from "../world/map/serveWorldMap";
import { Boulders } from "../world/rocks/Boulders";
import { treeDistanceGroup } from "../world/trees/treeDistanceGroup";
import { TreeWind } from "../world/trees/TreeWind";
import { Seasons } from "../world/seasons/Seasons";
import { terrainSoil } from "../world/terrain/terrainSoil";
import { LeafFall } from "../world/seasons/LeafFall";
import { Wildflowers } from "../world/seasons/Wildflowers";
import { Woodland } from "../world/trees/Woodland";
import { WorldEdge } from "../world/WorldEdge";
import { WorldStreaming } from "../world/WorldStreaming";
import { buildLand } from "./buildLand";
import { buildSound } from "./buildSound";
import { buildVillage } from "./buildVillage";
import { buildWeather } from "./buildWeather";

export type World = ReturnType<typeof buildWorld>;

/**
 * Builds the whole world and wires its systems to each other: the land and
 * sky, the village, the woods and stones, what is shown by distance, and the
 * weather. `stepWorld` runs what this builds.
 */
export function buildWorld(scene: Scene, canvas: HTMLCanvasElement) {
  const land = buildLand(scene, canvas);
  const { terrain, dayNight, godRays, grass, player, sky } = land;
  const village = buildVillage(scene, land);
  const { houses, openings, fires, lanterns } = village;

  const wind = new TreeWind(scene.getEngine());
  const woodland = new Woodland(scene, wind, dayNight.sunAndMoon, terrain);
  // Loose stones, built only near the player; the god rays are told as they come and go.
  const boulders = new Boulders(scene, terrain, godRays);

  // Lanterns go with their settlement: glass as far as its houses, iron and posts as far as their trim.
  const houseGroups = houseDistanceGroups(houses, openings.doors, openings.windows, fires.hearths);
  houseGroups.bodies.push(...lanterns.groups.bodies);
  houseGroups.details.push(...lanterns.groups.details);
  // What is built, drawn and hidden, by how far away it is. See WorldStreaming.
  const streaming = new WorldStreaming(scene, {
    terrain,
    boulders,
    trees: woodland.trees.map(treeDistanceGroup),
    houses: houseGroups,
  });

  // M opens the painted world map; it is drawn the first time, then kept.
  serveWorldMap(terrain, player.controller.bean, player.controller.camera);

  // Wade too far out to sea and you are put back on the beach.
  const worldEdge = new WorldEdge(terrain);

  // Grass keeps out of every stone, trunk and wall, and shortens beside them.
  const blockers = new GrassBlockerGrid([
    ...houses.map((house) => rectangleBlocker(house.footprint)),
    ...woodland.grassBlockers,
    ...boulders.grassBlockers,
    ...lanterns.grassBlockers,
  ]);
  grass.setBlockers(blockers);

  // The growing year: leaf colour, bare winter branches, the grass's colour, flowers.
  const soil = terrainSoil(terrain);
  const flowers = new Wildflowers(scene, soil, (x, z) => blockers.grassLeftAt(x, z));
  const leafFall = new LeafFall(scene, woodland.trees);
  const seasons = new Seasons(woodland, grass, flowers, leafFall);

  const followers = [
    dayNight.light,
    sky,
    streaming,
    wind,
    grass,
    smokeWind,
    village.nightLights,
    seasons,
  ];
  const weather = buildWeather(scene, land, houses, followers);
  // Rain, wind, leaves, thunder, birds, crickets, creaks and footsteps, all made in code.
  const sound = buildSound(scene, land, houses, woodland.trees, fires.hearths, weather);
  return {
    ...land,
    ...village,
    flowers,
    leafFall,
    wind,
    woodland,
    seasons,
    boulders,
    streaming,
    worldEdge,
    ...weather,
    ...sound,
  };
}
