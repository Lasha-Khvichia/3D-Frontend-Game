import type { Scene } from "@babylonjs/core/scene";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { WorldEntity } from "../../core/WorldEntity";
import type { GrassBlocker } from "../grassBlockers";
import type { Tree } from "./Tree";
import { dressTrees } from "./dressTrees";
import type { SeasonLook } from "../seasons/seasonLook";
import { createTreeMaterials, type SpeciesMaterials } from "./treeMaterials";
import type { TreeSpeciesName } from "./treeSpecies";
import type { TreeWind } from "./TreeWind";
import { SHADOW_RANGE, tierFor } from "./treeDetail";
import { plantTrees } from "./plantTrees";
import type { Ground } from "../terrain/Ground";
import type { ShadowRegistry } from "./ShadowRegistry";

/**
 * Every tree in the world.
 *
 * One bark material per species, shared by every tree of that kind, so four
 * oaks cost one material rather than four. The trees themselves each keep their
 * own instance buffer, which is what lets a tree be culled when it is behind
 * you: a single buffer for the whole wood could never be.
 */
export class Woodland extends WorldEntity {
  readonly trees: Tree[];
  /** Trees currently in the shadow map, and how near a tree must be to be in it. */
  private readonly casting = new Set<Tree>();
  private shadowRange = SHADOW_RANGE;
  /** One bark and one leaf material per kind, so the year recolours a wood in four writes. */
  private readonly materialsFor: (species: TreeSpeciesName) => SpeciesMaterials;

  constructor(
    scene: Scene,
    wind: TreeWind,
    private readonly shadows: ShadowRegistry,
    ground: Ground,
  ) {
    super();
    this.materialsFor = createTreeMaterials(scene, wind);

    this.trees = plantTrees(scene, this.materialsFor, ground);
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

      const wanted = distance < this.shadowRange;
      if (wanted === this.casting.has(tree)) continue;
      for (const mesh of [tree.branches.mesh, tree.canopy.mesh]) {
        if (wanted) this.shadows.addShadowCaster(mesh);
        else this.shadows.removeShadowCaster(mesh);
      }
      if (wanted) this.casting.add(tree);
      else this.casting.delete(tree);
    }
  }

  /** Metres within which trees cast shadows: as far as the shadows reach. */
  setShadowRange(metres: number): void {
    this.shadowRange = metres;
  }

  /** Where the year stands: leaf colour by kind, and how many leaves are on. */
  setSeason(look: SeasonLook): void {
    dressTrees(this.trees, this.materialsFor, look);
  }

  /** Passed to the grass, so none grows out of a trunk. */
  get grassBlockers(): GrassBlocker[] {
    return this.trees.map((tree) => tree.grassBlocker);
  }

  override dispose(): void {
    for (const tree of this.trees) tree.dispose();
  }
}
