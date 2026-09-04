import "./styles/base.css";
import { GameRuntime } from "./core/GameRuntime";
import { createMainScene } from "./scenes/createMainScene";
import { mountOverlay } from "./ui/mountOverlay";
import { DayNightCycle } from "./world/DayNightCycle";
import { attachPlayer } from "./player/attachPlayer";
import { MiniMap } from "./minimap/MiniMap";
import { SunGodRays } from "./world/SunGodRays";
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
const player = attachPlayer(scene, canvas, miniMap.camera);
dayNight.addShadowCaster(player.controller.bean);
dayNight.setShadowFocus(player.controller.bean.position);
const godRays = new SunGodRays(scene, player.controller.camera, dayNight.sunMesh);

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
  player.update(fixedDeltaSeconds);
  miniMap.update(fixedDeltaSeconds, player.controller.bean, player.wantsOverheadMap(), dayNight);
  godRays.update(dayNight.sunHeight);
});

runtime.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    settings.dispose();
    player.dispose();
    runtime.dispose();
  });
}
