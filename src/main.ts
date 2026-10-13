import "./styles/base.css";
import { GameRuntime } from "./core/GameRuntime";
import { buildWorld } from "./game/buildWorld";
import { GameSave } from "./game/GameSave";
import { restoreSave } from "./game/restoreSave";
import { showOpeningWorld, showWorldNow, stepWorld } from "./game/stepWorld";
import { createMainScene } from "./scenes/createMainScene";
import { SettingsBinder } from "./settings/SettingsBinder";
import { publishStats } from "./ui/bridge";
import { mountOverlay } from "./ui/mountOverlay";
import { registerTerrainShade } from "./world/light/TerrainShadePlugin";
import { registerLampLight } from "./world/nightLights/LampLightPlugin";
import { registerCloudShadows } from "./world/sky/CloudShadowPlugin";
import { registerHeightMist } from "./world/weather/HeightMistPlugin";

const canvas = document.getElementById("render-canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('index.html is missing <canvas id="render-canvas">');
}

const overlayRoot = document.getElementById("overlay-root");
if (!overlayRoot) {
  throw new Error('index.html is missing <div id="overlay-root">');
}

mountOverlay(overlayRoot);

// The overlay is already up, so a game that cannot get any graphics would sit
// on a pause menu that never answers. Say why instead; the error still goes
// to the console, and nothing below runs.
const runtime = await GameRuntime.create(canvas).catch((error: unknown) => {
  publishStats({ startFailure: error instanceof Error ? error.message : String(error) });
  throw error;
});
const scene = runtime.loadScene(createMainScene);

// Before any material exists: Babylon only gives a registered plugin to
// materials made after it, and every standard material gets cloud shadows.
registerCloudShadows();
registerTerrainShade();
registerLampLight();
registerHeightMist();

// Every system in the world, built and wired to each other (src/game/).
const world = buildWorld(scene, canvas);

const settings = new SettingsBinder({
  resolution: runtime.resolution,
  camera: world.player.controller.camera,
  controller: world.player.controller,
  dayNight: world.dayNight,
  godRays: world.godRays,
  streaming: world.streaming,
  sky: world.sky,
  weather: world.weather,
  sound: world.sound,
  woodland: world.woodland,
  followClock: () => showWorldNow(world),
});

// Where the player left off, before the first frame is drawn.
restoreSave(world);
const { bean, camera } = world.player.controller;
const save = new GameSave(world.dayNight, world.weather, bean, camera, world.carrying);

// After the settings, which carry the render distance.
showOpeningWorld(world);

runtime.setSimulationStep((fixedDeltaSeconds) => {
  stepWorld(world, fixedDeltaSeconds);
  save.update(fixedDeltaSeconds);
});

// Every drawn frame, between the steps: the view glides and the mouse turns it.
runtime.setFrameUpdate((progress) => {
  world.player.present(progress);
  // After the camera has turned, so the waist can be turned back level.
  world.carrying.present();
});

runtime.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    settings.dispose();
    world.boulders.dispose();
    world.terrain.dispose();
    world.terrainShade.dispose();
    world.fireShadows.dispose();
    world.miniMap.dispose();
    world.player.dispose();
    runtime.dispose();
  });
}
