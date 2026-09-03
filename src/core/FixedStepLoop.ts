export type SimulationStep = (fixedDeltaSeconds: number) => void;
export type RenderFrame = (interpolationAlpha: number) => void;

/**
 * Runs game logic at a constant rate no matter what the display does, and
 * renders as often as the browser allows.
 *
 * Without this, physics and movement behave differently on a 60Hz monitor
 * than on a 144Hz one. Retrofitting it later means rewriting every system.
 */
export class FixedStepLoop {
  private accumulatedSeconds = 0;
  private readonly stepSeconds: number;
  private readonly maxCatchUpSeconds: number;

  constructor(stepsPerSecond = 60, maxStepsPerFrame = 5) {
    this.stepSeconds = 1 / stepsPerSecond;
    this.maxCatchUpSeconds = this.stepSeconds * maxStepsPerFrame;
  }

  /**
   * `interpolationAlpha` is how far the render sits between the last completed
   * step and the next one, from 0 to 1. Use it to smooth visible motion.
   */
  advance(frameSeconds: number, step: SimulationStep, render: RenderFrame): void {
    // Clamping stops the "spiral of death": a slow frame queues extra steps,
    // which make the next frame slower still.
    this.accumulatedSeconds = Math.min(
      this.accumulatedSeconds + frameSeconds,
      this.maxCatchUpSeconds,
    );

    while (this.accumulatedSeconds >= this.stepSeconds) {
      this.accumulatedSeconds -= this.stepSeconds;
      step(this.stepSeconds);
    }

    render(this.accumulatedSeconds / this.stepSeconds);
  }

  reset(): void {
    this.accumulatedSeconds = 0;
  }
}
