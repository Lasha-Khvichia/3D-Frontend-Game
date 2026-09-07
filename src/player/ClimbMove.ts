import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { smoothStep } from "../world/blend";
import { PLAYER_HEIGHT } from "./createPlayerBean";
import type { Ledge } from "./findLedge";

/** Hauling up to the ledge, then getting over it. */
const RISE_SECONDS = 0.35;
const OVER_SECONDS = 0.3;

/**
 * The climb itself: a scripted path from where the player stood to the top.
 *
 * Scripted, because `moveWithCollisions` cannot be used to climb the very thing
 * it exists to stop you at. Writing the position directly needs nothing turned
 * off: a mesh's `checkCollisions` governs what other things do about it, not
 * what it does itself.
 *
 * Two legs rather than one straight line, and that is the whole animation. A
 * single interpolation from start to finish is a diagonal slide through the
 * wall; going up first and over second is a climb. Both legs are eased, so the
 * player rises smoothly, pauses imperceptibly at the top, and settles forward.
 */
export class ClimbMove {
  private elapsed = 0;
  private readonly start: Vector3;
  private readonly top: Vector3;
  private readonly landing: Vector3;

  constructor(start: Vector3, ledge: Ledge) {
    this.start = start.clone();
    // Straight up from where they stood, to standing height on the ledge.
    this.top = new Vector3(start.x, ledge.topY + PLAYER_HEIGHT / 2, start.z);
    this.landing = ledge.landing.clone();
  }

  get isDone(): boolean {
    return this.elapsed >= RISE_SECONDS + OVER_SECONDS;
  }

  /** Advances the climb and writes where the player is now. */
  advance(seconds: number, out: Vector3): void {
    this.elapsed += seconds;

    if (this.elapsed < RISE_SECONDS) {
      Vector3.LerpToRef(this.start, this.top, smoothStep(0, 1, this.elapsed / RISE_SECONDS), out);
      return;
    }

    const over = Math.min(1, (this.elapsed - RISE_SECONDS) / OVER_SECONDS);
    Vector3.LerpToRef(this.top, this.landing, smoothStep(0, 1, over), out);
  }
}
