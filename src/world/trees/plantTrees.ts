import type { Scene } from "@babylonjs/core/scene";
import type { Ground } from "../terrain/Ground";
import { Tree } from "./Tree";
import type { SpeciesMaterials } from "./treeMaterials";
import { TREE_PLACEMENTS } from "./treeLayout";
import type { TreeSpeciesName } from "./treeSpecies";

/** Grows every tree of the wood where `treeLayout` scattered it, standing on the ground. */
export function plantTrees(
  scene: Scene,
  materialsFor: (species: TreeSpeciesName) => SpeciesMaterials,
  ground: Ground,
): Tree[] {
  return TREE_PLACEMENTS.map((spot) => {
    const materials = materialsFor(spot.species);
    const base = ground.heightAt(spot.x, spot.z);
    return new Tree(
      scene,
      spot.name,
      spot.species,
      spot.x,
      spot.z,
      base,
      materials.bark,
      materials.leaf,
    );
  });
}
