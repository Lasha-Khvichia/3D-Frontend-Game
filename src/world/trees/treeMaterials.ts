import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Material } from "@babylonjs/core/Materials/material";
import type { Scene } from "@babylonjs/core/scene";
import { LEAF_WIND, WOOD_WIND, type TreeWind } from "./TreeWind";
import { TREE_SPECIES, type TreeSpeciesName } from "./treeSpecies";

export type SpeciesMaterials = { readonly bark: Material; readonly leaf: Material };

/**
 * One bark and one leaf material per species, shared by every tree of that kind.
 *
 * Per tree they would be forty of each, and the wind would be attached forty
 * times over instead of once.
 */
export function createTreeMaterials(
  scene: Scene,
  wind: TreeWind,
): (species: TreeSpeciesName) => SpeciesMaterials {
  const made = new Map<TreeSpeciesName, SpeciesMaterials>();

  return (species) => {
    const existing = made.get(species);
    if (existing) return existing;

    const shape = TREE_SPECIES[species];
    const bark = plainMaterial(scene, `bark-${species}`, shape.bark);
    wind.applyTo(bark, WOOD_WIND);

    const leaf = plainMaterial(scene, `leaf-${species}`, shape.leaf);
    // Leaves are seen from both sides. twoSidedLighting stays off: it flips the
    // normal for the back face, which is right for a solid and wrong here,
    // where a leaf lit from behind should read as lit, not black.
    leaf.backFaceCulling = false;
    wind.applyTo(leaf, LEAF_WIND);

    const pair = { bark, leaf };
    made.set(species, pair);
    return pair;
  };
}

function plainMaterial(scene: Scene, name: string, colour: Color3): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = colour;
  // Specular on bark or leaves under a moving sun reads as wet plastic.
  material.specularColor = Color3.Black();
  return material;
}
