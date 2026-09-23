import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TREE_SPECIES, type TreeSpeciesName } from "../trees/treeSpecies";
import type { SeasonLook } from "./seasonLook";

/** Which kinds keep their leaves through the winter. A pine is green in every month. */
export const EVERGREEN: Record<TreeSpeciesName, boolean> = {
  oak: false,
  birch: false,
  pine: true,
  willow: false,
};

/** What each kind turns before its leaves come down. */
const AUTUMN: Record<TreeSpeciesName, Color3> = {
  oak: new Color3(0.45, 0.24, 0.09),
  birch: new Color3(0.72, 0.55, 0.13),
  pine: new Color3(0.15, 0.31, 0.16),
  willow: new Color3(0.66, 0.58, 0.2),
};

/** What each kind shows when it flowers: catkins and blossom, pale against the new leaves. */
const BLOSSOM: Record<TreeSpeciesName, Color3 | null> = {
  oak: null,
  birch: new Color3(0.78, 0.76, 0.6),
  pine: null,
  willow: new Color3(0.72, 0.7, 0.35),
};

/** New leaves are lighter and yellower than the summer's. */
const FRESH = new Color3(0.55, 0.72, 0.28);
const FRESHNESS = 0.5;

/**
 * The colour of one kind's leaves at this moment of the year.
 *
 * Every tree of a kind shares one material, so this is four colours for the
 * whole wood. The order matters: summer green turns to autumn, spring lightens
 * what is left, and the flowers go on top of both.
 */
export function leafColourAt(species: TreeSpeciesName, look: SeasonLook, out: Color3): void {
  out.copyFrom(TREE_SPECIES[species].leaf);
  if (EVERGREEN[species]) return;
  mixInto(out, AUTUMN[species], look.turn);
  mixInto(out, FRESH, look.blossom * FRESHNESS);
  const flowers = BLOSSOM[species];
  if (flowers) mixInto(out, flowers, look.blossom);
}

function mixInto(out: Color3, towards: Color3, share: number): void {
  if (share <= 0) return;
  out.r += (towards.r - out.r) * share;
  out.g += (towards.g - out.g) * share;
  out.b += (towards.b - out.b) * share;
}
