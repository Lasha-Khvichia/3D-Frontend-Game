import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { Scene } from "@babylonjs/core/scene";
import { createEngine, type RenderBackend } from "./createEngine";
import { FixedStepLoop, type SimulationStep } from "./FixedStepLoop";
import { StatsReporter } from "./StatsReporter";
import { toggleInspector } from "./toggleInspector";
import { publishStats, readPaused, subscribeToCommands, type OverlayCommand } from "../ui/bridge";

export type SceneFactory = (engine: AbstractEngine) => Scene;

/** Owns the engine, the loop and the active scene. Nothing else creates them. */
export class GameRuntime {
  private activeScene: Scene | null = null;
  private simulationStep: SimulationStep = () => {};
  private readonly loop = new FixedStepLoop(60, 5);
  private readonly stats: StatsReporter;
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
    this.loop.reset();
    return scene;
  }

  /** Where gameplay systems will run, at a fixed 60 steps per second. */
  setSimulationStep(step: SimulationStep): void {
    this.simulationStep = step;
  }

  start(): void {
    this.engine.runRenderLoop(() => this.renderFrame());
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

  private renderFrame(): void {
    const scene = this.activeScene;
    if (!scene) return;

    // Paused freezes the simulation but keeps rendering, so the world stays on
    // screen behind the menu. The accumulator is reset so that time spent in
    // the menu is not replayed as a burst of steps on resume.
    if (readPaused()) {
      this.loop.reset();
      scene.render();
      this.stats.tick();
      return;
    }

    const frameSeconds = this.engine.getDeltaTime() / 1000;
    this.loop.advance(
      frameSeconds,
      (fixedDeltaSeconds) => this.simulationStep(fixedDeltaSeconds),
      () => scene.render(),
    );
    this.stats.tick();
  }
}
