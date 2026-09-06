import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../../core/WorldEntity";
import type { Footprint } from "../footprint";
import { createSeededRandom, seedFromText } from "../houses/seededRandom";
import type { BranchSpec } from "./branchSpec";
import { growTreeSkeleton } from "./growTreeSkeleton";
import { TreeBranches } from "./TreeBranches";
import { TREE_SPECIES, type TreeSpeciesName } from "./treeSpecies";

/**
 * How wide the trunk's collider is, as a share of the trunk's radius.
 *
 * A square box inside a round trunk would need 1.41. A little wider than that
 * lets the player brush the bark rather than stopping short of it, and the
 * narrowest trunk here is still 0.35 m across — far thicker than the 0.133 m a
 * sprinting player covers in one step, which is what stops them passing through.
 */
const TRUNK_COLLIDER_SHARE = 1.6;
/** Grass is cleared this far past the trunk, so none grows out of the wood. */
const CLEARING = 0.5;

/**
 * One tree: its wood, its collision, and where it stands.
 *
 * The skeleton is grown at the origin and the mesh is then moved into place, so
 * a branch's coordinates are relative to its own tree. Offsetting four hundred
 * segments instead would buy nothing and cost four hundred vectors.
 *
 * **Only the trunk collides.** A branch collider is a sloped surface, and
 * Babylon's solver slides the player along whatever it hits, so branches would
 * carry the player up into the canopy. Leaves never collide either.
 */
export class Tree extends WorldEntity {
  readonly branches: TreeBranches;
  readonly skeleton: readonly BranchSpec[];
  private readonly trunk: Mesh;

  constructor(
    scene: Scene,
    readonly name: string,
    readonly species: TreeSpeciesName,
    readonly centreX: number,
    readonly centreZ: number,
    bark: Material,
  ) {
    super();
    const shape = TREE_SPECIES[species];
    this.skeleton = growTreeSkeleton(shape, createSeededRandom(seedFromText(name)));
    this.branches = new TreeBranches(scene, name, this.skeleton, bark);
    this.branches.mesh.position.set(centreX, 0, centreZ);

    const side = shape.trunkRadius * TRUNK_COLLIDER_SHARE;
    this.trunk = CreateBox(
      `${name}-trunk-collider`,
      { width: side, height: shape.trunkHeight, depth: side },
      scene,
    );
    this.trunk.position.set(centreX, shape.trunkHeight / 2, centreZ);
    this.trunk.isVisible = false;
    this.trunk.isPickable = false;
    this.trunk.checkCollisions = true;
    this.trunk.freezeWorldMatrix();
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
    this.trunk.dispose();
  }
}
