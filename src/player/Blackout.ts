import { publishStats } from "../ui/bridge";

/** Seconds to fade to black, to stay black while you are carried home, and to come back. */
const FALL = 1.3;
const HOLD = 1.1;
const RISE = 1.6;

/**
 * Going down, and coming to in the village the next morning.
 *
 * Counted in simulation seconds, so pausing in the middle of it holds it.
 * The move home happens while the screen is black — a teleport and a jump of
 * the clock are not things to watch — and the overlay is told only at the two
 * edges, never every step.
 */
export class Blackout {
  private phase: "awake" | "falling" | "rising" = "awake";
  private time = 0;

  /** True from the blow that put you down until you can see again. */
  get out(): boolean {
    return this.phase !== "awake";
  }

  start(): void {
    if (this.phase !== "awake") return;
    this.phase = "falling";
    this.time = 0;
    publishStats({ blackout: true });
  }

  /** `wake` is called once, in the dark, to carry you home and move the clock on. */
  update(seconds: number, wake: () => void): void {
    if (this.phase === "awake") return;
    this.time += seconds;
    if (this.phase === "falling" && this.time >= FALL + HOLD) {
      wake();
      this.phase = "rising";
      this.time = 0;
      publishStats({ blackout: false });
    } else if (this.phase === "rising" && this.time >= RISE) {
      this.phase = "awake";
    }
  }
}
