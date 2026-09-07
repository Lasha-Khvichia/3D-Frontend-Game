import { Color3 } from "@babylonjs/core/Maths/math.color";

/** Everything that makes one kind of tree look like itself. */
export type TreeSpecies = {
  /** Height of the trunk before the first fork, in metres. */
  readonly trunkHeight: number;
  readonly trunkRadius: number;
  /** How many times a limb forks before it stops. */
  readonly depth: number;
  /** Branches grown at each fork. */
  readonly forks: number;
  /** Each generation is this much shorter and thinner than its parent. */
  readonly lengthFalloff: number;
  readonly radiusFalloff: number;
  /** How far off its parent a child leans, in radians. */
  readonly spread: number;
  /** Segments per limb. More gives a curved limb rather than a straight stick. */
  readonly segments: number;
  readonly bark: Color3;
  readonly leaf: Color3;
  /** Leaves hung on the outermost limbs. */
  readonly leaves: number;
  readonly leafSize: number;
};

/**
 * The kinds of tree the woodland is built from.
 *
 * Same shape as `houseShapes.ts`: a named catalogue of numbers, with the
 * placement kept separate. No two share a silhouette, so a wood of forty trees
 * does not read as one tree repeated forty times.
 */
export const TREE_SPECIES = {
  oak: {
    trunkHeight: 3.4,
    trunkRadius: 0.34,
    depth: 4,
    forks: 3,
    lengthFalloff: 0.72,
    radiusFalloff: 0.62,
    spread: 0.62,
    segments: 3,
    bark: new Color3(0.29, 0.22, 0.16),
    leaf: new Color3(0.24, 0.42, 0.15),
    leaves: 4600,
    leafSize: 0.28,
  },
  birch: {
    trunkHeight: 4.6,
    trunkRadius: 0.22,
    depth: 4,
    forks: 2,
    lengthFalloff: 0.78,
    radiusFalloff: 0.66,
    spread: 0.44,
    segments: 4,
    bark: new Color3(0.74, 0.72, 0.66),
    leaf: new Color3(0.42, 0.58, 0.2),
    leaves: 4200,
    leafSize: 0.25,
  },
  pine: {
    trunkHeight: 6.2,
    trunkRadius: 0.3,
    depth: 3,
    forks: 4,
    lengthFalloff: 0.6,
    radiusFalloff: 0.5,
    spread: 0.95,
    segments: 2,
    bark: new Color3(0.24, 0.18, 0.14),
    leaf: new Color3(0.15, 0.31, 0.16),
    leaves: 5000,
    leafSize: 0.2,
  },
  willow: {
    trunkHeight: 2.8,
    trunkRadius: 0.4,
    depth: 4,
    forks: 3,
    lengthFalloff: 0.8,
    radiusFalloff: 0.6,
    spread: 0.78,
    segments: 4,
    bark: new Color3(0.32, 0.26, 0.19),
    leaf: new Color3(0.36, 0.5, 0.19),
    leaves: 5000,
    leafSize: 0.31,
  },
} as const satisfies Record<string, TreeSpecies>;

export type TreeSpeciesName = keyof typeof TREE_SPECIES;
