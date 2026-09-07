import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../../core/WorldEntity";
import type { Footprint } from "../footprint";
import { createSeededRandom, seedFromText } from "../houses/seededRandom";
import type { BranchSpec } from "./branchSpec";
import { collideTree } from "./collideTree";
import { growTreeSkeleton } from "./growTreeSkeleton";
import { scatterLeaves } from "./scatterLeaves";
import { TreeCanopy } from "./TreeCanopy";
import { TreeBranches } from "./TreeBranches";
import { TREE_SPECIES, type TreeSpeciesName } from "./treeSpecies";

/** Grass is cleared this far past the trunk, so none grows out of the wood. */
const CLEARING = 0.5;

/**
 * One tree: its wood, its collision, and where it stands.
 *
 * The skeleton is grown at the origin and the mesh is then moved into place, so
 * a branch's coordinates are relative to its own tree. Offsetting four hundred
 * segments instead would buy nothing and cost four hundred vectors.
 *
 * **Every branch collides**, trunk to twig, through one merged invisible shell.
 * Within reach its boxes are upright so nothing can lift the player; higher up
 * they lie along the wood, where nothing can reach them anyway.
 */
export class Tree extends WorldEntity {
  readonly branches: TreeBranches;
  readonly canopy: TreeCanopy;
  readonly skeleton: readonly BranchSpec[];
  /** One invisible shell holding every branch. See collideTree. */
  private readonly solid: Mesh | null;

  constructor(
    scene: Scene,
    readonly name: string,
    readonly species: TreeSpeciesName,
    readonly centreX: number,
    readonly centreZ: number,
    bark: Material,
    leaf: Material,
  ) {
    super();
    const shape = TREE_SPECIES[species];
    this.skeleton = growTreeSkeleton(shape, createSeededRandom(seedFromText(name)));
    this.branches = new TreeBranches(scene, name, this.skeleton, bark);
    this.branches.mesh.position.set(centreX, 0, centreZ);

    // One random stream for the wood and another for the leaves, so changing
    // how leaves scatter does not regrow every tree in the wood.
    const leaves = scatterLeaves(
      this.skeleton,
      shape,
      createSeededRandom(seedFromText(`${name}-leaves`)),
    );
    this.canopy = new TreeCanopy(scene, name, leaves, leaf);
    this.canopy.mesh.position.set(centreX, 0, centreZ);

    this.solid = collideTree(scene, name, this.skeleton, new Vector3(centreX, 0, centreZ));
  }

  get id(): string {
    return this.name;
  }

  /** The ground the tree stands on, for keeping grass out of the trunk. */
  get footprint(): Footprint {
    const reach = TREE_SPECIES[this.species].trunkRadius + CLEARING;
    return {
      minX: this.centreX - reach,
      maxX: this.centreX + reach,
      minZ: this.centreZ - reach,
      maxZ: this.centreZ + reach,
    };
  }

  override dispose(): void {
    this.branches.dispose();
    this.canopy.dispose();
    this.solid?.dispose();
  }
}
