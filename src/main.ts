import "./styles/base.css";
import { GameRuntime } from "./core/GameRuntime";
import { createEmptyScene } from "./scenes/createEmptyScene";
import { mountOverlay } from "./ui/mountOverlay";

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
runtime.loadScene(createEmptyScene);
runtime.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => runtime.dispose());
}
