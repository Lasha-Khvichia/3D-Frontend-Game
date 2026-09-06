import "./styles/base.css";
import { GameRuntime } from "./core/GameRuntime";
import { createMainScene } from "./scenes/createMainScene";
import { mountOverlay } from "./ui/mountOverlay";
import { publishPrompt } from "./ui/bridge";
import { DayNightCycle } from "./world/DayNightCycle";
import { attachPlayer } from "./player/attachPlayer";
import { MiniMap } from "./minimap/MiniMap";
import { SunGodRays } from "./world/SunGodRays";
import { GrassField } from "./world/GrassField";
import { buildVillage } from "./world/houses/buildVillage";
import { VillageOpenings } from "./world/openings/VillageOpenings";
import { VillageFires } from "./world/fire/VillageFires";
import { PLAYER_HEIGHT } from "./player/createPlayerBean";
import { SettingsBinder } from "./settings/SettingsBinder";

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

const dayNight = new DayNightCycle(scene);
const miniMap = new MiniMap(scene);
const grass = new GrassField(scene);
const player = attachPlayer(scene, canvas, miniMap.camera);
dayNight.addShadowCaster(player.controller.bean);
dayNight.setShadowFocus(player.controller.bean.position);
// Only what is registered flattens the grass. The ground never does.
grass.addPusher(player.controller.bean, PLAYER_HEIGHT / 2);
const godRays = new SunGodRays(scene, player.controller.camera, dayNight.sunMesh);

// Built from code, not loaded, so the world is complete on the first frame.
const village = buildVillage(scene);
for (const house of village) {
  dayNight.addShadowCaster(house.walls);
  dayNight.addShadowCaster(house.roof);
  // Stone and timber sit flat on walls that already block the light.
  for (const detail of house.decor) godRays.excludeFromOcclusion(detail);
}
grass.setExclusions(village.map((house) => house.footprint));

// Doors and shutters. They move, so they cannot be merged into the houses.
const openings = new VillageOpenings(scene, village);
for (const mesh of openings.shadowCasters) dayNight.addShadowCaster(mesh);
for (const mesh of openings.occlusionSkips) godRays.excludeFromOcclusion(mesh);

// Fireplaces, chimneys, and the one firelight the whole village shares.
const fires = new VillageFires(scene, village);
for (const mesh of fires.shadowCasters) dayNight.addShadowCaster(mesh);

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
  miniMap.update(fixedDeltaSeconds, player.controller.bean, player.wantsOverheadMap(), dayNight);
  godRays.update(dayNight.sunHeight);
  fires.update(fixedDeltaSeconds, player.controller.bean.position);
  grass.update(fixedDeltaSeconds, player.controller.bean.position);
});

runtime.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    settings.dispose();
    miniMap.dispose();
    player.dispose();
    runtime.dispose();
  });
}
