import type { Scene } from "@babylonjs/core/scene";
import { MiniMap } from "../minimap/MiniMap";
import { attachPlayer } from "../player/attachPlayer";
import { PLAYER_HEIGHT } from "../player/createPlayerBean";
import { DayNightCycle } from "../world/DayNightCycle";
import { Meadow } from "../world/Meadow";
import { SunGodRays } from "../world/SunGodRays";
import { TerrainShadeMap } from "../world/light/TerrainShadeMap";
import { Sky } from "../world/sky/Sky";
import { Terrain } from "../world/terrain/Terrain";
import { terrainSoil } from "../world/terrain/terrainSoil";
import { WinterGround } from "../world/weather/snow/WinterGround";

export type Land = ReturnType<typeof buildLand>;

/**
 * The island, the player standing on it, and the sky and light over both:
 * what everything else in the world is placed into.
 */
export function buildLand(scene: Scene, canvas: HTMLCanvasElement) {
  // The island first: everything after it stands on it.
  const terrain = new Terrain(scene);
  // What the player walks on: the terrain, with ice to stand on and snow to wade through.
  const winterGround = new WinterGround(terrain);
  // Mountains shading the valleys, worked out in a worker as the sun moves.
  const terrainShade = new TerrainShadeMap(scene, terrain.grid);
  const dayNight = new DayNightCycle(scene);
  const { sunAndMoon } = dayNight;
  const miniMap = new MiniMap(scene);
  const grass = new Meadow(scene, terrainSoil(terrain));
  const player = attachPlayer(scene, canvas, miniMap, winterGround);
  const { bean, camera } = player.controller;
  sunAndMoon.addShadowCaster(bean);
  sunAndMoon.setShadowFocus(bean.position);
  // Only what is registered flattens the grass. The ground never does.
  grass.addPusher(bean, PLAYER_HEIGHT / 2);
  const godRays = new SunGodRays(scene, camera, sunAndMoon.sunMesh);
  // A million triangles of grass, blocking nothing a sun shaft would miss.
  for (const mesh of grass.meshes) godRays.excludeFromOcclusion(mesh);
  // A sheet of sea to the horizon would block the sun the moment it set into it.
  for (const mesh of terrain.waterMeshes) godRays.excludeFromOcclusion(mesh);
  for (const bridge of terrain.rivers.bridges) sunAndMoon.addShadowCaster(bridge);
  for (const rock of terrain.rivers.springs) sunAndMoon.addShadowCaster(rock);

  // The sky's colour, and the clouds, their weather and their shadows.
  const sky = new Sky(scene, dayNight);
  // Both domes would black out the sun in the shafts' occlusion pass.
  for (const mesh of sky.meshes) godRays.excludeFromOcclusion(mesh);

  // Where the player is, which everything round them follows. Moved in place, never replaced.
  const eye = bean.position;
  return {
    terrain,
    terrainShade,
    winterGround,
    dayNight,
    miniMap,
    grass,
    player,
    eye,
    godRays,
    sky,
  };
}
