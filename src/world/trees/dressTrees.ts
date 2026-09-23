import { Color3 } from "@babylonjs/core/Maths/math.color";
import { EVERGREEN, leafColourAt } from "../seasons/leafColours";
import type { SeasonLook } from "../seasons/seasonLook";
import type { Tree } from "./Tree";
import type { SpeciesMaterials } from "./treeMaterials";
import { TREE_SPECIES, type TreeSpeciesName } from "./treeSpecies";

const SPECIES = Object.keys(TREE_SPECIES) as TreeSpeciesName[];
const colour = new Color3();

/**
 * Puts the year on the wood: the colour of each kind's leaves, and how many
 * of them are still on. Both are cheap — four material colours for the whole
 * wood, and a leaf count a tree can change for nothing.
 */
export function dressTrees(
  trees: readonly Tree[],
  materialsFor: (species: TreeSpeciesName) => SpeciesMaterials,
  look: SeasonLook,
): void {
  for (const species of SPECIES) {
    leafColourAt(species, look, colour);
    materialsFor(species).leaf.diffuseColor.copyFrom(colour);
  }
  for (const tree of trees) tree.setLeafShare(EVERGREEN[tree.species] ? 1 : look.leaves);
}
