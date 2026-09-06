import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { WorldEntity } from "../../core/WorldEntity";
import type { LeafSpec } from "./scatterLeaves";
import type { TreeCanopy } from "./TreeCanopy";

/**
 * One leaf, as an entity you can hold.
 *
 * It owns no mesh. It is a handle onto one slot in its tree's canopy buffer,
 * which is what lets four thousand of them draw in a single call while each
 * stays separately addressable — movable, resizable, removable, and later
 * pickable or detachable.
 *
 * Two fields and an id worked out on demand rather than stored. There are tens
 * of thousands of these; a string kept on each would cost more than the leaf.
 */
export class Leaf extends WorldEntity {
  constructor(
    private readonly canopy: TreeCanopy,
    readonly index: number,
    readonly spec: LeafSpec,
  ) {
    super();
  }

  get id(): string {
    return `${this.canopy.id}-leaf-${this.index}`;
  }

  /** Where the stalk meets the twig, in its tree's own coordinates. */
  get position(): Vector3 {
    return this.spec.position;
  }

  get size(): number {
    return this.spec.size;
  }

  /** 1 is the leaf as grown, 0 takes it off the tree. */
  setScale(amount: number): void {
    this.canopy.setLeafScale(this.index, amount);
  }

  fall(): void {
    this.setScale(0);
  }
}
