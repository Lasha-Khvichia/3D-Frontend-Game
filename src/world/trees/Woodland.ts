import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { WorldEntity } from "../../core/WorldEntity";
import type { Footprint } from "../footprint";
import { Tree } from "./Tree";
import { createTreeMaterials } from "./treeMaterials";
import type { TreeWind } from "./TreeWind";
import { SHADOW_RANGE, tierFor } from "./treeDetail";
import { TREE_PLACEMENTS } from "./treeLayout";

/**
 * Every tree in the world.
 *
 * One bark material per species, shared by every tree of that kind, so four
 * oaks cost one material rather than four. The trees themselves each keep their
 * own instance buffer, which is what lets a tree be culled when it is behind
 * you: a single buffer for the whole wood could never be.
 */
/** What the woodland needs from whoever owns the sun. */
export type ShadowRegistry = {
  addShadowCaster(mesh: AbstractMesh): void;
  removeShadowCaster(mesh: AbstractMesh): void;
};

export class Woodland extends WorldEntity {
  readonly trees: Tree[];
  /** Trees currently in the shadow map. */
  private readonly casting = new Set<Tree>();

  constructor(
    scene: Scene,
    wind: TreeWind,
    private readonly shadows: ShadowRegistry,
  ) {
    super();
    const materialsFor = createTreeMaterials(scene, wind);

    this.trees = TREE_PLACEMENTS.map((spot) => {
      const materials = materialsFor(spot.species);
      return new Tree(
        scene,
        spot.name,
        spot.species,
        spot.x,
        spot.z,
        materials.bark,
        materials.leaf,
      );
    });
  }

  get id(): string {
    return "woodland";
  }

  /**
   * Thins distant canopies, and keeps only nearby trees in the shadow map. The
   * shadow box is a fixed 48 m, so a tree beyond it is drawn into the map every
   * frame and casts nothing anyone can see. With forty trees that is most.
   */
  update(player: Vector3): void {
    // Changing a tree's tier rewrites its whole canopy, so at most one tree may
    // change per step. Several at once would show as a hitch.
    let changed = false;

    for (const tree of this.trees) {
      const distance = Math.hypot(player.x - tree.centreX, player.z - tree.centreZ);
      const wantedTier = tierFor(distance, tree.detail);
      if (!changed && wantedTier !== tree.detail) changed = tree.setDetail(wantedTier);

      const wanted = distance < SHADOW_RANGE;
      if (wanted === this.casting.has(tree)) continue;
      for (const mesh of [tree.branches.mesh, tree.canopy.mesh]) {
        if (wanted) this.shadows.addShadowCaster(mesh);
        else this.shadows.removeShadowCaster(mesh);
      }
      if (wanted) this.casting.add(tree);
      else this.casting.delete(tree);
    }
  }

  /** How many trees are in the shadow map right now. */
  get castingCount(): number {
    return this.casting.size;
  }

  get leafCount(): number {
    return this.trees.reduce((total, tree) => total + tree.canopy.count, 0);
  }

  /** Passed to the grass, so none grows out of a trunk. */
  get footprints(): Footprint[] {
    return this.trees.map((tree) => tree.footprint);
  }

  override dispose(): void {
    for (const tree of this.trees) tree.dispose();
  }
}
