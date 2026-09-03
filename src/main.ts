import "./styles/base.css";
import { GameRuntime } from "./core/GameRuntime";
import { createMainScene } from "./scenes/createMainScene";
import { mountOverlay } from "./ui/mountOverlay";
import { DayNightCycle } from "./world/DayNightCycle";
import { attachPlayer } from "./player/attachPlayer";

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
const player = attachPlayer(scene, canvas);

// setSimulationStep takes one function, so every system is composed here.
runtime.setSimulationStep((fixedDeltaSeconds) => {
  dayNight.advance(fixedDeltaSeconds);
  player.update(fixedDeltaSeconds);
});

runtime.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    player.dispose();
    runtime.dispose();
  });
}
