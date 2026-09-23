import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../../core/WorldEntity";
import { circleBlocker, type GrassBlocker } from "../grassBlockers";
import type { BranchSpec } from "./branchSpec";
import { growTree } from "./growTree";
import type { TreeCanopy } from "./TreeCanopy";
import type { TreeBranches } from "./TreeBranches";
import { LEAF_SHARE, LEAF_SIZE, type DetailTier } from "./treeDetail";
import { TREE_SPECIES, type TreeSpeciesName } from "./treeSpecies";

/** The trunk is a many-sided tube; this covers its corners, so no blade shows through the bark. */
const BARK = 0.02;

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
  readonly solid: Mesh | null;
  private tier: DetailTier = "near";
  private leafShare = 1;

  constructor(
    scene: Scene,
    readonly name: string,
    readonly species: TreeSpeciesName,
    readonly centreX: number,
    readonly centreZ: number,
    readonly baseY: number,
    bark: Material,
    leaf: Material,
  ) {
    super();
    const parts = growTree(scene, name, species, new Vector3(centreX, baseY, centreZ), bark, leaf);
    this.skeleton = parts.skeleton;
    this.branches = parts.branches;
    this.canopy = parts.canopy;
    this.solid = parts.solid;
  }

  get id(): string {
    return this.name;
  }

  get detail(): DetailTier {
    return this.tier;
  }

  /** Thins the canopy for distance, growing what remains to keep it solid. */
  setDetail(tier: DetailTier): boolean {
    if (tier === this.tier) return false;
    this.tier = tier;
    this.dressCanopy();
    return true;
  }

  /**
   * How many of its leaves the year leaves on it: 0 bare in winter, 1 in full
   * leaf. Drawing fewer is free — the leaves are scattered through the buffer,
   * so a prefix of them is spread through the whole canopy.
   */
  setLeafShare(share: number): void {
    if (Math.abs(share - this.leafShare) < 0.004) return;
    this.leafShare = share;
    this.dressCanopy();
  }

  private dressCanopy(): void {
    const drawn = this.canopy.count * LEAF_SHARE[this.tier] * this.leafShare;
    this.canopy.setDrawnCount(drawn, LEAF_SIZE[this.tier]);
  }

  /** The trunk, for the grass: none inside it, and short at its foot. */
  get grassBlocker(): GrassBlocker {
    return circleBlocker(this.centreX, this.centreZ, TREE_SPECIES[this.species].trunkRadius + BARK);
  }

  override dispose(): void {
    this.branches.dispose();
    this.canopy.dispose();
    this.solid?.dispose();
  }
}
