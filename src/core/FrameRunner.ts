import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { Scene } from "@babylonjs/core/scene";
import type { AutoResolution } from "./AutoResolution";
import { FixedStepLoop, type RenderFrame, type SimulationStep } from "./FixedStepLoop";
import { ParticleFreeze } from "./ParticleFreeze";
import type { StatsReporter } from "./StatsReporter";
import { readPaused } from "../ui/bridge";

/**
 * One drawn frame: the fixed steps the clock owes, the presentation update,
 * and the draw — or, paused, the draw alone with everything held still.
 */
export class FrameRunner {
  /** Gameplay, at a fixed 60 steps per second. */
  step: SimulationStep = () => {};
  /** Presentation, once per drawn frame after the steps. */
  update: RenderFrame = () => {};
  private readonly loop = new FixedStepLoop(60, 5);
  private readonly particles = new ParticleFreeze();

  constructor(
    private readonly engine: AbstractEngine,
    private readonly stats: StatsReporter,
    private readonly resolution: AutoResolution,
  ) {}

  /** Forgets time owed, so a new scene or a resume does not replay a burst of steps. */
  reset(): void {
    this.loop.reset();
  }

  run(scene: Scene): void {
    // Paused freezes the simulation but keeps rendering, so the world stays on
    // screen behind the menu. The accumulator is reset so that time spent in
    // the menu is not replayed as a burst of steps on resume.
    if (readPaused()) {
      this.loop.reset();
      this.particles.hold(scene);
      scene.render();
      this.stats.tick();
      return;
    }
    this.particles.release();

    const frameSeconds = this.engine.getDeltaTime() / 1000;
    this.loop.advance(
      frameSeconds,
      (fixedDeltaSeconds) => this.step(fixedDeltaSeconds),
      (progress) => {
        this.update(progress);
        scene.render();
      },
    );
    this.resolution.frame(this.engine.getDeltaTime());
    this.stats.tick();
  }
}
