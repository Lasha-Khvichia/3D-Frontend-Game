import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import { WorldEntity } from "../../core/WorldEntity";
import type { Footprint } from "../footprint";
import { Tree } from "./Tree";
import { LEAF_WIND, TreeWind, WOOD_WIND } from "./TreeWind";
import { TREE_PLACEMENTS } from "./treeLayout";
import { TREE_SPECIES } from "./treeSpecies";

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

  constructor(scene: Scene, wind: TreeWind) {
    super();
    // One material per species rather than per tree, so four oaks share one and
    // the wind is attached to it once.
    const shared = new Map<string, StandardMaterial>();
    const materialFor = (
      key: string,
      colour: Color3,
      leaf: boolean,
      strength: typeof WOOD_WIND,
    ): StandardMaterial => {
      const existing = shared.get(key);
      if (existing) return existing;
      const material = new StandardMaterial(key, scene);
      material.diffuseColor = colour;
      // Specular on bark or leaves under a moving sun reads as wet plastic.
      material.specularColor = Color3.Black();
      // Leaves are seen from both sides. twoSidedLighting stays off: it flips
      // the normal for the back face, which is right for a solid and wrong
      // here, where a leaf lit from behind should read as lit, not black.
      if (leaf) material.backFaceCulling = false;
      wind.applyTo(material, strength);
      shared.set(key, material);
      return material;
    };

    this.trees = TREE_PLACEMENTS.map((spot) => {
      const shape = TREE_SPECIES[spot.species];
      return new Tree(
        scene,
        spot.name,
        spot.species,
        spot.x,
        spot.z,
        materialFor(`bark-${spot.species}`, shape.bark, false, WOOD_WIND),
        materialFor(`leaf-${spot.species}`, shape.leaf, true, LEAF_WIND),
      );
    });
  }

  get id(): string {
    return "woodland";
  }

  /** Wood casts a shadow. Registered by the caller, which owns the sun. */
  get shadowCasters(): AbstractMesh[] {
    return this.trees.map((tree) => tree.branches.mesh);
  }

  /** Leaves are far too many to shadow, but they should take one. */
  get shadowReceivers(): AbstractMesh[] {
    return this.trees.map((tree) => tree.canopy.mesh);
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
