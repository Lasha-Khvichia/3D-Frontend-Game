import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { between } from "../houses/seededRandom";
import type { BranchSpec } from "./branchSpec";
import { tiltDirection } from "./tiltDirection";
import type { TreeSpecies } from "./treeSpecies";

/** One leaf, before it becomes a transform in the canopy buffer. */
export type LeafSpec = {
  /** Where the stalk meets the twig, in the tree's own coordinates. */
  readonly position: Vector3;
  /** Where the tip points. */
  readonly direction: Vector3;
  /** Spin about its own stalk, so leaves on one twig do not lie in a plane. */
  readonly roll: number;
  readonly size: number;
  /** 0 at the ground, 1 at the top. Drives trunk bend in the wind. */
  readonly heightShare: number;
  /** 0 on the trunk, 1 on the outermost twigs. Drives branch sway. */
  readonly tipShare: number;
};

/** Leaves grow on the outermost generations of wood, not on the trunk. */
const BEARING_DEPTHS = 2;
/** How far a leaf leans off the twig it grows on, in radians. */
const LEAN = [0.5, 1.5] as const;
const SIZE_JITTER = [0.7, 1.35] as const;

/**
 * Hangs leaves on the outer twigs of a skeleton.
 *
 * Carriers are picked at random for each leaf rather than filled twig by twig,
 * which matters later: the level-of-detail system thins a canopy by drawing
 * only the first part of this list, and that only looks right if the early
 * entries are spread through the whole tree rather than clustered on one limb.
 */
export function scatterLeaves(
  skeleton: readonly BranchSpec[],
  species: TreeSpecies,
  random: () => number,
): LeafSpec[] {
  const carriers = skeleton.filter((branch) => branch.depth > species.depth - BEARING_DEPTHS);
  if (carriers.length === 0) return [];

  const leaves: LeafSpec[] = [];
  for (let index = 0; index < species.leaves; index += 1) {
    const twig = carriers[Math.floor(random() * carriers.length)]!;
    const along = between(random, 0.15, 1);
    const rise = twig.end.subtract(twig.start);

    leaves.push({
      position: twig.start.add(rise.scale(along)),
      direction: tiltDirection(
        rise.normalizeToNew(),
        between(random, LEAN[0], LEAN[1]),
        random() * Math.PI * 2,
      ),
      roll: random() * Math.PI * 2,
      size: species.leafSize * between(random, SIZE_JITTER[0], SIZE_JITTER[1]),
      heightShare: twig.heightShare,
      tipShare: twig.tipShare,
    });
  }
  return leaves;
}
