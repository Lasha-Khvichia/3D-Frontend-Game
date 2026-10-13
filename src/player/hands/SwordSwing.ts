/** Seconds the blade takes across, and the pause before it can go again. */
const SWING = 0.34;
const RECOVER = 0.16;
/** How far through the swing the blade is level with the body: where it bites. */
const STRIKE = SWING * 0.45;

/**
 * When the sword is swung, and the one moment in each swing that it hits.
 *
 * Counted in simulation seconds, so a swing freezes with everything else when
 * the game is paused, and a slow frame does not skip the moment of the hit:
 * the strike is the step the swing crosses that moment, however long it was.
 */
export class SwordSwing {
  private time = Number.POSITIVE_INFINITY;

  /** True on the one step the blade bites. */
  update(seconds: number, asked: boolean, holding: boolean): boolean {
    const before = this.time;
    this.time += seconds;
    const struck = holding && before < STRIKE && this.time >= STRIKE;
    if (asked && holding && this.time >= SWING + RECOVER) this.time = 0;
    return struck;
  }

  /** 0 to 1 through a swing, or null between swings. */
  get progress(): number | null {
    return this.time < SWING ? this.time / SWING : null;
  }
}
