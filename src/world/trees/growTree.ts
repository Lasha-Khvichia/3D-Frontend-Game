import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { createSeededRandom, seedFromText } from "../houses/seededRandom";
import type { BranchSpec } from "./branchSpec";
import { collideTree } from "./collideTree";
import { growTreeSkeleton } from "./growTreeSkeleton";
import { scatterLeaves } from "./scatterLeaves";
import { TreeBranches } from "./TreeBranches";
import { TreeCanopy } from "./TreeCanopy";
import { TREE_SPECIES, type TreeSpeciesName } from "./treeSpecies";

/** What one tree is made of. */
export type TreeParts = {
  readonly skeleton: readonly BranchSpec[];
  readonly branches: TreeBranches;
  readonly canopy: TreeCanopy;
  /** One invisible shell holding every branch. See `collideTree`. */
  readonly solid: Mesh | null;
};

/**
 * Grows one tree at the origin and moves it into place, so a branch's
 * coordinates stay relative to its own tree. Offsetting four hundred segments
 * instead would buy nothing and cost four hundred vectors.
 */
export function growTree(
  scene: Scene,
  name: string,
  species: TreeSpeciesName,
  at: Vector3,
  bark: Material,
  leaf: Material,
): TreeParts {
  const shape = TREE_SPECIES[species];
  const skeleton = growTreeSkeleton(shape, createSeededRandom(seedFromText(name)));
  const branches = new TreeBranches(scene, name, skeleton, bark);
  branches.mesh.position.copyFrom(at);

  // One random stream for the wood and another for the leaves, so changing how
  // leaves scatter does not regrow every tree in the wood.
  const leaves = scatterLeaves(skeleton, shape, createSeededRandom(seedFromText(`${name}-leaves`)));
  const canopy = new TreeCanopy(scene, name, leaves, leaf);
  canopy.mesh.position.copyFrom(at);

  return { skeleton, branches, canopy, solid: collideTree(scene, name, skeleton, at) };
}
