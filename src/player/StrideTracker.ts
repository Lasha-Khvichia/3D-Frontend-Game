import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

/** What the player's feet just did, and how hard: 0 a soft step, 1 a sprint or a long fall. */
export type Stride = { readonly kind: "step" | "jump" | "land"; readonly strength: number };

/** What the tracker reads: only what `PlayerController` already shows. */
export type Walker = {
  readonly bean: AbstractMesh;
  readonly isGrounded: boolean;
  readonly isClimbing: boolean;
};

/** Metres per step at a standstill, and how much longer a step gets per metre a second. */
const STRIDE = 1.1;
const STRIDE_PER_SPEED = 0.08;
/** Most footsteps a second, however fast the travel setting carries the player. */
const MOST_STEPS = 6;
/** Metres a second at which a step is as hard as it gets: a run. */
const RUNNING = 8;
/** Seconds in the air before touching down is heard as a landing, and the fall that lands hardest. */
const LANDING_AFTER = 0.25;
const HARDEST_FALL = 0.9;
/** Metres in one step past which the player was put somewhere, not walked there. */
const A_LEAP = 3;
/** Metres a second upward that only a jump gives: no slope or step climbs this fast. */
const JUMPING = 3;

/**
 * Turns the player's movement into footsteps, a jump's push-off and a
 * landing, from where they are each step and whether they stand on anything.
 * Faster means longer strides as well as quicker ones; nothing is heard in the
 * air or while climbing.
 */
export class StrideTracker {
  private x: number;
  private y: number;
  private z: number;
  private walked = 0;
  private airborne = 0;
  private wasGrounded = true;
  private jumped = false;

  constructor(
    private readonly walker: Walker,
    private readonly heard: (stride: Stride) => void,
  ) {
    ({ x: this.x, y: this.y, z: this.z } = walker.bean.position);
  }

  /** Every step, after the player has moved. */
  update(seconds: number): void {
    const { x, y, z } = this.walker.bean.position;
    const moved = Math.hypot(x - this.x, z - this.z);
    const rose = y - this.y;
    this.x = x;
    this.y = y;
    this.z = z;
    if (moved > A_LEAP) {
      this.walked = 0;
      return;
    }
    const { isGrounded, isClimbing } = this.walker;
    const rising = rose / seconds > JUMPING;
    if (rising && !this.jumped && !isClimbing) this.heard({ kind: "jump", strength: 0.5 });
    this.jumped = rising || (this.jumped && !isGrounded);
    if (!isGrounded || isClimbing) {
      this.wasGrounded = false;
      // A climb is hands, not a fall: only the air after it lands.
      this.airborne = isClimbing ? 0 : this.airborne + seconds;
      return;
    }
    if (!this.wasGrounded) {
      const fall = Math.min(1, this.airborne / HARDEST_FALL);
      if (this.airborne >= LANDING_AFTER) this.heard({ kind: "land", strength: fall });
      this.wasGrounded = true;
      this.airborne = 0;
      this.walked = 0;
      return;
    }
    const speed = moved / seconds;
    this.walked += moved;
    if (this.walked < Math.max(STRIDE + STRIDE_PER_SPEED * speed, speed / MOST_STEPS)) return;
    this.walked = 0;
    this.heard({ kind: "step", strength: Math.min(1, 0.45 + (0.55 * speed) / RUNNING) });
  }
}
