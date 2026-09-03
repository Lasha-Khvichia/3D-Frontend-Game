import { SceneInstrumentation } from "@babylonjs/core/Instrumentation/sceneInstrumentation";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { Scene } from "@babylonjs/core/scene";
import { publishStats } from "../ui/bridge";

/**
 * Publishing every frame would re-render the React overlay 60 times a second.
 * Twice a second is readable and costs nothing.
 */
const PUBLISH_INTERVAL_MS = 500;

export class StatsReporter {
  private instrumentation: SceneInstrumentation | null = null;
  private lastPublishedAt = 0;

  constructor(private readonly engine: AbstractEngine) {}

  watch(scene: Scene): void {
    this.instrumentation?.dispose();
    this.instrumentation = new SceneInstrumentation(scene);
    this.instrumentation.captureFrameTime = true;
  }

  tick(): void {
    const now = performance.now();
    if (now - this.lastPublishedAt < PUBLISH_INTERVAL_MS) return;
    this.lastPublishedAt = now;

    publishStats({
      fps: Math.round(this.engine.getFps()),
      drawCalls: this.instrumentation?.drawCallsCounter.current ?? 0,
      frameTimeMs: Number((this.instrumentation?.frameTimeCounter.current ?? 0).toFixed(2)),
    });
  }

  dispose(): void {
    this.instrumentation?.dispose();
    this.instrumentation = null;
  }
}
