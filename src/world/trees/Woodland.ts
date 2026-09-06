import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../../core/WorldEntity";
import type { Footprint } from "../footprint";
import { Tree } from "./Tree";
import { TREE_PLACEMENTS } from "./treeLayout";
import { TREE_SPECIES, type TreeSpeciesName } from "./treeSpecies";

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

  constructor(scene: Scene) {
    super();
    const barks = new Map<TreeSpeciesName, StandardMaterial>();
    const barkFor = (species: TreeSpeciesName): StandardMaterial => {
      const existing = barks.get(species);
      if (existing) return existing;
      const material = new StandardMaterial(`bark-${species}`, scene);
      material.diffuseColor = TREE_SPECIES[species].bark;
      // Specular on bark under a moving sun reads as wet plastic.
      material.specularColor = Color3.Black();
      barks.set(species, material);
      return material;
    };

    this.trees = TREE_PLACEMENTS.map(
      (spot) => new Tree(scene, spot.name, spot.species, spot.x, spot.z, barkFor(spot.species)),
    );
  }

  get id(): string {
    return "woodland";
  }

  /** Wood casts a shadow. Registered by the caller, which owns the sun. */
  get shadowCasters(): AbstractMesh[] {
    return this.trees.map((tree) => tree.branches.mesh);
  }

  /** Passed to the grass, so none grows out of a trunk. */
  get footprints(): Footprint[] {
    return this.trees.map((tree) => tree.footprint);
  }

  override dispose(): void {
    for (const tree of this.trees) tree.dispose();
  }
}
