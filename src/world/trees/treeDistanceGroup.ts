import type { DistanceGroup } from "../ShownByDistance";
import type { Tree } from "./Tree";

/** Far enough from the trunk to take in the widest crown. */
const CROWN_REACH = 12;

/** A tree as one thing to hide at a distance: its wood, its leaves and its shell. */
export function treeDistanceGroup(tree: Tree): DistanceGroup {
  return {
    x: tree.centreX,
    z: tree.centreZ,
    radius: CROWN_REACH,
    nodes: [tree.branches.mesh, tree.canopy.mesh, ...(tree.solid ? [tree.solid] : [])],
  };
}
