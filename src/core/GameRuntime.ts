import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { Scene } from "@babylonjs/core/scene";
import { createEngine, type RenderBackend } from "./createEngine";
import type { RenderFrame, SimulationStep } from "./FixedStepLoop";
import { FrameRunner } from "./FrameRunner";
import { StatsReporter } from "./StatsReporter";
import { AutoResolution } from "./AutoResolution";
import { toggleInspector } from "./toggleInspector";
import { publishStats, subscribeToCommands, type OverlayCommand } from "../ui/bridge";

export type SceneFactory = (engine: AbstractEngine) => Scene;

/** Owns the engine, the loop and the active scene. Nothing else creates them. */
export class GameRuntime {
  private activeScene: Scene | null = null;
  private readonly stats: StatsReporter;
  private readonly frames: FrameRunner;
  /** Lowers the resolution while frames run slow; the menu's setting is its ceiling. */
  readonly resolution: AutoResolution;
  private unsubscribeCommands: (() => void) | null = null;

  private readonly handleResize = (): void => {
    this.engine.resize();
  };

  private readonly handleCommand = (command: OverlayCommand): void => {
    if (command.type === "toggle-inspector" && this.activeScene) {
      void toggleInspector(this.activeScene);
    }
  };

  private constructor(
    private readonly engine: AbstractEngine,
    readonly backend: RenderBackend,
  ) {
    this.stats = new StatsReporter(engine);
    this.resolution = new AutoResolution(engine);
    this.frames = new FrameRunner(engine, this.stats, this.resolution);
  }

  static async create(canvas: HTMLCanvasElement): Promise<GameRuntime> {
    const { engine, backend } = await createEngine(canvas);
    const runtime = new GameRuntime(engine, backend);

    window.addEventListener("resize", runtime.handleResize);
    runtime.unsubscribeCommands = subscribeToCommands(runtime.handleCommand);
    publishStats({ backend });

    return runtime;
  }

  loadScene(factory: SceneFactory): Scene {
    this.activeScene?.dispose();
    const scene = factory(this.engine);
    this.activeScene = scene;
    this.stats.watch(scene);
    this.frames.reset();
    return scene;
  }

  /** Where gameplay systems will run, at a fixed 60 steps per second. */
  setSimulationStep(step: SimulationStep): void {
    this.frames.step = step;
  }

  /**
   * Runs once per drawn frame, after the steps and before the draw, with how
   * far the clock has got towards the next step, 0 to 1. For presentation
   * only — smoothing what the steps decided, reading the mouse — never for
   * gameplay, which would then run faster on a faster screen.
   */
  setFrameUpdate(update: RenderFrame): void {
    this.frames.update = update;
  }

  start(): void {
    this.engine.runRenderLoop(() => {
      if (this.activeScene) this.frames.run(this.activeScene);
    });
  }

  stop(): void {
    this.engine.stopRenderLoop();
  }

  dispose(): void {
    this.stop();
    window.removeEventListener("resize", this.handleResize);
    this.unsubscribeCommands?.();
    this.unsubscribeCommands = null;
    this.stats.dispose();
    this.activeScene?.dispose();
    this.activeScene = null;
    this.engine.dispose();
  }
}
