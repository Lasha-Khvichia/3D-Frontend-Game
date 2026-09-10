import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Node } from "@babylonjs/core/node";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { isOutsideOf, type PlacedOpening } from "../houses/placeOpenings";
import type { DoorBar } from "./DoorBar";
import type { HingedLeaf } from "./createHingedLeaf";
import { canReachBar, nearDoorway, nearLeafEdge } from "./doorReach";

/** Swing when open, just past square, so the leaf clears the way. */
const OPEN_ANGLE = 1.72;
/** Higher is faster. Eased, so a leaf slows as it arrives. */
const SWING_RATE = 5.5;
const SHUT_ANGLE = 0.06;

/**
 * A door that opens because you walked into it.
 *
 * **A push always swings the leaf away from whoever pushed it.** From the
 * street it opens inwards, from inside it opens outwards, and walking into the
 * open leaf swings it shut. That rule is what stops the door ever sweeping
 * through the player, which is how push-to-open doors usually go wrong.
 *
 * The bar drops only from inside, and while it is down nothing moves the door.
 */
export class Door {
  private angle = 0;
  private target = 0;
  private readonly baseYaw: number;

  constructor(
    readonly opening: PlacedOpening,
    private readonly leaf: HingedLeaf,
    private readonly bar: DoorBar,
  ) {
    this.baseYaw = leaf.hinge.rotation.y;
  }

  get isBarred(): boolean {
    return this.bar.isDown;
  }

  get panel(): Mesh {
    return this.leaf.panel;
  }

  /** The leaf, which is seen from afar, and the bar inside, which is not. */
  get nodes(): { readonly leaf: Node; readonly bar: readonly Node[] } {
    return { leaf: this.leaf.hinge, bar: this.bar.meshes };
  }

  canBarFrom(player: Vector3): boolean {
    return canReachBar(player, this.opening);
  }

  get isOpen(): boolean {
    return Math.abs(this.angle) > SHUT_ANGLE;
  }

  isInReach(player: Vector3): boolean {
    return nearDoorway(player, this.opening) || (this.isOpen && nearLeafEdge(player, this.leaf));
  }

  /** Still swinging. A push part way through a swing would fight itself. */
  private get isSwinging(): boolean {
    return Math.abs(this.target - this.angle) > 0.02;
  }

  /** Walking into it. Returns true if the door did something. */
  pushFrom(player: Vector3): boolean {
    if (this.bar.isDown || this.isSwinging) return false;
    if (!this.isOpen) {
      if (!nearDoorway(player, this.opening)) return false;
      const inwards = isOutsideOf(this.opening, player) ? -1 : 1;
      this.target = OPEN_ANGLE * this.leaf.outwardSign * inwards;
      return true;
    }
    // Shutting it means leaning on the leaf's far edge, well clear of the
    // doorway. Anything looser and walking in would slam the door behind you.
    if (nearDoorway(player, this.opening) || !nearLeafEdge(player, this.leaf)) return false;
    this.target = 0;
    return true;
  }

  toggleBar(player: Vector3): boolean {
    if (!this.canBarFrom(player)) return false;
    this.bar.toggle();
    if (this.bar.isDown) this.target = 0;
    return true;
  }

  update(seconds: number): void {
    this.angle += (this.target - this.angle) * Math.min(1, seconds * SWING_RATE);
    this.leaf.hinge.rotation.y = this.baseYaw + this.angle;
    this.leaf.hinge.computeWorldMatrix(true);
    this.leaf.collider.computeWorldMatrix(true);
    this.bar.update(seconds, !this.isOpen);
  }
}
