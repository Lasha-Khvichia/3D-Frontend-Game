import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { PlacedOpening } from "../houses/placeOpenings";
import type { HingedLeaf } from "./createHingedLeaf";
import { isWithin } from "./isWithin";
import type { WindowLatch } from "./WindowLatch";

/** Swing when open. Just past square, so the shutters lie back on the wall. */
const OPEN_ANGLE = 1.68;
const SWING_RATE = 7;
/** Being this close to the window counts as being able to reach it. */
const REACH = 1.5;
const SHUT_ANGLE = 0.05;

/**
 * A window with a pair of shutters and a bolt.
 *
 * The shutters swing outwards until they lie back flat against the wall, which
 * is both what real shutters do and the reason they can carry collision
 * without becoming something you snag on: open, they stand a hand's width off a
 * wall you could not walk through anyway.
 *
 * The bolt is checked before anything moves. A locked window will not open for
 * anyone, which is the same rule the door bar follows.
 */
export class ShutteredWindow {
  private angle = 0;
  private target = 0;
  private readonly baseYaw: number[];

  constructor(
    readonly opening: PlacedOpening,
    private readonly leaves: readonly HingedLeaf[],
    private readonly latch: WindowLatch,
  ) {
    this.baseYaw = leaves.map((leaf) => leaf.hinge.rotation.y);
  }

  get isOpen(): boolean {
    return Math.abs(this.angle) > SHUT_ANGLE;
  }

  get isLocked(): boolean {
    return this.latch.isLocked;
  }

  get panels(): Mesh[] {
    return this.leaves.map((leaf) => leaf.panel);
  }

  isInReach(player: Vector3): boolean {
    return isWithin(player, this.opening.centre, REACH);
  }

  /** The open key. Refused while the bolt is down. */
  toggleOpen(player: Vector3): boolean {
    if (this.latch.isLocked || !this.isInReach(player)) return false;
    this.target = this.isOpen ? 0 : OPEN_ANGLE;
    return true;
  }

  /** The lock key. Locking shuts the shutters on its way. */
  toggleLatch(player: Vector3): boolean {
    if (!this.isInReach(player)) return false;
    this.latch.toggle();
    if (this.latch.isLocked) this.target = 0;
    return true;
  }

  update(seconds: number): void {
    this.angle += (this.target - this.angle) * Math.min(1, seconds * SWING_RATE);
    this.leaves.forEach((leaf, index) => {
      // The two shutters mirror each other: each swings out from its own jamb.
      leaf.hinge.rotation.y = (this.baseYaw[index] ?? 0) + this.angle * leaf.outwardSign;
      leaf.hinge.computeWorldMatrix(true);
      leaf.collider.computeWorldMatrix(true);
    });
    this.latch.update(seconds, !this.isOpen);
  }
}
