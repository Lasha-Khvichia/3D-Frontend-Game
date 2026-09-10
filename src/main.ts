import "./styles/base.css";
import { GameRuntime } from "./core/GameRuntime";
import { createMainScene } from "./scenes/createMainScene";
import { mountOverlay } from "./ui/mountOverlay";
import { publishPrompt } from "./ui/bridge";
import { DayNightCycle } from "./world/DayNightCycle";
import { attachPlayer } from "./player/attachPlayer";
import { MiniMap } from "./minimap/MiniMap";
import { SunGodRays } from "./world/SunGodRays";
import { Meadow } from "./world/Meadow";
import { buildSettlements } from "./world/houses/buildSettlements";
import { VillageOpenings } from "./world/openings/VillageOpenings";
import { VillageFires } from "./world/fire/VillageFires";
import { Woodland } from "./world/trees/Woodland";
import { TreeWind } from "./world/trees/TreeWind";
import { PLAYER_HEIGHT } from "./player/createPlayerBean";
import { SettingsBinder } from "./settings/SettingsBinder";
import { Terrain } from "./world/terrain/Terrain";
import { terrainSoil } from "./world/terrain/terrainSoil";
import { Boulders } from "./world/rocks/Boulders";
import { WorldEdge } from "./world/WorldEdge";

const canvas = document.getElementById("render-canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('index.html is missing <canvas id="render-canvas">');
}

const overlayRoot = document.getElementById("overlay-root");
if (!overlayRoot) {
  throw new Error('index.html is missing <div id="overlay-root">');
}

mountOverlay(overlayRoot);

const runtime = await GameRuntime.create(canvas);
const scene = runtime.loadScene(createMainScene);

// The island first: everything after it stands on it.
const terrain = new Terrain(scene);
const dayNight = new DayNightCycle(scene);
const miniMap = new MiniMap(scene);
const grass = new Meadow(scene, terrainSoil(terrain));
const player = attachPlayer(scene, canvas, miniMap.camera, terrain);
dayNight.addShadowCaster(player.controller.bean);
dayNight.setShadowFocus(player.controller.bean.position);
// Only what is registered flattens the grass. The ground never does.
grass.addPusher(player.controller.bean, PLAYER_HEIGHT / 2);
const godRays = new SunGodRays(scene, player.controller.camera, dayNight.sunMesh);
// A million triangles of grass, blocking nothing a sun shaft would miss.
for (const mesh of grass.meshes) godRays.excludeFromOcclusion(mesh);
// A sheet of sea to the horizon would block the sun the moment it set into it.
for (const mesh of terrain.waterMeshes) godRays.excludeFromOcclusion(mesh);
for (const bridge of terrain.rivers.bridges) dayNight.addShadowCaster(bridge);
for (const rock of terrain.rivers.springs) dayNight.addShadowCaster(rock);

const houses = buildSettlements(scene);
for (const house of houses) {
  dayNight.addShadowCaster(house.walls);
  dayNight.addShadowCaster(house.roof);
  // Stone and timber sit flat on walls that already block the light.
  for (const detail of house.decor) godRays.excludeFromOcclusion(detail);
}

const openings = new VillageOpenings(scene, houses);
for (const mesh of openings.shadowCasters) dayNight.addShadowCaster(mesh);
for (const mesh of openings.occlusionSkips) godRays.excludeFromOcclusion(mesh);

// Fireplaces, chimneys, and the one firelight the whole village shares.
const fires = new VillageFires(scene, houses);
for (const mesh of fires.shadowCasters) dayNight.addShadowCaster(mesh);

const wind = new TreeWind(scene.getEngine());
const woodland = new Woodland(scene, wind, dayNight, terrain);

// Loose stones. Nothing to update: a stone never moves.
const boulders = new Boulders(scene, terrain);
for (const stone of boulders.meshes) godRays.excludeFromOcclusion(stone);

// Wade too far out to sea and you are put back on the beach.
const worldEdge = new WorldEdge(terrain);

grass.setExclusions([
  ...houses.map((house) => house.footprint),
  ...woodland.footprints,
  ...boulders.footprints,
]);

const settings = new SettingsBinder({
  engine: scene.getEngine(),
  camera: player.controller.camera,
  controller: player.controller,
  dayNight,
  godRays,
});

// setSimulationStep takes one function, so every system is composed here.
runtime.setSimulationStep((fixedDeltaSeconds) => {
  dayNight.advance(fixedDeltaSeconds);
  // Before the player's own update, which clears any key press nothing took.
  publishPrompt(
    openings.update(fixedDeltaSeconds, player.controller.bean.position, player.takeOpeningKeys()),
  );
  player.update(fixedDeltaSeconds);
  worldEdge.update(fixedDeltaSeconds, player.controller);
  miniMap.update(fixedDeltaSeconds, player.controller.bean, player.wantsOverheadMap(), dayNight);
  godRays.update(dayNight.sunHeight);
  fires.update(fixedDeltaSeconds, player.controller.bean.position);
  wind.update(fixedDeltaSeconds);
  woodland.update(player.controller.bean.position);
  grass.update(fixedDeltaSeconds, player.controller.bean.position);
});

runtime.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    settings.dispose();
    boulders.dispose();
    terrain.dispose();
    miniMap.dispose();
    player.dispose();
    runtime.dispose();
  });
}
