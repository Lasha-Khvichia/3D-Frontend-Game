import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

export type RenderBackend = "webgpu" | "webgl2";

export type EngineHandle = {
  engine: AbstractEngine;
  backend: RenderBackend;
};

/**
 * Rendering above 2x device pixel ratio costs fill rate and buys almost no
 * visible detail on phones and retina laptops.
 */
export const MAX_PIXEL_RATIO = 2;

export async function createEngine(canvas: HTMLCanvasElement): Promise<EngineHandle> {
  if (await WebGPUEngine.IsSupportedAsync) {
    const engine = new WebGPUEngine(canvas, {
      antialias: true,
      stencil: true,
      powerPreference: "high-performance",
    });
    await engine.initAsync();
    applyPixelRatioCap(engine);
    return { engine, backend: "webgpu" };
  }

  const engine = new Engine(
    canvas,
    true,
    { stencil: true, powerPreference: "high-performance", preserveDrawingBuffer: false },
    false,
  );
  applyPixelRatioCap(engine);
  return { engine, backend: "webgl2" };
}

function applyPixelRatioCap(engine: AbstractEngine): void {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  engine.setHardwareScalingLevel(1 / ratio);
}
