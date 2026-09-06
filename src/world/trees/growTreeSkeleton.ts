import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SEGMENT_TAPER, type BranchSpec, type Growth, type Limb } from "./branchSpec";
import { between } from "../houses/seededRandom";
import { tiltDirection } from "./tiltDirection";
import type { TreeSpecies } from "./treeSpecies";

/** How much a segment wanders off its limb's line, as a share of the fork angle. */
const WANDER = 0.45;
/** Random spread on each child's angle, so a fork is not perfectly regular. */
const FORK_JITTER = 0.4;

/**
 * Grows a tree as a list of straight segments.
 *
 * Recursive rather than an L-system: an L-system rewrites a string and then
 * interprets it, which is elegant on paper and slow at runtime past any useful
 * depth. Growing straight into the segment list does the same job in one pass.
 *
 * Only numbers come out. Nothing here touches Babylon, so a skeleton can be
 * grown and checked without a scene.
 */
export function growTreeSkeleton(species: TreeSpecies, random: () => number): BranchSpec[] {
  const branches: BranchSpec[] = [];

  growLimb(
    branches,
    species,
    random,
    { from: new Vector3(0, 0, 0), direction: new Vector3(0, 1, 0) },
    { length: species.trunkHeight, radius: species.trunkRadius, depth: 0, parent: -1 },
  );

  // Height is only known once the whole tree exists, so the share is filled in
  // afterwards rather than guessed at while growing.
  const tallest = branches.reduce((highest, branch) => Math.max(highest, branch.end.y), 1);
  for (const branch of branches) branch.heightShare = branch.end.y / tallest;

  return branches;
}

function growLimb(
  branches: BranchSpec[],
  species: TreeSpecies,
  random: () => number,
  growth: Growth,
  limb: Limb,
): void {
  const segmentLength = limb.length / species.segments;
  let from = growth.from;
  let direction = growth.direction;
  let parent = limb.parent;

  for (let step = 0; step < species.segments; step += 1) {
    direction = tiltDirection(
      direction,
      species.spread * WANDER * random(),
      random() * Math.PI * 2,
    );
    const end = from.add(direction.scale(segmentLength));
    branches.push({
      start: from,
      end,
      radius: limb.radius * Math.pow(SEGMENT_TAPER, step),
      depth: limb.depth,
      parent,
      heightShare: 0,
      tipShare: limb.depth / species.depth,
    });
    parent = branches.length - 1;
    from = end;
  }

  if (limb.depth >= species.depth) return;

  // Children start where the limb actually finished, not where it began, or a
  // fork is thicker than the branch holding it up.
  const tipRadius = limb.radius * Math.pow(SEGMENT_TAPER, species.segments);

  for (let fork = 0; fork < species.forks; fork += 1) {
    // Spread evenly around the parent, then jittered, so forks neither line up
    // nor clump on one side.
    const azimuth =
      ((fork + between(random, -FORK_JITTER, FORK_JITTER)) / species.forks) * Math.PI * 2;
    growLimb(
      branches,
      species,
      random,
      {
        from,
        direction: tiltDirection(direction, species.spread * between(random, 0.7, 1.3), azimuth),
      },
      {
        length: limb.length * species.lengthFalloff,
        radius: tipRadius * species.radiusFalloff,
        depth: limb.depth + 1,
        parent,
      },
    );
  }
}
