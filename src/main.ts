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
import { WorldStreaming } from "./world/WorldStreaming";
import { houseDistanceGroups } from "./world/houses/houseDistanceGroups";
import { treeDistanceGroup } from "./world/trees/treeDistanceGroup";
import { registerCloudShadows } from "./world/sky/CloudShadowPlugin";
import { registerHeightMist } from "./world/weather/HeightMistPlugin";
import { Sky } from "./world/sky/Sky";
import { serveWorldMap } from "./world/map/serveWorldMap";
import { GrassBlockerGrid } from "./world/GrassBlockerGrid";
import { rectangleBlocker } from "./world/grassBlockers";
import { Weather } from "./world/weather/Weather";
import { smokeWind } from "./world/fire/createSmokeParticles";

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

// Before any material exists: Babylon only gives a registered plugin to
// materials made after it, and every standard material gets cloud shadows.
registerCloudShadows();
registerHeightMist();

// The island first: everything after it stands on it.
const terrain = new Terrain(scene);
const dayNight = new DayNightCycle(scene);
const miniMap = new MiniMap(scene);
const grass = new Meadow(scene, terrainSoil(terrain));
const player = attachPlayer(scene, canvas, miniMap, terrain);
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

// The sky's colour, and the clouds, their weather and their shadows.
const sky = new Sky(scene, dayNight);
// Both domes would black out the sun in the shafts' occlusion pass.
for (const mesh of sky.meshes) godRays.excludeFromOcclusion(mesh);

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

// Loose stones, built only near the player; the god rays are told as they come and go.
const boulders = new Boulders(scene, terrain, godRays);

// What is built, drawn and hidden, by how far away it is. See WorldStreaming.
const streaming = new WorldStreaming(scene, {
  terrain,
  boulders,
  trees: woodland.trees.map(treeDistanceGroup),
  houses: houseDistanceGroups(houses, openings.doors, openings.windows, fires.hearths),
});

// M opens the painted world map; it is drawn the first time, then kept.
serveWorldMap(terrain, player.controller.bean, player.controller.camera);

// Wade too far out to sea and you are put back on the beach.
const worldEdge = new WorldEdge(terrain);

// Grass keeps out of every stone, trunk and wall, and shortens beside them.
grass.setBlockers(
  new GrassBlockerGrid([
    ...houses.map((house) => rectangleBlocker(house.footprint)),
    ...woodland.grassBlockers,
    ...boulders.grassBlockers,
  ]),
);

// The weather: worked out from the date every step, and followed by the sky's
// colour and clouds, the fog, the trees, the grass and the chimney smoke.
const weather = new Weather(player.controller.bean.position);
for (const listener of [dayNight, sky, streaming, wind, grass, smokeWind]) {
  weather.addListener(listener);
}

const settings = new SettingsBinder({
  resolution: runtime.resolution,
  camera: player.controller.camera,
  controller: player.controller,
  dayNight,
  godRays,
  streaming,
  sky,
  weather,
});

// After the settings, which carry the render distance: the first frame opens
// on a finished world rather than one filling in around the player.
streaming.prime(player.controller.bean.position);
// And the opening weather, shown before any step runs: the game opens paused.
weather.update(dayNight.totalHours);
dayNight.refresh();
sky.repaint();

// setSimulationStep takes one function, so every system is composed here.
runtime.setSimulationStep((fixedDeltaSeconds) => {
  dayNight.advance(fixedDeltaSeconds);
  weather.update(dayNight.totalHours);
  // Before the player's own update, which clears any key press nothing took.
  publishPrompt(
    openings.update(fixedDeltaSeconds, player.controller.bean.position, player.takeOpeningKeys()),
  );
  player.update(fixedDeltaSeconds);
  worldEdge.update(fixedDeltaSeconds, player.controller);
  streaming.update(player.controller.bean.position);
  sky.update(fixedDeltaSeconds, player.controller.bean.position);
  godRays.setCloudCover(sky.sunlightThrough);
  miniMap.update(fixedDeltaSeconds, player.controller.bean, player.wantsOverheadMap(), dayNight);
  godRays.update(dayNight.sunAndMoon.sunDirection);
  fires.update(fixedDeltaSeconds, player.controller.bean.position);
  wind.update(fixedDeltaSeconds);
  woodland.update(player.controller.bean.position);
  grass.update(fixedDeltaSeconds, player.controller.bean.position);
});

// Every drawn frame, between the steps: the view glides and the mouse turns it.
runtime.setFrameUpdate((progress) => player.present(progress));

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
