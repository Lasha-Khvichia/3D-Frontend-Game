import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { fireFlicker } from "../fire/fireFlicker";
import type { LampSource } from "./chooseLamps";

/** Metres a carried lantern lights around it: a little less than one on a post. */
const REACH = 6.5;

/** A lamp that moves. Everything else in the field stands still. */
export type MovingLamp = Omit<LampSource, "x" | "y" | "z"> & {
  x: number;
  y: number;
  z: number;
};

/**
 * The lamp of a lantern the player is carrying.
 *
 * It hangs free, so it has no wall to stop its light at, and it never gives
 * way: a lamp in your own hand should always be one of the ones chosen.
 */
export function heldLamp(): MovingLamp {
  return {
    x: 0,
    y: 0,
    z: 0,
    range: REACH,
    outX: 0,
    outZ: 0,
    gap: 0,
    giveWay: -REACH,
    house: -1,
    glow: new Color3(0, 0, 0),
  };
}

/** Moves the carried lamp to where the lantern hangs and sets it burning. */
export function burnCarried(
  lamp: MovingLamp,
  at: Vector3 | null,
  colour: Color3,
  strength: number,
): void {
  if (!at) {
    lamp.glow.set(0, 0, 0);
    return;
  }
  [lamp.x, lamp.y, lamp.z] = [at.x, at.y, at.z];
  colour.scaleToRef(strength, lamp.glow);
}

/** A flame behind glass: the fire's flicker, gentler. */
export function lanternFlicker(seconds: number): number {
  return 0.92 + 0.45 * (fireFlicker(seconds * 0.8) - 0.82);
}
