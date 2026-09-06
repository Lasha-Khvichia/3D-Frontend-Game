import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { WorldEntity } from "../../core/WorldEntity";
import type { BranchSpec } from "./branchSpec";
import type { TreeBranches } from "./TreeBranches";

/**
 * One branch, as an entity you can hold.
 *
 * It owns no mesh of its own. It is a handle onto one slot in its tree's shared
 * instance buffer, so four hundred of them still draw in a single call. Two
 * fields, and an id worked out on demand rather than stored: there are a great
 * many of these and a string on each would cost more than the branch does.
 */
export class Branch extends WorldEntity {
  constructor(
    private readonly owner: TreeBranches,
    readonly index: number,
    readonly spec: BranchSpec,
  ) {
    super();
  }

  get id(): string {
    return `${this.owner.id}-branch-${this.index}`;
  }

  get start(): Vector3 {
    return this.spec.start;
  }

  get end(): Vector3 {
    return this.spec.end;
  }

  get radius(): number {
    return this.spec.radius;
  }

  /** 0 for the trunk, rising towards the twigs. */
  get depth(): number {
    return this.spec.depth;
  }

  /** Takes the branch out of the tree without disturbing any other. */
  hide(): void {
    this.owner.setBranchScale(this.index, 0);
  }

  show(): void {
    this.owner.setBranchScale(this.index, 1);
  }
}
