import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Tree } from "../trees/Tree";

/** Metres a leaf falls a second, and how far it swings on the way down. */
const FALLS = 0.9;
const SWING = 0.5;
/** A leaf leaves its tree from within this of the trunk, and from this high up in it. */
const CANOPY = 3.5;
const CANOPY_TOP = 7;

/** One leaf in the air: where it is, which tree it came off, and its own timing. */
export type Falling = {
  readonly at: Vector3;
  readonly spin: number;
  readonly phase: number;
  /** The height it lands at; below this it is given back to a tree. */
  ground: number;
};

export function createFalling(): Falling {
  return { at: new Vector3(0, -1000, 0), spin: turn(), phase: turn(), ground: 0 };
}

/** One step of a leaf's fall: down, and swinging as it goes. */
export function dropLeaf(leaf: Falling, seconds: number, clock: number): void {
  leaf.at.y -= FALLS * seconds;
  const swing = clock * 1.7 + leaf.phase;
  leaf.at.x += Math.cos(swing) * SWING * seconds;
  leaf.at.z += Math.sin(swing * 0.8) * SWING * seconds;
}

/**
 * Puts a leaf up in the canopy of one of these trees, chosen at random. With
 * no tree near, it is parked far under the ground where nothing can see it.
 */
export function giveToTree(leaf: Falling, near: readonly Tree[]): void {
  const tree = near[Math.floor(Math.random() * near.length)];
  if (!tree) {
    // Out of sight, and above its own ground, so it asks again next frame.
    leaf.at.y = -1000;
    leaf.ground = -999;
    return;
  }
  const angle = Math.random() * Math.PI * 2;
  const away = Math.sqrt(Math.random()) * CANOPY;
  leaf.ground = tree.baseY;
  leaf.at.set(
    tree.centreX + Math.cos(angle) * away,
    tree.baseY + CANOPY_TOP * (0.5 + Math.random() * 0.5),
    tree.centreZ + Math.sin(angle) * away,
  );
}

function turn(): number {
  return Math.random() * Math.PI * 2;
}
