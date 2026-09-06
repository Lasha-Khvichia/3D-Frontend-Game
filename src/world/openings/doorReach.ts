import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { isOutsideOf, type PlacedOpening } from "../houses/placeOpenings";
import type { HingedLeaf } from "./createHingedLeaf";
import { isWithin } from "./isWithin";

/** Being this close to the doorway counts as walking into the door. */
const DOORWAY_REACH = 1;
/** Being this close to the open leaf's far edge counts as leaning on it. */
const LEAF_EDGE_REACH = 0.75;

export function nearDoorway(player: Vector3, opening: PlacedOpening): boolean {
  return isWithin(player, opening.centre, DOORWAY_REACH);
}

/**
 * Judged at the leaf's far edge, not its middle.
 *
 * That is where a hand would go, and it is the part of an open door furthest
 * from the doorway — so leaning on it can never be confused with walking
 * through, which would slam the door behind whoever just opened it.
 */
export function nearLeafEdge(player: Vector3, leaf: HingedLeaf): boolean {
  return isWithin(player, leaf.freeEdge(), LEAF_EDGE_REACH);
}

/** The bar is an inside fitting, so only someone inside can reach it. */
export function canReachBar(player: Vector3, opening: PlacedOpening): boolean {
  return !isOutsideOf(opening, player) && nearDoorway(player, opening);
}
