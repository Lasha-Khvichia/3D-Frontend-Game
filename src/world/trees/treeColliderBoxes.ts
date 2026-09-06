import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { BranchSpec } from "./branchSpec";

/** A box to be built and merged into the tree's collision shell. */
export type ColliderBox = {
  readonly position: Vector3;
  readonly size: Vector3;
  /** Null means axis-aligned: upright, with no face that can lift the player. */
  readonly turn: Quaternion | null;
};

const UP = new Vector3(0, 1, 0);
/**
 * Above this, wood is out of reach on foot.
 *
 * A standing player's head is at 1.8 m and a jump lifts them 1.11 m, so nothing
 * above about 2.9 m can be walked into from the ground.
 */
const REACH_HEIGHT = 3;
/**
 * Every collider is at least this thick.
 *
 * A sprint covers 0.133 m in one simulation step, so a twig-sized collider
 * could be crossed between two steps without ever being touched. Up in the
 * canopy the extra width is invisible and nothing can reach it anyway.
 */
const MIN_THICKNESS = 0.2;
/** Segments are drawn slightly long, and their colliders match. */
const OVERLAP = 1.08;

/**
 * Collision boxes for every branch in a tree, so none of it can be walked
 * through — the trunk, the limbs, and the twigs at the top.
 *
 * Two shapes, chosen by height, and the reason is the whole design:
 *
 * - **Within reach, boxes are upright**, and a leaning segment is cut into
 *   several of them. A tilted collider is the one shape Babylon's solver
 *   handles badly — it slides the player along whatever is hit, so a tilted box
 *   lifts them a few centimetres at a time and a tree becomes a staircase.
 * - **Out of reach, one box per segment, turned to lie along it.** Tighter, far
 *   fewer boxes, and nothing up there can be walked into anyway.
 */
export function treeColliderBoxes(skeleton: readonly BranchSpec[], origin: Vector3): ColliderBox[] {
  const boxes: ColliderBox[] = [];

  for (const spec of skeleton) {
    const rise = spec.end.subtract(spec.start);
    const length = rise.length();
    if (length < 1e-3) continue;
    const thickness = Math.max(spec.radius * 2, MIN_THICKNESS);

    if (Math.min(spec.start.y, spec.end.y) > REACH_HEIGHT) {
      boxes.push({
        position: spec.start.add(rise.scale(0.5)).addInPlace(origin),
        size: new Vector3(thickness, length * OVERLAP, thickness),
        turn: Quaternion.FromUnitVectorsToRef(UP, rise.scale(1 / length), new Quaternion()),
      });
      continue;
    }

    // Low down, cut the segment into upright slices short enough to hug it.
    const slices = Math.min(6, Math.max(1, Math.ceil(length / (thickness * 0.9))));
    for (let slice = 0; slice < slices; slice += 1) {
      const low = spec.start.add(rise.scale(slice / slices));
      const high = spec.start.add(rise.scale((slice + 1) / slices));
      boxes.push({
        position: new Vector3(
          origin.x + (low.x + high.x) / 2,
          (low.y + high.y) / 2,
          origin.z + (low.z + high.z) / 2,
        ),
        size: new Vector3(
          Math.abs(high.x - low.x) + thickness,
          Math.max(Math.abs(high.y - low.y), thickness * 0.6),
          Math.abs(high.z - low.z) + thickness,
        ),
        turn: null,
      });
    }
  }

  return boxes;
}
