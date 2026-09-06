import type { TreeSpeciesName } from "./treeSpecies";

export type TreePlacement = {
  readonly name: string;
  readonly species: TreeSpeciesName;
  readonly x: number;
  readonly z: number;
};

/**
 * Where the trees stand.
 *
 * Ringed around the village rather than in it: the houses occupy roughly x -39
 * to 30 and z 18 to 43, and the street between them has to stay open. Every
 * tree here is clear of both, and no two are within eight metres of each other.
 *
 * Twelve for now. The count goes up once there is a level-of-detail system to
 * carry it; forty full-detail trees before then would only prove that forty
 * full-detail trees are slow.
 */
export const TREE_PLACEMENTS: readonly TreePlacement[] = [
  { name: "oak-west-gate", species: "oak", x: -46, z: 34 },
  { name: "birch-north-lane", species: "birch", x: -44, z: 46 },
  { name: "pine-north-ridge", species: "pine", x: -30, z: 52 },
  { name: "oak-behind-hall", species: "oak", x: -10, z: 54 },
  { name: "willow-north-pool", species: "willow", x: 8, z: 51 },
  { name: "pine-north-east", species: "pine", x: 26, z: 53 },
  { name: "birch-east-gate", species: "birch", x: 40, z: 40 },
  { name: "oak-east-field", species: "oak", x: 44, z: 26 },
  { name: "willow-south-east", species: "willow", x: 30, z: 10 },
  { name: "pine-south-field", species: "pine", x: 6, z: 8 },
  { name: "birch-south-lane", species: "birch", x: -18, z: 9 },
  { name: "oak-south-west", species: "oak", x: -40, z: 14 },
];
