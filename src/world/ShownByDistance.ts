import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Node } from "@babylonjs/core/node";

/** Things shown and hidden together: one tree, or one house's walls and roof. */
export type DistanceGroup = {
  readonly x: number;
  readonly z: number;
  /** How far the group reaches from its middle, so its near edge is what counts. */
  readonly radius: number;
  readonly nodes: readonly Node[];
};

/**
 * Metres past the limit a shown group is kept, so one standing on the line
 * does not blink as the player sways.
 */
const SLACK = 10;

/**
 * Hides groups of meshes beyond a distance from the player, and shows them
 * again inside it.
 *
 * Hidden means disabled: not drawn, not in the shadow map, not collided with.
 * Nothing is thrown away, so a door left open is still open when you come
 * back. That is the difference from stones, which remember nothing and are
 * rebuilt instead.
 */
export class ShownByDistance {
  private readonly shown: boolean[];

  constructor(private readonly groups: readonly DistanceGroup[]) {
    this.shown = groups.map(() => true);
  }

  /** How many groups are shown right now. */
  get shownCount(): number {
    return this.shown.filter(Boolean).length;
  }

  update(eye: Vector3, within: number): void {
    this.groups.forEach((group, index) => {
      const distance = Math.hypot(group.x - eye.x, group.z - eye.z) - group.radius;
      const wasShown = this.shown[index]!;
      const wanted = distance < (wasShown ? within + SLACK : within);
      if (wanted === wasShown) return;
      this.shown[index] = wanted;
      for (const node of group.nodes) node.setEnabled(wanted);
    });
  }
}
